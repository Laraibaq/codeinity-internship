import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WalletService } from './wallet.service';
import { CashPaymentProvider } from './cash-payment.provider';
import { ExternalPaymentProvider } from './external-payment.provider';

@Module({
  imports: [PrismaModule, RealtimeModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    WalletService,
    CashPaymentProvider,
    ExternalPaymentProvider,
  ],
  exports: [PaymentsService, WalletService],
})
export class PaymentsModule {}
