import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from './wallet.service';
import { CashPaymentProvider } from './cash-payment.provider';
import { ExternalPaymentProvider } from './external-payment.provider';
import { PaymentMethodDtoEnum } from './dto/initiate-payment.dto';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly cashProvider: CashPaymentProvider,
    private readonly externalProvider: ExternalPaymentProvider,
    private readonly realtimeService: RealtimeService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Initiate payment for an active or completed ride.
   * Money Safety Rule: Authoritative amount is ALWAYS derived from Ride.finalFare ?? Ride.proposedFare.
   * Client-supplied amount is strictly ignored/prevented from dictating the charge.
   */
  async initiatePayment(
    passengerId: string,
    rideId: string,
    method: PaymentMethodDtoEnum,
    idempotencyKey?: string,
  ) {
    // 1. Fetch ride and verify ownership
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.passengerId !== passengerId) {
      throw new ForbiddenException('You do not own this ride');
    }

    if (ride.status === 'cancelled') {
      throw new BadRequestException('Cannot initiate payment for a cancelled ride');
    }

    if (!ride.driverId) {
      throw new BadRequestException('Ride has not been accepted by a driver yet');
    }

    // 2. Authoritative PostgreSQL fare calculation
    const authoritativeFare = ride.finalFare ?? ride.proposedFare;
    if (!authoritativeFare || authoritativeFare.lte(0)) {
      throw new BadRequestException('Ride has an invalid or zero authoritative fare');
    }

    // 3. Idempotency & existing payment check
    if (idempotencyKey) {
      const existingByIdempotency = await this.prisma.payment.findUnique({
        where: { idempotencyKey },
      });
      if (existingByIdempotency) {
        this.logger.log(
          `Idempotent payment initiation: returning existing payment ${existingByIdempotency.id}`,
        );
        return existingByIdempotency;
      }
    }

    const existingByRide = await this.prisma.payment.findUnique({
      where: { rideId },
    });

    if (existingByRide) {
      if (existingByRide.status === 'succeeded') {
        this.logger.log(
          `Ride ${rideId} already has a succeeded payment (${existingByRide.id})`,
        );
        return existingByRide;
      }

      // If existing payment is pending/processing and matches method, return it
      if (
        (existingByRide.status === 'pending' || existingByRide.status === 'processing') &&
        existingByRide.paymentMethod === method
      ) {
        return existingByRide;
      }
    }

    // 4. Wallet pre-flight balance check
    if (method === PaymentMethodDtoEnum.wallet) {
      const wallet = await this.walletService.getOrCreateWallet(passengerId, 'passenger');
      if (wallet.balance.lt(authoritativeFare)) {
        throw new BadRequestException(
          `Insufficient wallet balance: fare is ${authoritativeFare.toString()} PKR, wallet has ${wallet.balance.toString()} PKR`,
        );
      }
    }

    // 5. Create or update payment record
    const payment = await this.prisma.payment.upsert({
      where: { rideId },
      create: {
        rideId,
        passengerId,
        driverId: ride.driverId,
        amount: authoritativeFare,
        currency: 'PKR',
        paymentMethod: method,
        status: method === PaymentMethodDtoEnum.cash ? 'pending' : 'processing',
        provider: method === PaymentMethodDtoEnum.card ? 'card_gateway' : method,
        idempotencyKey: idempotencyKey || null,
      },
      update: {
        paymentMethod: method,
        amount: authoritativeFare,
        provider: method === PaymentMethodDtoEnum.card ? 'card_gateway' : method,
        status: method === PaymentMethodDtoEnum.cash ? 'pending' : 'processing',
        idempotencyKey: idempotencyKey || undefined,
        updatedAt: new Date(),
      },
    });

    // 6. If card gateway requested without credentials, note provider status
    if (method === PaymentMethodDtoEnum.card && !this.externalProvider.isAvailable) {
      this.logger.warn(
        `Card payment initiated without live credentials: NOT VERIFIED — provider credentials/environment unavailable`,
      );
    }

    this.logger.log(
      `Payment initiated: id=${payment.id}, rideId=${rideId}, amount=${authoritativeFare.toString()} PKR, method=${method}, status=${payment.status}`,
    );

    return payment;
  }

  /**
   * Confirm and capture payment.
   * State machine: Only 'pending' or 'processing' -> 'succeeded'.
   * Idempotent: repeated calls on 'succeeded' payment return successfully without duplicate action.
   */
  async confirmPayment(
    userId: string,
    userRole: string,
    paymentId: string,
    providerPaymentId?: string,
    idempotencyKey?: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { ride: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Ownership check: must be passenger or driver of the ride
    if (payment.passengerId !== userId && payment.driverId !== userId) {
      throw new ForbiddenException('You are not authorized to confirm this payment');
    }

    // Role-specific check for cash payments: Only the assigned driver who received physical cash can confirm cash settlement
    if (payment.paymentMethod === 'cash' && userId !== payment.driverId) {
      throw new ForbiddenException('Only the assigned driver can confirm receipt of cash payment');
    }

    // Idempotency: if already succeeded, return immediately
    if (payment.status === 'succeeded') {
      this.logger.log(`Payment ${paymentId} is already confirmed (succeeded)`);
      return { payment, isAlreadyConfirmed: true };
    }

    if (payment.status === 'refunded') {
      throw new ConflictException('Cannot confirm a payment that has been refunded');
    }

    if (payment.status === 'failed') {
      throw new BadRequestException('Cannot confirm a failed payment without re-initiating');
    }

    // Execute atomic settlement based on method
    let finalStatus: 'succeeded' | 'failed' = 'succeeded';
    let failureReason: string | undefined;

    if (payment.paymentMethod === 'wallet') {
      try {
        // Atomic ledger debit from passenger
        await this.walletService.debitWallet({
          userId: payment.passengerId,
          userRole: 'passenger',
          amount: payment.amount,
          referenceType: 'ride_payment',
          referenceId: payment.rideId,
          idempotencyKey: idempotencyKey ? `debit_${idempotencyKey}` : `debit_pay_${payment.id}`,
          description: `Payment for ride ${payment.rideId}`,
        });

        // Atomic ledger credit to driver
        await this.walletService.creditWallet({
          userId: payment.driverId,
          userRole: 'driver',
          amount: payment.amount,
          referenceType: 'driver_earning',
          referenceId: payment.rideId,
          idempotencyKey: idempotencyKey ? `credit_${idempotencyKey}` : `credit_pay_${payment.id}`,
          description: `Earnings for ride ${payment.rideId}`,
        });
      } catch (walletErr: any) {
        finalStatus = 'failed';
        failureReason = walletErr.message || 'Wallet debit failed';
      }
    } else if (payment.paymentMethod === 'card') {
      const providerRes = await this.externalProvider.confirmPayment({
        paymentId: payment.id,
        providerPaymentId,
        idempotencyKey,
      });

      if (!providerRes.success) {
        finalStatus = 'failed';
        failureReason =
          providerRes.failureReason || 'Card payment confirmation failed';
      }
    } else if (payment.paymentMethod === 'cash') {
      // Cash payment confirmed: direct physical settlement verified
      finalStatus = 'succeeded';
    }

    // Update payment record
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: finalStatus,
        failureReason: failureReason || null,
        paidAt: finalStatus === 'succeeded' ? new Date() : null,
        failedAt: finalStatus === 'failed' ? new Date() : null,
        providerPaymentId: providerPaymentId || payment.providerPaymentId,
        updatedAt: new Date(),
      },
    });

    // Real-time and push broadcast (non-blocking failure isolation)
    try {
      this.realtimeService.emitPaymentStatusChanged(
        {
          paymentId: updatedPayment.id,
          rideId: updatedPayment.rideId,
          status: updatedPayment.status,
          amount: Number(updatedPayment.amount),
          currency: updatedPayment.currency,
          paymentMethod: updatedPayment.paymentMethod,
          paidAt: updatedPayment.paidAt?.toISOString(),
        },
        {
          passengerId: updatedPayment.passengerId,
          driverId: updatedPayment.driverId,
        },
      );

      if (finalStatus === 'succeeded') {
        const fareStr = Number(updatedPayment.amount).toFixed(2);
        this.notificationsService
          .sendToUser(
            updatedPayment.passengerId,
            'Payment Successful',
            `Your payment of ${fareStr} PKR was settled successfully.`,
            { type: 'payment_succeeded', paymentId: updatedPayment.id, rideId: updatedPayment.rideId },
          )
          .catch(() => {});
      }
    } catch (notifErr: any) {
      this.logger.warn(`Failed to dispatch realtime payment notification: ${notifErr.message}`);
    }

    return { payment: updatedPayment, isAlreadyConfirmed: false };
  }

  /**
   * Refund a succeeded payment.
   * Idempotent: multiple calls return existing refund record without double refunding.
   */
  async refundPayment(
    userId: string,
    userRole: string,
    paymentId: string,
    reason?: string,
    idempotencyKey?: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Ownership check: passenger or driver of ride
    if (payment.passengerId !== userId && payment.driverId !== userId) {
      throw new ForbiddenException('You are not authorized to refund this payment');
    }

    // Idempotent: already refunded
    if (payment.status === 'refunded') {
      this.logger.log(`Payment ${paymentId} was already refunded`);
      return { payment, isAlreadyRefunded: true };
    }

    if (payment.status !== 'succeeded') {
      throw new BadRequestException(
        `Cannot refund a payment with status '${payment.status}'. Only 'succeeded' payments can be refunded.`,
      );
    }

    // If wallet was used, credit back passenger atomically
    if (payment.paymentMethod === 'wallet') {
      await this.walletService.creditWallet({
        userId: payment.passengerId,
        userRole: 'passenger',
        amount: payment.amount,
        referenceType: 'refund',
        referenceId: payment.rideId,
        idempotencyKey: idempotencyKey ? `refund_credit_${idempotencyKey}` : `refund_${payment.id}`,
        description: `Refund for ride ${payment.rideId}: ${reason || 'Ride cancelled/disputed'}`,
      });
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'refunded',
        refundedAmount: payment.amount,
        refundedAt: new Date(),
        failureReason: reason || 'Customer requested refund',
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `Payment refunded: id=${payment.id}, amount=${payment.amount.toString()} PKR`,
    );

    // Notify passenger
    try {
      this.notificationsService
        .sendToUser(
          payment.passengerId,
          'Refund Processed',
          `Your refund of ${Number(payment.amount).toFixed(2)} PKR has been processed.`,
          { type: 'refund_completed', paymentId: payment.id, rideId: payment.rideId },
        )
        .catch(() => {});
    } catch {}

    return { payment: updatedPayment, isAlreadyRefunded: false };
  }

  /**
   * Get payment details for a specific ride with authorization checks
   */
  async getRidePayment(userId: string, userRole: string, rideId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.passengerId !== userId && ride.driverId !== userId) {
      throw new ForbiddenException('You are not authorized to view payments for this ride');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { rideId },
    });

    return {
      rideId,
      authoritativeFare: ride.finalFare ?? ride.proposedFare,
      currency: 'PKR',
      rideStatus: ride.status,
      payment,
    };
  }

  /**
   * Get payment history for authenticated user
   */
  async getPaymentHistory(userId: string, userRole: string, limit = 20, offset = 0) {
    const whereClause =
      userRole === 'driver' ? { driverId: userId } : { passengerId: userId };

    const payments = await this.prisma.payment.findMany({
      where: whereClause,
      include: {
        ride: {
          select: {
            pickupAddress: true,
            dropoffAddress: true,
            status: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Math.max(1, limit)),
      skip: Math.max(0, offset),
    });

    const total = await this.prisma.payment.count({ where: whereClause });

    return {
      payments,
      total,
      limit,
      offset,
    };
  }

  /**
   * Handle incoming provider webhook with cryptographic signature verification
   */
  async handleWebhook(
    payload: any,
    signature: string,
    rawBody?: string | Buffer,
  ) {
    const isValid = this.externalProvider.verifyWebhookSignature(
      rawBody || JSON.stringify(payload),
      signature,
    );

    if (!isValid) {
      this.logger.warn('Rejected payment webhook: invalid signature');
      throw new UnauthorizedException('Invalid payment webhook signature');
    }

    const eventId = payload?.id || payload?.eventId;
    const eventType = payload?.type || payload?.eventType;
    const paymentId = payload?.data?.paymentId || payload?.data?.object?.metadata?.paymentId;

    this.logger.log(`Processing verified webhook event: ${eventType} (id=${eventId})`);

    if (!paymentId) {
      return { received: true, ignored: true, reason: 'No paymentId in metadata' };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      this.logger.warn(`Webhook referenced unknown payment: ${paymentId}`);
      return { received: true, ignored: true, reason: 'Payment not found' };
    }

    if (eventType === 'payment_intent.succeeded' || eventType === 'charge.succeeded') {
      if (payment.status !== 'succeeded') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'succeeded',
            paidAt: new Date(),
            updatedAt: new Date(),
          },
        });
        this.logger.log(`Webhook marked payment ${payment.id} succeeded`);
      }
    } else if (eventType === 'charge.refunded') {
      if (payment.status !== 'refunded') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'refunded',
            refundedAmount: payment.amount,
            refundedAt: new Date(),
            updatedAt: new Date(),
          },
        });
        this.logger.log(`Webhook marked payment ${payment.id} refunded`);
      }
    }

    return { received: true, processed: true };
  }
}
