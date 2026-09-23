import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from './payments.service';
import { WalletService } from './wallet.service';
import { CashPaymentProvider } from './cash-payment.provider';
import { ExternalPaymentProvider } from './external-payment.provider';
import { PaymentMethodDtoEnum } from './dto/initiate-payment.dto';
import { Prisma } from '../../generated/prisma/client';

describe('PaymentsService & WalletService Unit Tests', () => {
  let paymentsService: PaymentsService;
  let walletService: WalletService;
  let externalProvider: ExternalPaymentProvider;
  let prisma: any;
  let realtimeService: any;
  let notificationsService: any;

  const mockPassengerId = '11111111-1111-1111-1111-111111111111';
  const mockDriverId = '22222222-2222-2222-2222-222222222222';
  const mockOtherUserId = '99999999-9999-9999-9999-999999999999';
  const mockRideId = '33333333-3333-3333-3333-333333333333';
  const mockPaymentId = '44444444-4444-4444-4444-444444444444';

  beforeEach(async () => {
    prisma = {
      ride: {
        findUnique: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      wallet: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      walletTransaction: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    realtimeService = {
      emitPaymentStatusChanged: jest.fn(),
    };

    notificationsService = {
      sendToUser: jest.fn().mockResolvedValue({ sent: 1, failed: 0 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        WalletService,
        CashPaymentProvider,
        ExternalPaymentProvider,
        { provide: PrismaService, useValue: prisma },
        { provide: RealtimeService, useValue: realtimeService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    paymentsService = module.get<PaymentsService>(PaymentsService);
    walletService = module.get<WalletService>(WalletService);
    externalProvider = module.get<ExternalPaymentProvider>(ExternalPaymentProvider);
  });

  describe('1. Payment Initiation & Amount Protection', () => {
    it('derives amount strictly from authoritative ride.finalFare (ignoring client amount)', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        passengerId: mockPassengerId,
        driverId: mockDriverId,
        status: 'completed',
        finalFare: new Prisma.Decimal('25.50'),
        proposedFare: new Prisma.Decimal('20.00'),
      });

      prisma.payment.upsert.mockResolvedValue({
        id: mockPaymentId,
        rideId: mockRideId,
        passengerId: mockPassengerId,
        driverId: mockDriverId,
        amount: new Prisma.Decimal('25.50'),
        currency: 'PKR',
        paymentMethod: 'cash',
        status: 'pending',
      });

      const result = await paymentsService.initiatePayment(
        mockPassengerId,
        mockRideId,
        PaymentMethodDtoEnum.cash,
      );

      expect(result.amount.toString()).toBe('25.5');
      expect(prisma.payment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            amount: new Prisma.Decimal('25.50'),
          }),
        }),
      );
    });

    it('rejects payment initiation if caller does not own the ride', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        passengerId: mockPassengerId,
        driverId: mockDriverId,
        status: 'completed',
        finalFare: new Prisma.Decimal('25.50'),
      });

      await expect(
        paymentsService.initiatePayment(
          mockOtherUserId,
          mockRideId,
          PaymentMethodDtoEnum.cash,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns existing payment if already succeeded (idempotent)', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        passengerId: mockPassengerId,
        driverId: mockDriverId,
        status: 'completed',
        finalFare: new Prisma.Decimal('25.50'),
      });

      prisma.payment.findUnique.mockResolvedValue({
        id: mockPaymentId,
        rideId: mockRideId,
        status: 'succeeded',
        amount: new Prisma.Decimal('25.50'),
      });

      const result = await paymentsService.initiatePayment(
        mockPassengerId,
        mockRideId,
        PaymentMethodDtoEnum.cash,
      );

      expect(result.id).toBe(mockPaymentId);
      expect(result.status).toBe('succeeded');
      expect(prisma.payment.upsert).not.toHaveBeenCalled();
    });
  });

  describe('2. Payment Confirmation & Idempotency', () => {
    it('confirms cash payment successfully and broadcasts realtime event', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: mockPaymentId,
        rideId: mockRideId,
        passengerId: mockPassengerId,
        driverId: mockDriverId,
        amount: new Prisma.Decimal('25.50'),
        currency: 'PKR',
        paymentMethod: 'cash',
        status: 'pending',
      });

      prisma.payment.update.mockResolvedValue({
        id: mockPaymentId,
        rideId: mockRideId,
        passengerId: mockPassengerId,
        driverId: mockDriverId,
        amount: new Prisma.Decimal('25.50'),
        currency: 'PKR',
        paymentMethod: 'cash',
        status: 'succeeded',
        paidAt: new Date(),
      });

      const res = await paymentsService.confirmPayment(
        mockDriverId,
        'driver',
        mockPaymentId,
      );

      expect(res.payment.status).toBe('succeeded');
      expect(res.isAlreadyConfirmed).toBe(false);
      expect(realtimeService.emitPaymentStatusChanged).toHaveBeenCalled();
    });

    it('rejects cash payment confirmation attempt from passenger', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: mockPaymentId,
        rideId: mockRideId,
        passengerId: mockPassengerId,
        driverId: mockDriverId,
        amount: new Prisma.Decimal('25.50'),
        currency: 'PKR',
        paymentMethod: 'cash',
        status: 'pending',
      });

      await expect(
        paymentsService.confirmPayment(
          mockPassengerId,
          'passenger',
          mockPaymentId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns isAlreadyConfirmed true when payment is already succeeded (idempotency shield)', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: mockPaymentId,
        rideId: mockRideId,
        passengerId: mockPassengerId,
        driverId: mockDriverId,
        status: 'succeeded',
      });

      const res = await paymentsService.confirmPayment(
        mockDriverId,
        'driver',
        mockPaymentId,
      );

      expect(res.isAlreadyConfirmed).toBe(true);
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it('rejects confirmation attempt from unauthorized non-participant', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: mockPaymentId,
        rideId: mockRideId,
        passengerId: mockPassengerId,
        driverId: mockDriverId,
        status: 'pending',
      });

      await expect(
        paymentsService.confirmPayment(
          mockOtherUserId,
          'passenger',
          mockPaymentId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. Wallet Ledger & Concurrency Protection', () => {
    it('credits wallet atomically and creates immutable ledger transaction', async () => {
      prisma.wallet.findUnique.mockResolvedValue({
        id: 'w1',
        userId: mockPassengerId,
        balance: new Prisma.Decimal('100.00'),
        currency: 'PKR',
      });

      prisma.wallet.update.mockResolvedValue({
        id: 'w1',
        userId: mockPassengerId,
        balance: new Prisma.Decimal('150.00'),
        currency: 'PKR',
      });

      prisma.walletTransaction.create.mockResolvedValue({
        id: 'tx1',
        walletId: 'w1',
        userId: mockPassengerId,
        type: 'credit',
        amount: new Prisma.Decimal('50.00'),
        balanceBefore: new Prisma.Decimal('100.00'),
        balanceAfter: new Prisma.Decimal('150.00'),
      });

      const result = await walletService.creditWallet({
        userId: mockPassengerId,
        userRole: 'passenger',
        amount: 50.0,
        referenceType: 'topup',
      });

      expect(result.wallet.balance.toString()).toBe('150');
      expect(prisma.walletTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'credit',
            amount: new Prisma.Decimal('50'),
          }),
        }),
      );
    });

    it('prevents overdraft: rejects debit if wallet balance is insufficient', async () => {
      prisma.wallet.findUnique.mockResolvedValue({
        id: 'w1',
        userId: mockPassengerId,
        balance: new Prisma.Decimal('10.00'),
        currency: 'PKR',
      });

      await expect(
        walletService.debitWallet({
          userId: mockPassengerId,
          userRole: 'passenger',
          amount: 50.0,
          referenceType: 'ride_payment',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. External Provider Boundary & Webhooks', () => {
    it('external provider reports unavailable when environment credentials are not present', async () => {
      const res = await externalProvider.initiatePayment({
        paymentId: 'p1',
        rideId: mockRideId,
        passengerId: mockPassengerId,
        driverId: mockDriverId,
        amount: new Prisma.Decimal('20.00'),
        currency: 'PKR',
      });

      expect(res.success).toBe(false);
      expect(res.failureReason).toBe(
        'NOT VERIFIED — provider credentials/environment unavailable',
      );
      expect(res.isMockOrUnavailable).toBe(true);
    });

    it('rejects unsigned or invalid webhook signatures', async () => {
      await expect(
        paymentsService.handleWebhook(
          { event: 'payment.succeeded' },
          'invalid_signature_xyz',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('5. Refunds & State Transitions', () => {
    it('rejects refund on pending payment', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: mockPaymentId,
        passengerId: mockPassengerId,
        driverId: mockDriverId,
        status: 'pending',
      });

      await expect(
        paymentsService.refundPayment(
          mockPassengerId,
          'passenger',
          mockPaymentId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('refunds succeeded payment and returns isAlreadyRefunded false', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: mockPaymentId,
        rideId: mockRideId,
        passengerId: mockPassengerId,
        driverId: mockDriverId,
        amount: new Prisma.Decimal('25.00'),
        status: 'succeeded',
        paymentMethod: 'cash',
      });

      prisma.payment.update.mockResolvedValue({
        id: mockPaymentId,
        status: 'refunded',
        refundedAmount: new Prisma.Decimal('25.00'),
      });

      const res = await paymentsService.refundPayment(
        mockPassengerId,
        'passenger',
        mockPaymentId,
      );

      expect(res.isAlreadyRefunded).toBe(false);
      expect(res.payment.status).toBe('refunded');
    });

    it('returns isAlreadyRefunded true when payment was already refunded (idempotent)', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: mockPaymentId,
        passengerId: mockPassengerId,
        driverId: mockDriverId,
        status: 'refunded',
      });

      const res = await paymentsService.refundPayment(
        mockPassengerId,
        'passenger',
        mockPaymentId,
      );

      expect(res.isAlreadyRefunded).toBe(true);
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });
  });
});
