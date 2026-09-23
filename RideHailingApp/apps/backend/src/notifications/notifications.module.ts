import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ExpoPushProvider } from './expo-push.provider';
import { PUSH_PROVIDER } from './push-provider.interface';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ExpoPushProvider,
    {
      provide: PUSH_PROVIDER,
      useClass: ExpoPushProvider,
    },
  ],
  exports: [NotificationsService, PUSH_PROVIDER],
})
export class NotificationsModule {}
