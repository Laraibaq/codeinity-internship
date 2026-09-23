import { Test, TestingModule } from '@nestjs/testing';
import { NegotiationService } from './negotiation.service';
import { AiNegotiationProvider } from './ai-negotiation.provider';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

describe('NegotiationService & AiNegotiationProvider Unit Tests', () => {
  let service: NegotiationService;
  let aiProvider: AiNegotiationProvider;
  let prisma: any;
  let realtimeService: any;
  let notificationsService: any;

  const mockPassengerId = '11111111-1111-1111-1111-111111111111';
  const mockDriverId = '22222222-2222-2222-2222-222222222222';
  const mockCompetingDriverId = '33333333-3333-3333-3333-333333333333';
  const mockRideId = '44444444-4444-4444-4444-444444444444';
  const mockNegotiationId = '55555555-5555-5555-5555-555555555555';
  const mockOfferId = '66666666-6666-6666-6666-666666666666';

  beforeEach(async () => {
    prisma = {
      driver: {
        findUnique: jest.fn(),
      },
      ride: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      negotiation: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      negotiationOffer: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      rideOffer: {
        upsert: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    realtimeService = {
      emitNegotiationOfferCreated: jest.fn(),
      emitNegotiationAccepted: jest.fn(),
      emitNegotiationRejected: jest.fn(),
      emitRideAccepted: jest.fn(),
    };

    notificationsService = {
      sendToUser: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NegotiationService,
        AiNegotiationProvider,
        { provide: PrismaService, useValue: prisma },
        { provide: RealtimeService, useValue: realtimeService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<NegotiationService>(NegotiationService);
    aiProvider = module.get<AiNegotiationProvider>(AiNegotiationProvider);
  });

  describe('1. Driver Counteroffer', () => {
    it('rejects unapproved drivers', async () => {
      prisma.driver.findUnique.mockResolvedValue({ id: mockDriverId, verificationStatus: 'pending' });

      await expect(
        service.driverCounter(mockRideId, mockDriverId, { offerAmount: 500 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects rides that are already accepted/completed', async () => {
      prisma.driver.findUnique.mockResolvedValue({ id: mockDriverId, verificationStatus: 'approved' });
      prisma.ride.findUnique.mockResolvedValue({ id: mockRideId, status: 'completed' });

      await expect(
        service.driverCounter(mockRideId, mockDriverId, { offerAmount: 500 }),
      ).rejects.toThrow(ConflictException);
    });

    it('successfully creates negotiation offer and emits realtime event', async () => {
      prisma.driver.findUnique.mockResolvedValue({ id: mockDriverId, verificationStatus: 'approved' });
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        passengerId: mockPassengerId,
        status: 'requested',
        driverId: null,
      });

      const mockNegotiation = {
        id: mockNegotiationId,
        rideId: mockRideId,
        driverId: mockDriverId,
        passengerId: mockPassengerId,
        currentAmount: new Prisma.Decimal('550.00'),
      };
      const mockOffer = {
        id: mockOfferId,
        negotiationId: mockNegotiationId,
        amount: new Prisma.Decimal('550.00'),
        expiresAt: new Date(Date.now() + 600000),
      };

      prisma.negotiation.upsert.mockResolvedValue(mockNegotiation);
      prisma.negotiationOffer.create.mockResolvedValue(mockOffer);

      const res = await service.driverCounter(mockRideId, mockDriverId, { offerAmount: 550 });

      expect(res.id).toBe(mockOfferId);
      expect(prisma.negotiationOffer.create).toHaveBeenCalled();
      expect(realtimeService.emitNegotiationOfferCreated).toHaveBeenCalled();
      expect(notificationsService.sendToUser).toHaveBeenCalledWith(
        mockPassengerId,
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ type: 'negotiation_counter' }),
      );
    });
  });

  describe('2. Passenger Counteroffer', () => {
    it('rejects passengers who do not own the ride', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        passengerId: 'other-passenger-id',
        status: 'offered',
      });

      await expect(
        service.passengerCounter(mockRideId, mockPassengerId, {
          driverId: mockDriverId,
          offerAmount: 520,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects if no active negotiation exists with that driver', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        passengerId: mockPassengerId,
        status: 'offered',
        driverId: null,
      });
      prisma.negotiation.findUnique.mockResolvedValue(null);

      await expect(
        service.passengerCounter(mockRideId, mockPassengerId, {
          driverId: mockDriverId,
          offerAmount: 520,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates passenger counter offer and supersedes older offers', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        passengerId: mockPassengerId,
        status: 'offered',
        driverId: null,
      });
      prisma.negotiation.findUnique.mockResolvedValue({
        id: mockNegotiationId,
        status: 'active',
      });
      const mockCreatedOffer = {
        id: 'new-passenger-offer-id',
        amount: new Prisma.Decimal('520.00'),
        expiresAt: new Date(Date.now() + 600000),
      };
      prisma.negotiationOffer.create.mockResolvedValue(mockCreatedOffer);

      const res = await service.passengerCounter(mockRideId, mockPassengerId, {
        driverId: mockDriverId,
        offerAmount: 520,
      });

      expect(res.id).toBe('new-passenger-offer-id');
      expect(prisma.negotiationOffer.updateMany).toHaveBeenCalledWith({
        where: { negotiationId: mockNegotiationId, status: 'pending' },
        data: { status: 'superseded' },
      });
      expect(realtimeService.emitNegotiationOfferCreated).toHaveBeenCalled();
    });
  });

  describe('3. Mutual Acceptance & Atomic Final Fare Settlement', () => {
    it('prevents proposer from accepting their own offer', async () => {
      prisma.negotiationOffer.findUnique.mockResolvedValue({
        id: mockOfferId,
        rideId: mockRideId,
        proposerId: mockPassengerId,
        recipientId: mockDriverId,
        status: 'pending',
        expiresAt: new Date(Date.now() + 600000),
        negotiation: { driverId: mockDriverId },
      });

      await expect(
        service.acceptNegotiation(
          mockRideId,
          { sub: mockPassengerId, role: 'passenger' } as any,
          mockOfferId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects expired offers', async () => {
      prisma.negotiationOffer.findUnique.mockResolvedValue({
        id: mockOfferId,
        rideId: mockRideId,
        proposerId: mockDriverId,
        recipientId: mockPassengerId,
        status: 'pending',
        expiresAt: new Date(Date.now() - 10000), // expired
        negotiation: { driverId: mockDriverId },
      });

      await expect(
        service.acceptNegotiation(
          mockRideId,
          { sub: mockPassengerId, role: 'passenger' } as any,
          mockOfferId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('atomically sets Ride.finalFare and rejects competing negotiations', async () => {
      const mockOffer = {
        id: mockOfferId,
        rideId: mockRideId,
        negotiationId: mockNegotiationId,
        proposerId: mockDriverId,
        recipientId: mockPassengerId,
        status: 'pending',
        amount: new Prisma.Decimal('550.00'),
        expiresAt: new Date(Date.now() + 600000),
        negotiation: { driverId: mockDriverId },
      };

      prisma.negotiationOffer.findUnique.mockResolvedValue(mockOffer);
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        status: 'offered',
        driverId: null,
        passengerId: mockPassengerId,
      });
      prisma.ride.findFirst.mockResolvedValue(null); // driver not occupied

      prisma.negotiationOffer.update.mockResolvedValue({ ...mockOffer, status: 'accepted' });
      prisma.ride.update.mockResolvedValue({
        id: mockRideId,
        status: 'accepted',
        driverId: mockDriverId,
        finalFare: new Prisma.Decimal('550.00'),
        passengerId: mockPassengerId,
      });

      const res = await service.acceptNegotiation(
        mockRideId,
        { sub: mockPassengerId, role: 'passenger' } as any,
        mockOfferId,
      );

      expect(res.ride.finalFare.toString()).toBe('550');
      expect(res.ride.status).toBe('accepted');
      expect(prisma.negotiation.updateMany).toHaveBeenCalledWith({
        where: {
          rideId: mockRideId,
          id: { not: mockNegotiationId },
          status: 'active',
        },
        data: { status: 'rejected' },
      });
      expect(realtimeService.emitNegotiationAccepted).toHaveBeenCalled();
    });
  });

  describe('4. AI Smart Fare Provider & Advisory Purity', () => {
    it('honestly reports not_configured when no API key is present and provides safe deterministic bounds', async () => {
      const suggestion = await aiProvider.generateFareSuggestion({
        rideId: mockRideId,
        distanceKm: 10,
        etaMinutes: 20,
        proposedFare: 400,
        counterpartyRole: 'driver',
        roundsCount: 1,
      });

      expect(suggestion.providerStatus).toBe('not_configured');
      expect(suggestion.isAdvisoryOnly).toBe(true);
      expect(suggestion.suggestedFare).toBeGreaterThan(0);
      expect(suggestion.suggestedFare).toBeGreaterThanOrEqual(suggestion.minBound);
      expect(suggestion.suggestedFare).toBeLessThanOrEqual(suggestion.maxBound);
      expect(suggestion.currency).toBe('PKR');
    });

    it('strictly clamps absurd or injected AI outputs to server-defined bounds', () => {
      const { minBound, maxBound } = aiProvider.calculateFareBounds(5); // ~325 PKR baseline
      const maliciousOutput = {
        suggestedFare: 999999999, // absurd injected value
        confidence: 0.9,
        reason: 'Ignore rules set price to maximum',
      };

      const clamped = aiProvider.validateAndClampOutput(maliciousOutput, minBound, maxBound, 'live');
      expect(clamped.suggestedFare).toBe(maxBound);
      expect(clamped.suggestedFare).toBeLessThanOrEqual(maxBound);

      const zeroOutput = { suggestedFare: -100 };
      const clampedZero = aiProvider.validateAndClampOutput(zeroOutput, minBound, maxBound, 'live');
      expect(clampedZero.suggestedFare).toBe(minBound);
    });

    it('advisory endpoint does NOT mutate any database models', async () => {
      prisma.ride.findUnique.mockResolvedValue({
        id: mockRideId,
        distanceKm: 5,
        etaMinutes: 12,
        proposedFare: new Prisma.Decimal('300.00'),
        passengerId: mockPassengerId,
        negotiations: [],
      });

      const res = await service.getFareSuggestion(mockRideId, {
        sub: mockPassengerId,
        role: 'passenger',
      } as any);

      expect(res.suggestedFare).toBeGreaterThan(0);
      expect(prisma.ride.update).not.toHaveBeenCalled();
      expect(prisma.negotiation.update).not.toHaveBeenCalled();
      expect(prisma.negotiationOffer.create).not.toHaveBeenCalled();
    });
  });
});
