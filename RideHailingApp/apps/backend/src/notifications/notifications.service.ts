import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

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
