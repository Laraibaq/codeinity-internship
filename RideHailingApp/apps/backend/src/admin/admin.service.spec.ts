import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';
import { AuditLogService } from './audit-log.service';
import { AdminGuard } from '../auth/guards/admin.guard';

describe('AdminService & AdminGuard', () => {
  let adminService: AdminService;
  let auditLogService: AuditLogService;
  let prisma: any;
  let adminGuard: AdminGuard;

  const mockAdminId = '77777777-7777-7777-7777-777777777777';
  const mockDriverId = '33333333-3333-3333-3333-333333333333';
  const mockPassengerId = '11111111-1111-1111-1111-111111111111';
  const mockRideId = '44444444-4444-4444-4444-444444444444';

  beforeEach(async () => {
    prisma = {
      user: {
        count: jest.fn().mockResolvedValue(10),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      driver: {
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      ride: {
        count: jest.fn().mockResolvedValue(25),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      payment: {
        count: jest.fn().mockResolvedValue(20),
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { amount: 5000, refundedAmount: 200 },
          _count: { id: 20 },
        }),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      wallet: {
        count: jest.fn().mockResolvedValue(15),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { balance: 12500 },
          _count: { id: 15 },
        }),
      },
      walletTransaction: {
        count: jest.fn().mockResolvedValue(30),
        findMany: jest.fn().mockResolvedValue([]),
      },
      negotiation: {
        count: jest.fn().mockResolvedValue(4),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      rating: {
        count: jest.fn().mockResolvedValue(18),
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({
          _avg: { score: 4.75 },
          _count: { id: 18 },
        }),
      },
      supportTicket: {
        count: jest.fn().mockResolvedValue(2),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'log-1', ...args.data })),
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([]),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        AuditLogService,
        AdminGuard,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    adminService = module.get<AdminService>(AdminService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
    adminGuard = module.get<AdminGuard>(AdminGuard);
  });

  describe('1. Admin Authorization Guard', () => {
    it('throws ForbiddenException when user is not present on request', () => {
      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      };
      expect(() => adminGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when role is passenger', () => {
      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { sub: mockPassengerId, role: 'passenger' } }),
        }),
      };
      expect(() => adminGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when role is driver', () => {
      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { sub: mockDriverId, role: 'driver' } }),
        }),
      };
      expect(() => adminGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('allows access when role is admin', () => {
      const mockContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { sub: mockAdminId, role: 'admin' } }),
        }),
      };
      expect(adminGuard.canActivate(mockContext)).toBe(true);
    });
  });

  describe('2. Dashboard Overview Aggregates', () => {
    it('returns server-side aggregates without hardcoded sample data', async () => {
      const overview = await adminService.getDashboardOverview();
      expect(overview).toHaveProperty('users');
      expect(overview).toHaveProperty('drivers');
      expect(overview).toHaveProperty('rides');
      expect(overview).toHaveProperty('financial');
      expect(overview.financial.currency).toBe('PKR');
      expect(overview.financial.totalPaymentVolume).toBe(5000);
      expect(overview.financial.totalWalletBalance).toBe(12500);
      expect(overview.ratings.averageRating).toBe(4.75);
    });
  });

  describe('3. User Management', () => {
    it('returns paginated users with excluded passwordHash', async () => {
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findMany.mockResolvedValue([
        {
          id: mockPassengerId,
          name: 'Test Passenger',
          phone: '+923001234567',
          email: 'passenger@example.com',
          phoneVerified: true,
          profilePhotoUrl: null,
          rating: 4.8,
          rideCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await adminService.getUsers({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('passwordHash');
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('4. Driver Management & Status Transitions', () => {
    it('approves driver and creates audit log', async () => {
      prisma.driver.findUnique.mockResolvedValue({
        id: mockDriverId,
        verificationStatus: 'pending',
      });
      prisma.driver.update.mockResolvedValue({
        id: mockDriverId,
        name: 'Test Driver',
        verificationStatus: 'approved',
        isOnline: false,
      });

      const res = await adminService.approveDriver(mockDriverId, mockAdminId, { reason: 'Docs verified' });
      expect(res.verificationStatus).toBe('approved');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            adminId: mockAdminId,
            action: 'DRIVER_APPROVED',
            entityType: 'driver',
            entityId: mockDriverId,
          }),
        }),
      );
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('suspends driver, sets isOnline false, and logs audit', async () => {
      prisma.driver.findUnique.mockResolvedValue({
        id: mockDriverId,
        verificationStatus: 'approved',
      });
      prisma.driver.update.mockResolvedValue({
        id: mockDriverId,
        name: 'Test Driver',
        verificationStatus: 'suspended',
        isOnline: false,
      });

      const res = await adminService.suspendDriver(mockDriverId, mockAdminId, { reason: 'Policy violation' });
      expect(res.verificationStatus).toBe('suspended');
      expect(res.isOnline).toBe(false);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'DRIVER_SUSPENDED',
          }),
        }),
      );
    });
  });

  describe('5. Financial Overview & Safety', () => {
    it('computes financial aggregates strictly read-only', async () => {
      const fin = await adminService.getFinancialOverview({ range: '7d' });
      expect(fin.currency).toBe('PKR');
      expect(fin.grossRideValue).toBe(5000);
      expect(fin.totalSystemWalletBalance).toBe(12500);
      // Ensure no write queries were invoked
      expect(prisma.payment.create).toBeUndefined();
      expect(prisma.payment.update).toBeUndefined();
    });
  });

  describe('6. Support Ticket Resolution', () => {
    it('updates ticket status and creates audit log', async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({
        id: 'ticket-1',
        status: 'open',
      });
      prisma.supportTicket.update.mockResolvedValue({
        id: 'ticket-1',
        status: 'resolved',
      });

      const res = await adminService.updateSupportTicket('ticket-1', mockAdminId, { status: 'resolved' });
      expect(res.status).toBe('resolved');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'SUPPORT_TICKET_UPDATED',
            entityType: 'support_ticket',
            entityId: 'ticket-1',
          }),
        }),
      );
    });
  });
});
