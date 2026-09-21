import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { CreateOfferDto, OfferTypeEnum } from './dto/create-offer.dto';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideStatusEnum } from './dto/update-ride-status.dto';
import { MatchingService } from './matching.service';
import { RealtimeService } from '../realtime/realtime.service';

describe('RidesService & RidesController (Phase 10 Comprehensive)', () => {
  let ridesService: RidesService;
  let ridesController: RidesController;
  let prisma: any;
  let matchingService: any;
  let realtimeService: any;

  const mockPassengerId = '11111111-1111-1111-1111-111111111111';
  const mockOtherPassengerId = '22222222-2222-2222-2222-222222222222';
  const mockDriverId = '33333333-3333-3333-3333-333333333333';
  const mockOtherDriverId = '99999999-9999-9999-9999-999999999999';
  const mockRideId = '44444444-4444-4444-4444-444444444444';
  const mockOfferId = '55555555-5555-5555-5555-555555555555';

  const sampleRideDto: CreateRideDto = {
    pickupLat: 37.7749,
    pickupLng: -122.4194,
    pickupAddress: 'Market St',
    dropoffLat: 37.8080,
    dropoffLng: -122.4177,
    dropoffAddress: 'Fisherman Wharf',
    distanceKm: 5.2,
    etaMinutes: 15,
    proposedFare: 20.0,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      driver: {
        findUnique: jest.fn(),
      },
      ride: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      rideOffer: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    realtimeService = {
      emitOfferCreated: jest.fn(),
      emitOfferUpdated: jest.fn(),
      emitRideAccepted: jest.fn(),
      emitRideStatusChanged: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RidesController],
      providers: [
        RidesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: MatchingService,
          useValue: {
            matchRide: jest.fn().mockResolvedValue({ matchedDriversCount: 0, offers: [] }),
            findEligibleNearbyDrivers: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: RealtimeService,
          useValue: realtimeService,
        },
      ],
    }).compile();


    ridesService = module.get<RidesService>(RidesService);
    ridesController = module.get<RidesController>(RidesController);
  });

  describe('1. Passenger can create ride', () => {
    it('creates a ride with status requested and sets passengerId from JWT', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: mockPassengerId, name: 'Alice' });
      prisma.ride.create.mockResolvedValue({
        id: mockRideId,
        passengerId: mockPassengerId,
        status: 'requested',
        ...sampleRideDto,
      });

      const result = await ridesService.createRide(mockPassengerId, sampleRideDto);

      expect(prisma.ride.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passengerId: mockPassengerId,
            status: 'requested',
            proposedFare: 20.0,
          }),
        }),
      );
      expect(result.id).toBe(mockRideId);
      expect(result.status).toBe('requested');
    });

    it('throws ForbiddenException if a driver attempts to create a ride', () => {
      const driverUser = { sub: mockDriverId, role: 'driver' as const };
      expect(() =>
        ridesController.createRide(driverUser, sampleRideDto),
      ).toThrow(ForbiddenException);
    });
  });

  describe('2. Driver can see available ride', () => {
    it('returns available requested/offered rides with unassigned drivers', async () => {
      const availableRides = [
        { id: mockRideId, status: 'requested', driverId: null, proposedFare: 20.0 },
      ];
      prisma.ride.findMany.mockResolvedValue(availableRides);

      const result = await ridesService.getAvailableRides(mockDriverId);

      expect(prisma.ride.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: { in: ['requested', 'offered'] },
            driverId: null,
          },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockRideId);
    });
  });

  describe('3. Driver can accept available ride', () => {
    it('accepts available ride atomically and assigns driver', async () => {
      const acceptedRide = {
        id: mockRideId,
        status: 'accepted',
        driverId: mockDriverId,
        finalFare: 20.0,
        passenger: { id: mockPassengerId, name: 'Alice', phone: '123' },
        driver: { id: mockDriverId, name: 'Bob', phone: '456', vehicle: null },
      };
      prisma.ride.findUnique
        .mockResolvedValueOnce({
          id: mockRideId,
          status: 'requested',
          driverId: null,
          proposedFare: 20.0,
        })
        .mockResolvedValueOnce(acceptedRide);
      prisma.driver.findUnique.mockResolvedValue({
        id: mockDriverId,
        verificationStatus: 'approved',
      });
      prisma.ride.updateMany.mockResolvedValue({ count: 1 });
      prisma.rideOffer.updateMany.mockResolvedValue({ count: 0 });

      const result = await ridesService.updateRideStatus(
        mockRideId,
        { sub: mockDriverId, role: 'driver' },
        { status: UpdateRideStatusEnum.accepted },
      );

      expect(prisma.ride.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: mockRideId,
            driverId: null,
            status: { in: ['requested', 'offered'] },
          }),
        }),
      );
      expect(result?.status).toBe('accepted');
    });
  });

  describe('4. Second driver cannot claim already accepted ride', () => {
    it('throws ConflictException when atomic updateMany returns count 0 (race condition)', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        status: 'requested',
        driverId: null,
        proposedFare: 20.0,
      });
      prisma.driver.findUnique.mockResolvedValue({
        id: mockDriverId,
        verificationStatus: 'approved',
      });
      prisma.ride.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        ridesService.updateRideStatus(
          mockRideId,
          { sub: mockDriverId, role: 'driver' },
          { status: UpdateRideStatusEnum.accepted },
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('5. Unauthorized driver cannot modify ride', () => {
    it('throws ForbiddenException when an unassigned driver attempts to modify ride status', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        driverId: mockDriverId,
        status: 'accepted',
      });

      await expect(
        ridesService.updateRideStatus(
          mockRideId,
          { sub: mockOtherDriverId, role: 'driver' },
          { status: UpdateRideStatusEnum.ongoing },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('6. Driver can create offer', () => {
    it('creates a counter offer on an available ride for approved driver', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        status: 'requested',
        proposedFare: 20.0,
      });
      prisma.driver.findUnique.mockResolvedValue({ id: mockDriverId, verificationStatus: 'approved' });
      prisma.rideOffer.findFirst.mockResolvedValue(null);
      prisma.rideOffer.create.mockResolvedValue({
        id: mockOfferId,
        rideId: mockRideId,
        driverId: mockDriverId,
        offerType: 'counter',
        offerAmount: 25.0,
        status: 'pending',
      });
      prisma.ride.update.mockResolvedValue({ id: mockRideId, status: 'offered' });

      const dto: CreateOfferDto = {
        offerType: OfferTypeEnum.counter,
        offerAmount: 25.0,
      };

      const offer = await ridesService.createOffer(mockDriverId, mockRideId, dto);

      expect(prisma.rideOffer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rideId: mockRideId,
            driverId: mockDriverId,
            offerType: 'counter',
            offerAmount: 25.0,
            status: 'pending',
          }),
        }),
      );
      expect(offer.id).toBe(mockOfferId);
    });
  });

  describe('7. Duplicate active offer rejected', () => {
    it('throws ConflictException if driver already has an active pending offer', async () => {
      prisma.ride.findUnique.mockResolvedValue({ id: mockRideId, status: 'requested' });
      prisma.driver.findUnique.mockResolvedValue({ id: mockDriverId, verificationStatus: 'approved' });
      prisma.rideOffer.findFirst.mockResolvedValue({ id: 'existing-offer-id', status: 'pending' });

      await expect(
        ridesService.createOffer(mockDriverId, mockRideId, {
          offerType: OfferTypeEnum.counter,
          offerAmount: 22.0,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('8. Passenger can accept offer', () => {
    it('accepts offer, assigns driver, sets finalFare, and rejects competing offers in transaction', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        passengerId: mockPassengerId,
        status: 'offered',
        proposedFare: 20.0,
        driverId: null,
      });

      prisma.rideOffer.findUnique.mockResolvedValue({
        id: mockOfferId,
        rideId: mockRideId,
        driverId: mockDriverId,
        offerAmount: 24.0,
        status: 'pending',
        expiresAt: new Date(Date.now() + 60000),
      });
      prisma.rideOffer.update.mockResolvedValue({ id: mockOfferId, status: 'accepted' });
      prisma.rideOffer.updateMany.mockResolvedValue({ count: 1 });
      prisma.ride.update.mockResolvedValue({
        id: mockRideId,
        status: 'accepted',
        driverId: mockDriverId,
        finalFare: 24.0,
      });

      const result = await ridesService.acceptOffer(mockRideId, mockOfferId, mockPassengerId);

      expect(prisma.rideOffer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockOfferId },
          data: { status: 'accepted' },
        }),
      );
      expect(prisma.rideOffer.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { rideId: mockRideId, id: { not: mockOfferId }, status: 'pending' },
          data: { status: 'rejected' },
        }),
      );
      expect(prisma.ride.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockRideId },
          data: expect.objectContaining({
            status: 'accepted',
            driverId: mockDriverId,
            finalFare: 24.0,
          }),
        }),
      );
      expect(result.ride.status).toBe('accepted');
    });

    it('throws ForbiddenException when another user attempts to accept an offer', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        passengerId: mockPassengerId,
        status: 'offered',
      });

      await expect(
        ridesService.acceptOffer(mockRideId, mockOfferId, mockOtherPassengerId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('9. Invalid ride transition rejected', () => {
    it('rejects completing a ride that is requested instead of ongoing', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        driverId: mockDriverId,
        status: 'requested',
      });

      await expect(
        ridesService.updateRideStatus(
          mockRideId,
          { sub: mockDriverId, role: 'driver' },
          { status: UpdateRideStatusEnum.completed },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects starting a ride that is already completed', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        driverId: mockDriverId,
        status: 'completed',
      });

      await expect(
        ridesService.updateRideStatus(
          mockRideId,
          { sub: mockDriverId, role: 'driver' },
          { status: UpdateRideStatusEnum.ongoing },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('10. Assigned driver can start ride', () => {
    it('updates status from accepted to ongoing and sets startedAt', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        driverId: mockDriverId,
        status: 'accepted',
      });
      prisma.ride.update.mockResolvedValue({
        id: mockRideId,
        status: 'ongoing',
        startedAt: new Date(),
      });

      const result = await ridesService.updateRideStatus(
        mockRideId,
        { sub: mockDriverId, role: 'driver' },
        { status: UpdateRideStatusEnum.ongoing },
      );

      expect(prisma.ride.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'ongoing' }),
        }),
      );
      expect(result?.status).toBe('ongoing');
    });
  });

  describe('11. Unassigned driver cannot start ride', () => {
    it('throws ForbiddenException when non-assigned driver tries to start ride', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        driverId: mockDriverId,
        status: 'accepted',
      });

      await expect(
        ridesService.updateRideStatus(
          mockRideId,
          { sub: mockOtherDriverId, role: 'driver' },
          { status: UpdateRideStatusEnum.ongoing },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('12. Assigned driver can complete ongoing ride', () => {
    it('updates status from ongoing to completed and sets completedAt', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        driverId: mockDriverId,
        status: 'ongoing',
      });
      prisma.ride.update.mockResolvedValue({
        id: mockRideId,
        status: 'completed',
        completedAt: new Date(),
      });

      const result = await ridesService.updateRideStatus(
        mockRideId,
        { sub: mockDriverId, role: 'driver' },
        { status: UpdateRideStatusEnum.completed },
      );

      expect(prisma.ride.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'completed' }),
        }),
      );
      expect(result?.status).toBe('completed');
    });
  });

  describe('13. Driver cannot complete non-ongoing ride', () => {
    it('throws BadRequestException when completing an accepted but not yet started ride', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        driverId: mockDriverId,
        status: 'accepted',
      });

      await expect(
        ridesService.updateRideStatus(
          mockRideId,
          { sub: mockDriverId, role: 'driver' },
          { status: UpdateRideStatusEnum.completed },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('14. Driver can cancel where allowed', () => {
    it('cancels accepted ride when called by assigned driver', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        driverId: mockDriverId,
        status: 'accepted',
      });
      prisma.ride.update.mockResolvedValue({
        id: mockRideId,
        status: 'cancelled',
        cancelledAt: new Date(),
      });

      const result = await ridesService.updateRideStatus(
        mockRideId,
        { sub: mockDriverId, role: 'driver' },
        { status: UpdateRideStatusEnum.cancelled },
      );

      expect(result?.status).toBe('cancelled');
    });
  });

  describe('15. Another driver\'s ride cannot be cancelled', () => {
    it('throws ForbiddenException when another driver tries to cancel assigned ride', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        driverId: mockDriverId,
        status: 'accepted',
      });

      await expect(
        ridesService.updateRideStatus(
          mockRideId,
          { sub: mockOtherDriverId, role: 'driver' },
          { status: UpdateRideStatusEnum.cancelled },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('16. Driver ride history returns completed rides for driver', () => {
    it('returns completed rides with passenger info and numeric fares', async () => {
      const mockCompletedRides = [
        {
          id: mockRideId,
          passengerId: mockPassengerId,
          driverId: mockDriverId,
          pickupAddress: '123 Main St',
          pickupLat: 37.77,
          pickupLng: -122.41,
          dropoffAddress: '456 Market St',
          dropoffLat: 37.78,
          dropoffLng: -122.42,
          distanceKm: 4.5,
          etaMinutes: 12,
          proposedFare: 18.0,
          finalFare: 22.0,
          status: 'completed',
          requestedAt: new Date(),
          startedAt: new Date(),
          completedAt: new Date(),
          cancelledAt: null,
          passenger: {
            id: mockPassengerId,
            name: 'Alice Smith',
            rating: 4.9,
            profilePhotoUrl: null,
          },
        },
      ];
      prisma.ride.findMany.mockResolvedValue(mockCompletedRides);

      const result = await ridesService.getDriverRideHistory(mockDriverId);

      expect(prisma.ride.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            driverId: mockDriverId,
            status: 'completed',
          },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockRideId);
      expect(result[0].finalFare).toBe(22.0);
      expect(result[0].passenger.name).toBe('Alice Smith');
    });
  });

  describe('17. Driver ride history filters by cancelled status', () => {
    it('queries cancelled rides when statusFilter is cancelled', async () => {
      prisma.ride.findMany.mockResolvedValue([]);

      await ridesService.getDriverRideHistory(mockDriverId, 'cancelled');

      expect(prisma.ride.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            driverId: mockDriverId,
            status: 'cancelled',
          },
          orderBy: { cancelledAt: 'desc' },
        }),
      );
    });
  });

  describe('18. Non-driver cannot access ride history', () => {
    it('throws ForbiddenException when role is passenger', () => {
      expect(() =>
        ridesController.getDriverRideHistory({
          sub: mockPassengerId,
          role: 'passenger',
        } as any),
      ).toThrow(ForbiddenException);
    });
  });

  describe('19. Driver earnings calculates aggregates accurately', () => {
    it('computes today, thisWeek, thisMonth, and totalEarnings from completed rides', async () => {
      const now = new Date();
      const todayRide = {
        id: 'ride-today',
        finalFare: 25.0,
        proposedFare: 20.0,
        completedAt: now,
      };

      const mockCompletedRides = [todayRide];
      prisma.ride.findMany.mockResolvedValue(mockCompletedRides);

      const earnings = await ridesService.getDriverEarnings(mockDriverId, 0);

      expect(earnings.today).toBe(25.0);
      expect(earnings.thisWeek).toBe(25.0);
      expect(earnings.thisMonth).toBe(25.0);
      expect(earnings.totalEarnings).toBe(25.0);
      expect(earnings.completedRidesCount).toBe(1);
      expect(earnings.dailyBreakdown).toHaveLength(7);
      expect(earnings.weeklyBreakdown).toHaveLength(4);
      expect(earnings.monthlyBreakdown).toHaveLength(6);
    });
  });

  describe('20. Driver earnings excludes other drivers and cancelled rides at database level', () => {
    it('queries Prisma strictly for authenticated driver and completed status', async () => {
      prisma.ride.findMany.mockResolvedValue([]);

      await ridesService.getDriverEarnings(mockDriverId, 0);

      expect(prisma.ride.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            driverId: mockDriverId,
            status: 'completed',
          },
        }),
      );
    });
  });

  describe('21. Driver earnings breakdown buckets have consistent shape', () => {
    it('formats breakdown buckets with numeric earnings, expenses, and counts', async () => {
      prisma.ride.findMany.mockResolvedValue([]);

      const result = await ridesService.getDriverEarnings(mockDriverId, 0);

      expect(result.dailyBreakdown[0]).toHaveProperty('label');
      expect(result.dailyBreakdown[0]).toHaveProperty('earnings');
      expect(result.dailyBreakdown[0]).toHaveProperty('expenses');
      expect(result.dailyBreakdown[0]).toHaveProperty('count');

      expect(result.weeklyBreakdown[0]).toHaveProperty('label');
      expect(result.monthlyBreakdown[0]).toHaveProperty('label');
    });
  });

  describe('22. Non-driver cannot access driver earnings', () => {
    it('throws ForbiddenException when role is passenger', () => {
      expect(() =>
        ridesController.getDriverEarnings({
          sub: mockPassengerId,
          role: 'passenger',
        } as any),
      ).toThrow(ForbiddenException);
    });
  });

  describe('23. Driver cannot see ride details of ride assigned to another driver', () => {
    it('throws ForbiddenException when completed ride belongs to another driver', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        status: 'completed',
        driverId: mockDriverId,
        passengerId: mockPassengerId,
        offers: [],
      });

      await expect(
        ridesService.getRideById(mockRideId, {
          sub: mockOtherDriverId,
          role: 'driver',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

