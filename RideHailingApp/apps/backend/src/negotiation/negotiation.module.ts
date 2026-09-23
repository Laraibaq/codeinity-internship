import { Module } from '@nestjs/common';
import { NegotiationController } from './negotiation.controller';
import { NegotiationService } from './negotiation.service';
import { AiNegotiationProvider, AI_NEGOTIATION_PROVIDER } from './ai-negotiation.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, RealtimeModule, NotificationsModule],
  controllers: [NegotiationController],
  providers: [
    NegotiationService,
    AiNegotiationProvider,
    {
      provide: AI_NEGOTIATION_PROVIDER,
      useClass: AiNegotiationProvider,
    },
  ],
  exports: [NegotiationService, AiNegotiationProvider],
})
export class NegotiationModule {}
