import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

describe('RatingsService & RatingsController', () => {
  let ratingsService: RatingsService;
  let ratingsController: RatingsController;
  let prisma: any;

  const mockDriverId = '33333333-3333-3333-3333-333333333333';
  const mockOtherDriverId = '99999999-9999-9999-9999-999999999999';
  const mockPassengerId = '11111111-1111-1111-1111-111111111111';
  const mockRideId = '44444444-4444-4444-4444-444444444444';

  beforeEach(async () => {
    prisma = {
      driver: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      rating: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      ride: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingsController],
      providers: [
        RatingsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    ratingsService = module.get<RatingsService>(RatingsService);
    ratingsController = module.get<RatingsController>(RatingsController);
  });

  describe('1. Driver rating retrieval', () => {
    it('returns driver average, total count, star breakdown, and review cards', async () => {
      prisma.driver.findUnique.mockResolvedValue({ id: mockDriverId, rating: 4.8 });
      prisma.rating.findMany.mockResolvedValue([
        {
          id: 'r1',
          rideId: mockRideId,
          score: 5,
          comment: 'Great ride!',
          createdAt: new Date(),
          ride: { passenger: { name: 'Alice' } },
        },
        {
          id: 'r2',
          rideId: mockRideId,
          score: 4,
          comment: 'Good driver',
          createdAt: new Date(),
          ride: { passenger: { name: 'Bob' } },
        },
      ]);

      const result = await ratingsService.getDriverRatings(mockDriverId);

      expect(prisma.rating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            toUserId: mockDriverId,
            fromRole: 'passenger',
          },
        }),
      );
      expect(result.totalRatings).toBe(2);
      expect(result.averageRating).toBe(4.5);
      expect(result.starBreakdown[0]).toEqual({ stars: 5, count: 1 });
      expect(result.starBreakdown[1]).toEqual({ stars: 4, count: 1 });
      expect(result.reviews).toHaveLength(2);
      expect(result.reviews[0].name).toBe('Alice');
    });

    it('rejects non-driver role in controller', () => {
      expect(() =>
        ratingsController.getDriverRatings({
          sub: mockPassengerId,
          role: 'passenger',
        } as any),
      ).toThrow(ForbiddenException);
    });
  });

  describe('2. Driver rating submission for passenger', () => {
    it('creates driver-to-passenger rating on completed assigned ride', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        driverId: mockDriverId,
        passengerId: mockPassengerId,
        status: 'completed',
        ratings: [],
      });
      prisma.rating.create.mockResolvedValue({
        id: 'new-rating-id',
        score: 5,
        comment: 'Polite rider',
      });

      const result = await ratingsService.createRideRating(
        mockRideId,
        { sub: mockDriverId, role: 'driver' },
        { score: 5, comment: 'Polite rider' },
      );

      expect(prisma.rating.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rideId: mockRideId,
            fromUserId: mockDriverId,
            toUserId: mockPassengerId,
            fromRole: 'driver',
            score: 5,
          }),
        }),
      );
      expect(result).toHaveProperty('id', 'new-rating-id');
    });

    it('rejects rating if ride is not completed', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        driverId: mockDriverId,
        status: 'ongoing',
        ratings: [],
      });

      await expect(
        ratingsService.createRideRating(
          mockRideId,
          { sub: mockDriverId, role: 'driver' },
          { score: 5 },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects rating if driver is not assigned to the ride', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        driverId: mockDriverId,
        status: 'completed',
        ratings: [],
      });

      await expect(
        ratingsService.createRideRating(
          mockRideId,
          { sub: mockOtherDriverId, role: 'driver' },
          { score: 5 },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects duplicate rating for the same ride', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        driverId: mockDriverId,
        status: 'completed',
        ratings: [{ fromUserId: mockDriverId }],
      });

      await expect(
        ratingsService.createRideRating(
          mockRideId,
          { sub: mockDriverId, role: 'driver' },
          { score: 4 },
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('3. Passenger rating updates driver aggregate rating', () => {
    it('calculates average score and updates Driver.rating in transaction', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        driverId: mockDriverId,
        passengerId: mockPassengerId,
        status: 'completed',
        ratings: [],
      });
      prisma.rating.create.mockResolvedValue({ id: 'p-rating', score: 5 });
      prisma.rating.findMany.mockResolvedValue([{ score: 5 }, { score: 4 }]);
      prisma.driver.update.mockResolvedValue({ id: mockDriverId, rating: 4.5 });

      await ratingsService.createRideRating(
        mockRideId,
        { sub: mockPassengerId, role: 'passenger' },
        { score: 5, comment: 'Awesome ride!' },
      );

      expect(prisma.driver.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockDriverId },
          data: { rating: 4.5 },
        }),
      );
    });
  });
});
