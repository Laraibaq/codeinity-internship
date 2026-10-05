import { Module } from '@nestjs/common';
import { NegotiationController } from './negotiation.controller';
import { NegotiationService } from './negotiation.service';
import { AiNegotiationProvider, AI_NEGOTIATION_PROVIDER } from './ai-negotiation.provider';
import { FareQuoteController } from './fare-quote.controller';
import { FareQuoteService } from './fare-quote.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, RealtimeModule, NotificationsModule],
  controllers: [NegotiationController, FareQuoteController],
  providers: [
    NegotiationService,
    FareQuoteService,
    AiNegotiationProvider,
    {
      provide: AI_NEGOTIATION_PROVIDER,
      useClass: AiNegotiationProvider,
    },
  ],
  exports: [NegotiationService, AiNegotiationProvider, FareQuoteService],
})
export class NegotiationModule {}
