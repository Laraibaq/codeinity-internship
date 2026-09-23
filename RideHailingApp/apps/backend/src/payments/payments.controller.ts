import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { PaymentsService } from './payments.service';
import { WalletService } from './wallet.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { TopupWalletDto } from './dto/topup-wallet.dto';

@Controller()
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Initiate payment for a ride (Passenger only)
   */
  @Post('payments/initiate')
  @UseGuards(JwtAuthGuard)
  async initiatePayment(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.paymentsService.initiatePayment(
      user.sub,
      dto.rideId,
      dto.paymentMethod,
      dto.idempotencyKey,
    );
  }

  /**
   * Confirm and capture a payment (Passenger or Driver of the ride)
   */
  @Post('payments/:id/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmPayment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.paymentsService.confirmPayment(
      user.sub,
      user.role,
      paymentId,
      dto.providerPaymentId,
      dto.idempotencyKey,
    );
  }

  /**
   * Refund an eligible succeeded payment
   */
  @Post('payments/:id/refund')
  @UseGuards(JwtAuthGuard)
  async refundPayment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) paymentId: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentsService.refundPayment(
      user.sub,
      user.role,
      paymentId,
      dto.reason,
      dto.idempotencyKey,
    );
  }

  /**
   * Get payment details and authoritative status for a ride
   */
  @Get('payments/ride/:rideId')
  @UseGuards(JwtAuthGuard)
  async getRidePayment(
    @CurrentUser() user: JwtPayload,
    @Param('rideId', ParseUUIDPipe) rideId: string,
  ) {
    return this.paymentsService.getRidePayment(user.sub, user.role, rideId);
  }

  /**
   * Get user payment history
   */
  @Get('payments/history')
  @UseGuards(JwtAuthGuard)
  async getPaymentHistory(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.paymentsService.getPaymentHistory(
      user.sub,
      user.role,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  /**
   * Get authenticated user's wallet balance
   */
  @Get('wallet/me')
  @UseGuards(JwtAuthGuard)
  async getMyWallet(@CurrentUser() user: JwtPayload) {
    return this.walletService.getOrCreateWallet(user.sub, user.role);
  }

  /**
   * Get immutable ledger transactions for authenticated user
   */
  @Get('wallet/transactions')
  @UseGuards(JwtAuthGuard)
  async getWalletTransactions(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.walletService.getTransactions(
      user.sub,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  /**
   * Top up wallet balance (e.g. testing or simulated top-up)
   */
  @Post('wallet/topup')
  @UseGuards(JwtAuthGuard)
  async topupWallet(
    @CurrentUser() user: JwtPayload,
    @Body() dto: TopupWalletDto,
  ) {
    return this.walletService.creditWallet({
      userId: user.sub,
      userRole: user.role,
      amount: dto.amount,
      referenceType: 'topup',
      idempotencyKey: dto.idempotencyKey,
      description: dto.description || 'Wallet topup',
    });
  }

  /**
   * Provider webhook endpoint with cryptographic signature verification
   */
  @Post('payments/webhook')
  async handleWebhook(
    @Body() payload: any,
    @Req() req: any,
    @Headers('x-signature') signature?: string,
    @Headers('x-webhook-signature') webhookSignature?: string,
    @Headers('stripe-signature') stripeSignature?: string,
  ) {
    const sig = signature || webhookSignature || stripeSignature || '';
    return this.paymentsService.handleWebhook(payload, sig, req?.rawBody);
  }
}
