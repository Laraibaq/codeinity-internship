import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

export interface WalletOperationParams {
  userId: string;
  userRole: string;
  amount: Prisma.Decimal | number | string;
  referenceType:
    | 'ride_payment'
    | 'driver_earning'
    | 'refund'
    | 'topup'
    | 'platform_fee';
  referenceId?: string;
  idempotencyKey?: string;
  description?: string;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create a wallet for an authenticated passenger or driver
   */
  async getOrCreateWallet(userId: string, userRole: string) {
    const existing = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    try {
      return await this.prisma.wallet.create({
        data: {
          userId,
          userRole,
          balance: new Prisma.Decimal('0.00'),
          currency: 'PKR',
        },
      });
    } catch (err: any) {
      // Race condition safety: if another request created it concurrently
      if (err?.code === 'P2002') {
        const found = await this.prisma.wallet.findUnique({ where: { userId } });
        if (found) return found;
      }
      throw err;
    }
  }

  /**
   * Get wallet balance for a user
   */
  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  /**
   * Credit user's wallet atomically with immutable ledger entry
   */
  async creditWallet(params: WalletOperationParams) {
    const amountDecimal = new Prisma.Decimal(params.amount.toString());
    if (amountDecimal.lte(0)) {
      throw new BadRequestException('Credit amount must be greater than zero');
    }

    // Check idempotency first
    if (params.idempotencyKey) {
      const existingTx = await this.prisma.walletTransaction.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
      });
      if (existingTx) {
        this.logger.log(
          `Idempotent wallet credit detected: returning existing transaction ${existingTx.id}`,
        );
        const wallet = await this.prisma.wallet.findUnique({
          where: { id: existingTx.walletId },
        });
        return { transaction: existingTx, wallet };
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch or create wallet
      let wallet = await tx.wallet.findUnique({
        where: { userId: params.userId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: params.userId,
            userRole: params.userRole,
            balance: new Prisma.Decimal('0.00'),
            currency: 'PKR',
          },
        });
      }

      // 2. Atomic increment of wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amountDecimal },
          updatedAt: new Date(),
        },
      });

      const balanceAfter = new Prisma.Decimal(updatedWallet.balance.toString());
      const balanceBefore = balanceAfter.sub(amountDecimal);

      // 3. Create immutable ledger record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: params.userId,
          type: 'credit',
          amount: amountDecimal,
          currency: wallet.currency,
          referenceType: params.referenceType,
          referenceId: params.referenceId,
          balanceBefore,
          balanceAfter,
          idempotencyKey: params.idempotencyKey || null,
          description: params.description,
        },
      });

      this.logger.log(
        `Wallet credited: user=${params.userId}, amount=${amountDecimal.toString()}, newBalance=${balanceAfter.toString()}`,
      );

      return { transaction, wallet: updatedWallet };
    }, { timeout: 45000, maxWait: 25000 });
  }

  /**
   * Debit user's wallet atomically with immutable ledger entry
   */
  async debitWallet(params: WalletOperationParams) {
    const amountDecimal = new Prisma.Decimal(params.amount.toString());
    if (amountDecimal.lte(0)) {
      throw new BadRequestException('Debit amount must be greater than zero');
    }

    // Check idempotency first
    if (params.idempotencyKey) {
      const existingTx = await this.prisma.walletTransaction.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
      });
      if (existingTx) {
        this.logger.log(
          `Idempotent wallet debit detected: returning existing transaction ${existingTx.id}`,
        );
        const wallet = await this.prisma.wallet.findUnique({
          where: { id: existingTx.walletId },
        });
        return { transaction: existingTx, wallet };
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: params.userId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (wallet.balance.lessThan(amountDecimal)) {
        throw new BadRequestException(
          `Insufficient wallet balance: required ${amountDecimal.toString()}, available ${wallet.balance.toString()}`,
        );
      }

      // Atomic conditional decrement to prevent race conditions and double-spending
      const updateResult = await tx.wallet.updateMany({
        where: {
          id: wallet.id,
          balance: { gte: amountDecimal },
        },
        data: {
          balance: { decrement: amountDecimal },
          updatedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        const fresh = await tx.wallet.findUnique({ where: { id: wallet.id } });
        throw new BadRequestException(
          `Insufficient wallet balance: required ${amountDecimal.toString()}, available ${fresh?.balance.toString() ?? '0'}`,
        );
      }

      const freshWallet = (await tx.wallet.findUnique({ where: { id: wallet.id } }))!;
      const balanceAfter = new Prisma.Decimal(freshWallet.balance.toString());
      const balanceBefore = balanceAfter.add(amountDecimal);

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: params.userId,
          type: 'debit',
          amount: amountDecimal,
          currency: wallet.currency,
          referenceType: params.referenceType,
          referenceId: params.referenceId,
          balanceBefore,
          balanceAfter,
          idempotencyKey: params.idempotencyKey || null,
          description: params.description,
        },
      });

      this.logger.log(
        `Wallet debited: user=${params.userId}, amount=${amountDecimal.toString()}, newBalance=${balanceAfter.toString()}`,
      );

      return { transaction, wallet: freshWallet };
    }, { timeout: 45000, maxWait: 25000 });
  }

  /**
   * Get paginated ledger history for an authenticated user
   */
  async getTransactions(userId: string, limit = 20, offset = 0) {
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Math.max(1, limit)),
      skip: Math.max(0, offset),
    });

    const total = await this.prisma.walletTransaction.count({
      where: { userId },
    });

    return {
      transactions,
      total,
      limit,
      offset,
    };
  }

  /**
   * Verify financial reconciliation of a wallet against its immutable ledger entries
   */
  async reconcileWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const allTx = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'asc' },
    });

    let calculated = new Prisma.Decimal('0.00');
    for (const t of allTx) {
      if (t.type === 'credit') {
        calculated = calculated.add(t.amount);
      } else if (t.type === 'debit') {
        calculated = calculated.sub(t.amount);
      }
    }

    const currentBalance = new Prisma.Decimal(wallet.balance.toString());
    const isReconciled = calculated.equals(currentBalance);

    return {
      walletId: wallet.id,
      currentBalance: currentBalance.toString(),
      calculatedBalance: calculated.toString(),
      transactionCount: allTx.length,
      isReconciled,
    };
  }
}
