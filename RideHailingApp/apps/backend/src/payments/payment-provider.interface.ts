import { Prisma } from '../../generated/prisma/client';

export interface InitiatePaymentParams {
  paymentId: string;
  rideId: string;
  passengerId: string;
  driverId: string;
  amount: Prisma.Decimal;
  currency: string;
  idempotencyKey?: string;
}

export interface ConfirmPaymentParams {
  paymentId: string;
  providerPaymentId?: string;
  idempotencyKey?: string;
}

export interface RefundPaymentParams {
  paymentId: string;
  amount: Prisma.Decimal;
  currency: string;
  reason?: string;
  idempotencyKey?: string;
}

export interface PaymentProviderResult {
  success: boolean;
  providerPaymentId?: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
  failureReason?: string;
  metadata?: Record<string, any>;
  isMockOrUnavailable?: boolean;
}

export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export interface PaymentProvider {
  readonly name: string;
  readonly isAvailable: boolean;

  initiatePayment(params: InitiatePaymentParams): Promise<PaymentProviderResult>;
  confirmPayment(params: ConfirmPaymentParams): Promise<PaymentProviderResult>;
  refundPayment(params: RefundPaymentParams): Promise<PaymentProviderResult>;
  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean;
}
