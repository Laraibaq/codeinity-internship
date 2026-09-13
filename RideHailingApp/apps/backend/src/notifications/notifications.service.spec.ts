import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsService & NotificationsController', () => {
  let notificationsService: NotificationsService;
  let notificationsController: NotificationsController;
  let prisma: any;

  const mockDriverId = '33333333-3333-3333-3333-333333333333';
  const mockOtherDriverId = '99999999-9999-9999-9999-999999999999';
  const mockPassengerId = '11111111-1111-1111-1111-111111111111';
  const mockNotifId = '55555555-5555-5555-5555-555555555555';

  beforeEach(async () => {
    prisma = {
      notification: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    notificationsService = module.get<NotificationsService>(NotificationsService);
    notificationsController = module.get<NotificationsController>(NotificationsController);
  });

  describe('1. Driver notifications retrieval', () => {
    it('returns notifications scoped to authenticated driver with accurate unread count', async () => {
      prisma.notification.findMany.mockResolvedValue([
        { id: 'n1', driverId: mockDriverId, isRead: false },
        { id: 'n2', driverId: mockDriverId, isRead: true },
      ]);

      const result = await notificationsService.getDriverNotifications(mockDriverId);

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { driverId: mockDriverId },
        }),
      );
      expect(result.notifications).toHaveLength(2);
      expect(result.unreadCount).toBe(1);
    });

    it('rejects non-driver role in controller', () => {
      expect(() =>
        notificationsController.getNotifications({
          sub: mockPassengerId,
          role: 'passenger',
        } as any),
      ).toThrow(ForbiddenException);
    });
  });

  describe('2. Mark notification as read', () => {
    it('marks notification as read when owned by authenticated driver', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: mockNotifId,
        driverId: mockDriverId,
        isRead: false,
      });
      prisma.notification.update.mockResolvedValue({
        id: mockNotifId,
        driverId: mockDriverId,
        isRead: true,
      });

      const result = await notificationsService.markAsRead(mockNotifId, mockDriverId);

      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockNotifId },
          data: { isRead: true },
        }),
      );
      expect(result.isRead).toBe(true);
    });

    it('throws ForbiddenException when driver tries to mark another driver notification as read', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: mockNotifId,
        driverId: mockOtherDriverId,
        isRead: false,
      });

      await expect(
        notificationsService.markAsRead(mockNotifId, mockDriverId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when notification does not exist', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(
        notificationsService.markAsRead(mockNotifId, mockDriverId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. Mark all notifications as read', () => {
    it('updates all unread notifications strictly for authenticated driver', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await notificationsService.markAllAsRead(mockDriverId);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { driverId: mockDriverId, isRead: false },
          data: { isRead: true },
        }),
      );
      expect(result.success).toBe(true);
    });
  });
});
