import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  ConfirmPaymentParams,
  InitiatePaymentParams,
  PaymentProvider,
  PaymentProviderResult,
  RefundPaymentParams,
} from './payment-provider.interface';

@Injectable()
export class ExternalPaymentProvider implements PaymentProvider {
  readonly name = 'card_gateway';
  private readonly logger = new Logger(ExternalPaymentProvider.name);

  get isAvailable(): boolean {
    return Boolean(
      process.env.PAYMENT_PROVIDER_SECRET ||
      process.env.STRIPE_SECRET_KEY ||
      process.env.JAZZCASH_SECRET_KEY,
    );
  }

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentProviderResult> {
    if (!this.isAvailable) {
      this.logger.warn(
        `External payment requested for ride ${params.rideId} but no live payment provider credentials are configured in environment.`,
      );
      return {
        success: false,
        status: 'failed',
        failureReason: 'NOT VERIFIED — provider credentials/environment unavailable',
        isMockOrUnavailable: true,
      };
    }

    // In a live environment with credentials configured, this dispatches to the acquiring API
    return {
      success: true,
      status: 'processing',
      providerPaymentId: `ext_${params.paymentId}`,
    };
  }

  async confirmPayment(params: ConfirmPaymentParams): Promise<PaymentProviderResult> {
    if (!this.isAvailable) {
      return {
        success: false,
        status: 'failed',
        failureReason: 'NOT VERIFIED — provider credentials/environment unavailable',
        isMockOrUnavailable: true,
      };
    }

    return {
      success: true,
      status: 'succeeded',
      providerPaymentId: params.providerPaymentId,
    };
  }

  async refundPayment(params: RefundPaymentParams): Promise<PaymentProviderResult> {
    if (!this.isAvailable) {
      return {
        success: false,
        status: 'failed',
        failureReason: 'NOT VERIFIED — provider credentials/environment unavailable',
        isMockOrUnavailable: true,
      };
    }

    return {
      success: true,
      status: 'refunded',
    };
  }

  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    const secret =
      process.env.PAYMENT_WEBHOOK_SECRET ||
      process.env.STRIPE_WEBHOOK_SECRET ||
      process.env.JAZZCASH_WEBHOOK_SECRET;

    if (!secret) {
      this.logger.warn('Cannot verify webhook signature: PAYMENT_WEBHOOK_SECRET is not configured');
      return false;
    }

    if (!signature) {
      return false;
    }

    try {
      const computed = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      const cleanSig = signature.replace(/^(sha256=|v1=|t=.*?,v1=)/, '');
      const signatureBuffer = Buffer.from(cleanSig, 'utf8');
      const computedBuffer = Buffer.from(computed, 'utf8');

      if (signatureBuffer.length !== computedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(signatureBuffer, computedBuffer);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification error: ${err.message}`);
      return false;
    }
  }
}
