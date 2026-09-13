import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SupportCategoryEnum } from './dto/create-support-ticket.dto';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

describe('SupportService & SupportController', () => {
  let supportService: SupportService;
  let supportController: SupportController;
  let prisma: any;

  const mockDriverId = '33333333-3333-3333-3333-333333333333';
  const mockOtherDriverId = '99999999-9999-9999-9999-999999999999';
  const mockPassengerId = '11111111-1111-1111-1111-111111111111';
  const mockRideId = '44444444-4444-4444-4444-444444444444';

  beforeEach(async () => {
    prisma = {
      supportTicket: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
      ride: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [
        SupportService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    supportService = module.get<SupportService>(SupportService);
    supportController = module.get<SupportController>(SupportController);
  });

  describe('1. FAQs retrieval', () => {
    it('returns standard FAQs list', () => {
      const faqs = supportService.getFaqs();
      expect(faqs).toBeInstanceOf(Array);
      expect(faqs.length).toBeGreaterThan(0);
      expect(faqs[0]).toHaveProperty('question');
      expect(faqs[0]).toHaveProperty('answer');
    });
  });

  describe('2. Support ticket creation', () => {
    it('creates support ticket associated with authenticated driver and creates a confirmation notification', async () => {
      prisma.supportTicket.create.mockResolvedValue({
        id: 'ticket-1',
        driverId: mockDriverId,
        category: SupportCategoryEnum.account,
        subject: 'Need help with email update',
        description: 'I changed my email address and need verification.',
        status: 'open',
      });
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' });

      const result = await supportService.createTicket(mockDriverId, {
        category: SupportCategoryEnum.account,
        subject: 'Need help with email update',
        description: 'I changed my email address and need verification.',
      });

      expect(prisma.supportTicket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            driverId: mockDriverId,
            category: 'account',
            subject: 'Need help with email update',
          }),
        }),
      );
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            driverId: mockDriverId,
            type: 'support',
          }),
        }),
      );
      expect(result.id).toBe('ticket-1');
    });

    it('rejects ticket with rideId belonging to another driver', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        driverId: mockOtherDriverId,
      });

      await expect(
        supportService.createTicket(mockDriverId, {
          category: SupportCategoryEnum.ride,
          subject: 'Issue with fare',
          description: 'Passenger did not pay full cash fare.',
          rideId: mockRideId,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects non-driver role in controller', () => {
      expect(() =>
        supportController.createTicket(
          { sub: mockPassengerId, role: 'passenger' } as any,
          {
            category: SupportCategoryEnum.other,
            subject: 'Test',
            description: 'Testing 12345',
          },
        ),
      ).toThrow(ForbiddenException);
    });
  });

  describe('3. Support tickets retrieval', () => {
    it('retrieves only tickets belonging to authenticated driver', async () => {
      prisma.supportTicket.findMany.mockResolvedValue([
        { id: 'ticket-1', driverId: mockDriverId },
      ]);

      const result = await supportService.getTickets(mockDriverId);

      expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { driverId: mockDriverId },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });
});
