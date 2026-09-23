import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PUSH_PROVIDER } from './push-provider.interface';
import type { PushProvider } from './push-provider.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PUSH_PROVIDER) private readonly pushProvider: PushProvider,
  ) {}

  async registerDeviceToken(
    userId: string,
    role: string,
    token: string,
    platform?: string,
  ) {
    const deviceToken = await this.prisma.deviceToken.upsert({
      where: { token },
      create: {
        userId,
        userRole: role,
        token,
        platform: platform || null,
        lastSeenAt: new Date(),
      },
      update: {
        userId,
        userRole: role,
        platform: platform || undefined,
        lastSeenAt: new Date(),
      },
    });

    this.logger.log(`Registered device token for user ${userId} (${role})`);
    return { success: true, id: deviceToken.id };
  }

  async removeDeviceToken(userId: string, token: string) {
    const deleted = await this.prisma.deviceToken.deleteMany({
      where: { userId, token },
    });

    this.logger.log(`Removed ${deleted.count} device token(s) for user ${userId}`);
    return { success: true, count: deleted.count };
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<{ sent: number; failed: number }> {
    try {
      const tokens = await this.prisma.deviceToken.findMany({
        where: { userId },
      });

      if (!tokens || tokens.length === 0) {
        this.logger.debug(`No device tokens found for user ${userId}, push skipped`);
        return { sent: 0, failed: 0 };
      }

      let sent = 0;
      let failed = 0;

      for (const t of tokens) {
        try {
          const result = await this.pushProvider.sendPush({
            to: t.token,
            title,
            body,
            data,
            sound: 'default',
            channelId: 'ride-updates',
          });

          if (result.success) {
            sent++;
          } else {
            failed++;
            if (result.isInvalidToken) {
              this.logger.warn(`Removing invalid device token: ${t.token.slice(0, 15)}...`);
              await this.prisma.deviceToken
                .delete({ where: { token: t.token } })
                .catch(() => {});
            }
          }
        } catch (pushErr: any) {
          failed++;
          this.logger.warn(`Push delivery error to token: ${pushErr?.message}`);
        }
      }

      this.logger.log(
        `Dispatched push for user ${userId} (title="${title}", sent=${sent}, failed=${failed})`,
      );
      return { sent, failed };
    } catch (err: any) {
      this.logger.error(`Error in sendToUser for ${userId}: ${err?.message}`);
      return { sent: 0, failed: 0 };
    }
  }

  async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    const uniqueIds = Array.from(new Set(userIds));
    return Promise.all(uniqueIds.map((id) => this.sendToUser(id, title, body, data)));
  }

  async getDriverNotifications(driverId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      notifications,
      unreadCount,
    };
  }

  async markAsRead(notificationId: string, driverId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.driverId !== driverId) {
      throw new ForbiddenException('You do not own this notification');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(driverId: string) {
    await this.prisma.notification.updateMany({
      where: { driverId, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  }

  async createNotification(
    driverId: string,
    title: string,
    message: string,
    type: 'account' | 'ride' | 'support' | 'system' = 'system',
  ) {
    return this.prisma.notification.create({
      data: {
        driverId,
        title,
        message,
        type: type as any,
        isRead: false,
      },
    });
  }
}
