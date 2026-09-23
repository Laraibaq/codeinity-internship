import { Injectable, Logger } from '@nestjs/common';
import {
  ConfirmPaymentParams,
  InitiatePaymentParams,
  PaymentProvider,
  PaymentProviderResult,
  RefundPaymentParams,
} from './payment-provider.interface';

@Injectable()
export class CashPaymentProvider implements PaymentProvider {
  readonly name = 'cash';
  readonly isAvailable = true;
  private readonly logger = new Logger(CashPaymentProvider.name);

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentProviderResult> {
    this.logger.log(
      `Cash payment initiated for ride ${params.rideId} (amount=${params.amount.toString()} ${params.currency})`,
    );
    return {
      success: true,
      status: 'pending',
      providerPaymentId: `cash_${params.paymentId}`,
      metadata: { method: 'cash', directHandover: true },
    };
  }

  async confirmPayment(params: ConfirmPaymentParams): Promise<PaymentProviderResult> {
    this.logger.log(`Cash payment confirmed for payment ${params.paymentId}`);
    return {
      success: true,
      status: 'succeeded',
      providerPaymentId: params.providerPaymentId || `cash_${params.paymentId}`,
    };
  }

  async refundPayment(params: RefundPaymentParams): Promise<PaymentProviderResult> {
    this.logger.log(`Cash payment refund/void recorded for payment ${params.paymentId}`);
    return {
      success: true,
      status: 'refunded',
      metadata: { reason: params.reason || 'Cash settlement cancelled/refunded' },
    };
  }

  verifyWebhookSignature(): boolean {
    // Cash has no external webhooks
    return true;
  }
}
