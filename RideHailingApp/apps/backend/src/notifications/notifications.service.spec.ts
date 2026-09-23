import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PUSH_PROVIDER, PushProvider } from './push-provider.interface';

describe('NotificationsService & NotificationsController', () => {
  let notificationsService: NotificationsService;
  let notificationsController: NotificationsController;
  let prisma: any;
  let pushProvider: jest.Mocked<PushProvider>;

  const mockDriverId = '33333333-3333-3333-3333-333333333333';
  const mockOtherDriverId = '99999999-9999-9999-9999-999999999999';
  const mockPassengerId = '11111111-1111-1111-1111-111111111111';
  const mockNotifId = '55555555-5555-5555-5555-555555555555';
  const mockToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';

  beforeEach(async () => {
    prisma = {
      notification: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      deviceToken: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
    };

    pushProvider = {
      sendPush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: PUSH_PROVIDER,
          useValue: pushProvider,
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

    it('rejects non-driver role in controller for driver notifications', () => {
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

  describe('4. Device token registration & removal (Phase 10)', () => {
    it('registers/upserts device token for authenticated user', async () => {
      prisma.deviceToken.upsert.mockResolvedValue({
        id: 'token-uuid-1',
        userId: mockPassengerId,
        userRole: 'passenger',
        token: mockToken,
      });

      const res = await notificationsService.registerDeviceToken(
        mockPassengerId,
        'passenger',
        mockToken,
        'ios',
      );

      expect(prisma.deviceToken.upsert).toHaveBeenCalledWith({
        where: { token: mockToken },
        create: expect.objectContaining({
          userId: mockPassengerId,
          userRole: 'passenger',
          token: mockToken,
          platform: 'ios',
        }),
        update: expect.objectContaining({
          userId: mockPassengerId,
          userRole: 'passenger',
          platform: 'ios',
        }),
      });
      expect(res.success).toBe(true);
      expect(res.id).toBe('token-uuid-1');
    });

    it('removes device token scoped to user', async () => {
      prisma.deviceToken.deleteMany.mockResolvedValue({ count: 1 });

      const res = await notificationsService.removeDeviceToken(mockPassengerId, mockToken);

      expect(prisma.deviceToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockPassengerId, token: mockToken },
      });
      expect(res.success).toBe(true);
      expect(res.count).toBe(1);
    });

    it('controller delegates token registration with authenticated JWT sub', async () => {
      prisma.deviceToken.upsert.mockResolvedValue({ id: 'token-1' });

      const result = await notificationsController.registerDeviceToken(
        { sub: mockPassengerId, role: 'passenger' } as any,
        { token: mockToken, platform: 'android' },
      );

      expect(result.success).toBe(true);
      expect(prisma.deviceToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { token: mockToken },
        }),
      );
    });
  });

  describe('5. Push notification dispatch (Phase 10)', () => {
    it('dispatches push to user active tokens', async () => {
      prisma.deviceToken.findMany.mockResolvedValue([
        { id: 't1', token: mockToken, userId: mockPassengerId },
      ]);
      pushProvider.sendPush.mockResolvedValue({ success: true, messageId: 'msg-1' });

      const res = await notificationsService.sendToUser(
        mockPassengerId,
        'Ride Accepted',
        'Driver is on the way',
        { type: 'ride_accepted', rideId: 'ride-123' },
      );

      expect(pushProvider.sendPush).toHaveBeenCalledWith({
        to: mockToken,
        title: 'Ride Accepted',
        body: 'Driver is on the way',
        data: { type: 'ride_accepted', rideId: 'ride-123' },
        sound: 'default',
        channelId: 'ride-updates',
      });
      expect(res.sent).toBe(1);
      expect(res.failed).toBe(0);
    });

    it('cleans up invalid device tokens when push provider reports isInvalidToken', async () => {
      prisma.deviceToken.findMany.mockResolvedValue([
        { id: 't1', token: 'invalid-token', userId: mockPassengerId },
      ]);
      pushProvider.sendPush.mockResolvedValue({
        success: false,
        isInvalidToken: true,
        error: 'DeviceNotRegistered',
      });
      prisma.deviceToken.delete.mockResolvedValue({});

      const res = await notificationsService.sendToUser(
        mockPassengerId,
        'Ride Update',
        'Status changed',
      );

      expect(res.sent).toBe(0);
      expect(res.failed).toBe(1);
      expect(prisma.deviceToken.delete).toHaveBeenCalledWith({
        where: { token: 'invalid-token' },
      });
    });

    it('returns zero and does not throw if user has no tokens', async () => {
      prisma.deviceToken.findMany.mockResolvedValue([]);

      const res = await notificationsService.sendToUser(
        mockPassengerId,
        'Ride Update',
        'Test message',
      );

      expect(pushProvider.sendPush).not.toHaveBeenCalled();
      expect(res.sent).toBe(0);
      expect(res.failed).toBe(0);
    });

    it('never throws even if push provider throws an exception (failure isolation)', async () => {
      prisma.deviceToken.findMany.mockResolvedValue([
        { id: 't1', token: mockToken, userId: mockPassengerId },
      ]);
      pushProvider.sendPush.mockRejectedValue(new Error('Network timeout'));

      const res = await notificationsService.sendToUser(
        mockPassengerId,
        'Ride Update',
        'Test message',
      );

      expect(res.sent).toBe(0);
      expect(res.failed).toBe(1);
    });
  });
});
