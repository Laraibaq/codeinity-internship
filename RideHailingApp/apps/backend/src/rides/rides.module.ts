import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { MatchingService } from './matching.service';

@Module({
  imports: [PrismaModule, RealtimeModule, NotificationsModule],
  controllers: [RidesController],
  providers: [RidesService, MatchingService],
  exports: [RidesService, MatchingService],
})
export class RidesModule {}
