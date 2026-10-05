import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { CreateRideDto } from './dto/create-ride.dto';
import { CreateOfferDto, OfferTypeEnum } from './dto/create-offer.dto';
import { UpdateRideStatusDto, UpdateRideStatusEnum } from './dto/update-ride-status.dto';

import { FareQuoteService } from '../negotiation/fare-quote.service';
import { SUPPORTED_RIDE_PAYMENT_METHODS } from '../negotiation/fare-config';
import { MatchingService, calculateHaversineDistanceKm } from './matching.service';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: MatchingService,
    private readonly realtimeService: RealtimeService,
    private readonly notificationsService: NotificationsService,
    private readonly fareQuoteService: FareQuoteService,
  ) {}

  // Guards every legacy accept path (acceptOffer, driverAcceptOffer, and
  // updateRideStatus's driver-direct-accept branch) against the accept-bypass
  // bug found in the Phase 0 audit: a driver could tap a plain "Accept" and
  // get finalFare set from RideOffer.offerAmount / Ride.proposedFare, even
  // while a real fare negotiation (Negotiation/NegotiationOffer) had already
  // moved the agreed amount somewhere else for that same ride+driver pair.
  //
  // Approach chosen: reject-if-active-negotiation-exists, not "reroute
  // through the negotiation-accept endpoint." Rerouting isn't a clean
  // option here -- these legacy paths key off RideOffer ids, which don't
  // correspond to NegotiationOffer ids, so grafting them onto
  // NegotiationService.acceptNegotiation would mean inventing an id mapping
  // between two independent tables. A guard is the minimal, additive fix:
  // it changes nothing about any accept that has no competing negotiation,
  // and for the case that matters, it fails loudly (ConflictException)
  // instead of silently applying a stale fare. Phase 3 is responsible for
  // pointing the frontend's Accept buttons at the real negotiation-accept
  // endpoint when one applies; this phase only makes sure the backend can't
  // be fooled regardless of what the UI does in the meantime.
  //
  // Existence of an `active` Negotiation row for (rideId, driverId) is
  // treated as sufficient reason to reject, rather than trying to compare
  // its currentAmount against the legacy path's candidate finalFare -- a
  // Negotiation row is only ever created once a driver has actually
  // countered (see NegotiationService.driverCounter), so its mere existence
  // already means "the amount on offer differs from the original ask,"
  // which is exactly the condition the legacy path can't see.
  private async assertNoActiveNegotiation(
    tx: any,
    rideId: string,
    driverId: string,
  ): Promise<void> {
    const activeNegotiation = await tx.negotiation.findUnique({
      where: { rideId_driverId: { rideId, driverId } },
    });
    if (activeNegotiation && activeNegotiation.status === 'active') {
      throw new ConflictException(
        'An active fare negotiation exists for this ride and driver. Use ' +
          'POST /rides/:id/negotiation/accept/:offerId to accept at the ' +
          'negotiated fare instead of this endpoint.',
      );
    }
  }

  async createRide(passengerId: string, dto: CreateRideDto) {
    const passenger = await this.prisma.user.findUnique({
      where: { id: passengerId },
    });
    if (!passenger) {
      throw new NotFoundException('Passenger account not found');
    }

    const paymentMethod = dto.paymentMethod ?? 'cash';
    if (!SUPPORTED_RIDE_PAYMENT_METHODS.includes(paymentMethod)) {
      throw new BadRequestException(
        `Payment method '${paymentMethod}' is not supported yet. Supported: ${SUPPORTED_RIDE_PAYMENT_METHODS.join(', ')}`,
      );
    }

    // Server-authoritative fare bounds: recomputed here from the request, never trusted from the
    // client. The passenger app fetches the same quote from POST /fare/quote.
    const quote = this.fareQuoteService.quote(dto);
    if (dto.proposedFare < quote.minimumFare) {
      throw new BadRequestException(
        `Proposed fare PKR ${dto.proposedFare} is below the minimum allowed fare of PKR ${quote.minimumFare} for this trip`,
      );
    }
    if (dto.proposedFare > quote.maximumFare) {
      throw new BadRequestException(
        `Proposed fare PKR ${dto.proposedFare} is above the maximum allowed fare of PKR ${quote.maximumFare} for this trip`,
      );
    }

    const ride = await this.prisma.ride.create({
      data: {
        passengerId,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        pickupAddress: dto.pickupAddress,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        dropoffAddress: dto.dropoffAddress,
        distanceKm: dto.distanceKm,
        etaMinutes: dto.etaMinutes,
        proposedFare: dto.proposedFare,
        // Server's own recommendation (deterministic formula), not a client-supplied value.
        aiRecommendedFare: quote.recommendedFare,
        fareTier: quote.fareTier,
        vehicleType: quote.vehicleType,
        paymentMethod,
        status: 'requested',
      },
      include: {
        passenger: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    // Automatically initiate matching for nearby eligible drivers
    try {
      await this.matchingService.matchRide(ride.id);
    } catch (err) {
      // Matching errors should not fail ride creation
      console.warn(`Initial driver matching failed for ride ${ride.id}:`, err);
    }

    return ride;
  }

  async matchRide(rideId: string) {
    return this.matchingService.matchRide(rideId);
  }

  async getRideById(rideId: string, user: JwtPayload) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        passenger: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
            profilePhotoUrl: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
            profilePhotoUrl: true,
            currentLat: true,
            currentLng: true,
            updatedAt: true,
            vehicle: true,
          },
        },
        offers: {
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                phone: true,
                rating: true,
                vehicle: true,
              },
            },
          },
        },
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (user.role === 'passenger') {
      if (ride.passengerId !== user.sub) {
        throw new ForbiddenException('You cannot access another passenger\'s ride');
      }
      return ride;
    }

    if (user.role === 'driver') {
      const isAvailable = ride.status === 'requested' || ride.status === 'offered';
      const isAssigned = ride.driverId === user.sub;
      const hasOffer = ride.offers.some((o) => o.driverId === user.sub);

      if (!isAvailable && !isAssigned && !hasOffer) {
        throw new ForbiddenException('You are not authorized to view this ride');
      }

      // If not the assigned driver, only show this driver's own offers
      if (!isAssigned) {
        return {
          ...ride,
          offers: ride.offers.filter((o) => o.driverId === user.sub),
        };
      }

      return ride;
    }

    throw new ForbiddenException('Unauthorized role');
  }

  async getAvailableRides(driverId: string) {
    return this.prisma.ride.findMany({
      where: {
        status: { in: ['requested', 'offered'] },
        driverId: null,
      },
      orderBy: { requestedAt: 'desc' },
      include: {
        passenger: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
            profilePhotoUrl: true,
          },
        },
        offers: {
          where: { driverId },
        },
      },
    });
  }

  async createOffer(driverId: string, rideId: string, dto: CreateOfferDto) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.status !== 'requested' && ride.status !== 'offered') {
      throw new BadRequestException('Ride is no longer available for offers');
    }

    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    if (driver.verificationStatus !== 'approved') {
      throw new ForbiddenException('Only approved drivers can create offers');
    }

    const existingOffer = await this.prisma.rideOffer.findFirst({
      where: {
        rideId,
        driverId,
        status: 'pending',
      },
    });
    if (existingOffer) {
      throw new ConflictException('You already have an active offer for this ride');
    }

    if (dto.offerType === OfferTypeEnum.counter && !dto.offerAmount) {
      throw new BadRequestException('offerAmount is required for counter offers');
    }

    const offerAmount =
      dto.offerType === OfferTypeEnum.counter ? dto.offerAmount : Number(ride.proposedFare);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const offer = await this.prisma.rideOffer.create({
      data: {
        rideId,
        driverId,
        offerType: dto.offerType,
        offerAmount,
        status: 'pending',
        expiresAt,
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
            vehicle: true,
          },
        },
      },
    });

    if (ride.status === 'requested') {
      await this.prisma.ride.update({
        where: { id: rideId },
        data: { status: 'offered' },
      });
      try {
        this.realtimeService.emitRideStatusChanged(
          { rideId, status: 'offered' },
          { passengerId: ride.passengerId },
        );
      } catch (err) {
        // Log and continue
      }
    }

    try {
      this.realtimeService.emitOfferCreated(
        {
          rideId,
          offerId: offer.id,
          driverId,
          status: offer.status,
          pickupAddress: ride.pickupAddress,
          dropoffAddress: ride.dropoffAddress,
          proposedFare: Number(offer.offerAmount),
          expiresAt: offer.expiresAt,
          driverName: offer.driver?.name,
          driverRating: offer.driver?.rating != null ? Number(offer.driver.rating) : undefined,
          vehicleModel: offer.driver?.vehicle?.model || undefined,
          vehiclePlate: offer.driver?.vehicle?.registrationNumber || undefined,
        },
        { driverId, passengerId: ride.passengerId },
      );
    } catch (err) {
      // Log and continue
    }

    return offer;
  }

  async getOffers(rideId: string, user: JwtPayload) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    // Auto-expire outdated pending offers for this ride
    await this.prisma.rideOffer.updateMany({
      where: {
        rideId,
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired' },
    });

    if (user.role === 'passenger') {
      if (ride.passengerId !== user.sub) {
        throw new ForbiddenException('You cannot access offers for another passenger\'s ride');
      }

      const offers = await this.prisma.rideOffer.findMany({
        where: {
          rideId,
          status: { in: ['pending', 'accepted'] },
        },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              rating: true,
              profilePhotoUrl: true,
              currentLat: true,
              currentLng: true,
              vehicle: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return offers.map((offer) => {
        let dist = 1.0;
        if (offer.driver.currentLat != null && offer.driver.currentLng != null) {
          dist = calculateHaversineDistanceKm(
            ride.pickupLat,
            ride.pickupLng,
            offer.driver.currentLat,
            offer.driver.currentLng,
          );
        }
        const etaMin = Math.max(1, Math.round(dist * 2));
        const vehicleModel = offer.driver.vehicle
          ? `${offer.driver.vehicle.make || ''} ${offer.driver.vehicle.model || ''}`.trim() || 'Standard'
          : 'Standard';

        return {
          id: offer.id,
          rideId: offer.rideId,
          driverId: offer.driverId,
          driverName: offer.driver.name,
          driverRating: offer.driver.rating ?? 5.0,
          driverPhotoUrl: offer.driver.profilePhotoUrl ?? undefined,
          vehicleModel,
          vehiclePlate: offer.driver.vehicle?.registrationNumber || 'ABC-123',
          vehicleColor: offer.driver.vehicle?.color ?? undefined,
          offeredFare: Number(offer.offerAmount ?? ride.proposedFare),
          distanceKm: dist,
          estimatedArrivalMinutes: etaMin,
          status: offer.status,
          offerType: offer.offerType,
          expiresAt: offer.expiresAt,
          createdAt: offer.createdAt,
        };
      });
    }

    if (user.role === 'driver') {
      return this.prisma.rideOffer.findMany({
        where: { rideId, driverId: user.sub },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              rating: true,
              vehicle: true,
            },
          },
        },
      });
    }

    throw new ForbiddenException('Unauthorized');
  }

  async acceptOffer(rideId: string, offerId: string, passengerId: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.passengerId !== passengerId) {
      throw new ForbiddenException('You can only accept offers for your own ride');
    }

    if (ride.status !== 'requested' && ride.status !== 'offered') {
      throw new BadRequestException('Ride is no longer available to accept offers');
    }

    const offerCheck = await this.prisma.rideOffer.findUnique({ where: { id: offerId } });
    if (!offerCheck || offerCheck.rideId !== rideId) {
      throw new NotFoundException('Offer not found for this ride');
    }
    if (offerCheck.status !== 'pending') {
      throw new BadRequestException('Offer is no longer pending');
    }
    if (offerCheck.expiresAt < new Date()) {
      await this.prisma.rideOffer.update({ where: { id: offerId }, data: { status: 'expired' } });
      throw new BadRequestException('Offer has expired');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Re-verify ride availability within transaction
      const currentRide = await tx.ride.findUnique({ where: { id: rideId } });
      if (!currentRide || (currentRide.status !== 'requested' && currentRide.status !== 'offered') || currentRide.driverId !== null) {
        throw new ConflictException('Ride is no longer available to accept offers');
      }

      // 2. Validate offer
      const offer = await tx.rideOffer.findUnique({ where: { id: offerId } });
      if (!offer || offer.rideId !== rideId) {
        throw new NotFoundException('Offer not found for this ride');
      }
      if (offer.status !== 'pending') {
        throw new BadRequestException('Offer is no longer pending');
      }
      if (offer.expiresAt < new Date()) {
        throw new BadRequestException('Offer has expired');
      }


      // 3. Verify driver is not occupied with an active ride
      const occupiedRide = await tx.ride.findFirst({
        where: {
          driverId: offer.driverId,
          status: { in: ['accepted', 'ongoing'] },
        },
      });
      if (occupiedRide) {
        throw new ConflictException('Driver is currently occupied with another ride');
      }

      // 3b. Reject if a real fare negotiation is in progress for this ride+driver
      // (see assertNoActiveNegotiation's comment for why this exists).
      await this.assertNoActiveNegotiation(tx, rideId, offer.driverId);

      // 4. Update accepted offer
      const acceptedOffer = await tx.rideOffer.update({
        where: { id: offerId },
        data: { status: 'accepted' },
      });

      // 5. Invalidate all other pending offers for this ride
      await tx.rideOffer.updateMany({
        where: {
          rideId,
          id: { not: offerId },
          status: 'pending',
        },
        data: { status: 'rejected' },
      });

      const finalFare = offer.offerAmount ?? currentRide.proposedFare;

      // 6. Assign driver and mark ride accepted
      const updatedRide = await tx.ride.update({
        where: { id: rideId },
        data: {
          status: 'accepted',
          driverId: offer.driverId,
          finalFare,
        },
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              vehicle: true,
            },
          },
        },
      });

      return {
        ride: updatedRide,
        offer: acceptedOffer,
      };
    }, { timeout: 45000, maxWait: 25000 });

    try {
      this.realtimeService.emitRideAccepted(
        {
          rideId,
          driverId: result.offer.driverId,
          status: 'accepted',
          finalFare: Number(result.ride.finalFare),
        },
        {
          passengerId,
          driverId: result.offer.driverId,
        },
      );
      this.realtimeService.emitOfferUpdated(
        {
          rideId,
          offerId,
          driverId: result.offer.driverId,
          status: 'accepted',
        },
        {
          passengerId,
          driverId: result.offer.driverId,
        },
      );
    } catch (err) {
      // Log and continue
    }

    // Phase 10: Asynchronous push notifications
    try {
      this.notificationsService
        .sendToUser(
          passengerId,
          'Ride Accepted',
          'Your ride request has been accepted!',
          { type: 'ride_accepted', rideId, driverId: result.offer.driverId },
        )
        .catch((pushErr) => this.logger.warn(`Push failed for passenger: ${pushErr?.message}`));

      this.notificationsService
        .sendToUser(
          result.offer.driverId,
          'Offer Accepted',
          'The passenger accepted your offer!',
          { type: 'ride_accepted', rideId },
        )
        .catch((pushErr) => this.logger.warn(`Push failed for driver: ${pushErr?.message}`));
    } catch (err) {
      this.logger.warn(`Failed to dispatch push on acceptOffer: ${err?.message}`);
    }

    return result;
  }

  async declineOffer(rideId: string, offerId: string, passengerId: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }
    if (ride.passengerId !== passengerId) {
      throw new ForbiddenException('You can only decline offers for your own ride');
    }

    const offer = await this.prisma.rideOffer.findUnique({ where: { id: offerId } });
    if (!offer || offer.rideId !== rideId) {
      throw new NotFoundException('Offer not found for this ride');
    }

    const updatedOffer = await this.prisma.rideOffer.update({
      where: { id: offerId },
      data: { status: 'rejected' },
    });

    try {
      this.realtimeService.emitOfferUpdated(
        {
          rideId,
          offerId,
          driverId: offer.driverId,
          status: 'rejected',
        },
        {
          passengerId,
          driverId: offer.driverId,
        },
      );
    } catch (err) {
      // Log and continue
    }

    return updatedOffer;
  }

  async driverAcceptOffer(driverId: string, rideId: string, offerId: string) {
    const offer = await this.prisma.rideOffer.findUnique({ where: { id: offerId } });
    if (!offer || offer.rideId !== rideId) {
      throw new NotFoundException('Offer not found');
    }
    if (offer.driverId !== driverId) {
      throw new ForbiddenException('You can only accept your own offer');
    }

    if (offer.status !== 'pending') {
      throw new BadRequestException('Offer is no longer pending');
    }
    if (offer.expiresAt < new Date()) {
      await this.prisma.rideOffer.update({ where: { id: offerId }, data: { status: 'expired' } });
      throw new BadRequestException('Offer has expired');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const currentRide = await tx.ride.findUnique({ where: { id: rideId } });
      if (!currentRide || (currentRide.status !== 'requested' && currentRide.status !== 'offered') || currentRide.driverId !== null) {
        throw new ConflictException('Ride is no longer available');
      }

      if (offer.status !== 'pending') {
        throw new BadRequestException('Offer is no longer pending');
      }
      if (offer.expiresAt < new Date()) {
        throw new BadRequestException('Offer has expired');
      }


      const occupiedRide = await tx.ride.findFirst({
        where: {
          driverId,
          status: { in: ['accepted', 'ongoing'] },
        },
      });
      if (occupiedRide) {
        throw new ConflictException('Driver is currently occupied with another ride');
      }

      // Reject if a real fare negotiation is in progress for this ride+driver
      // (see assertNoActiveNegotiation's comment for why this exists).
      await this.assertNoActiveNegotiation(tx, rideId, driverId);

      const acceptedOffer = await tx.rideOffer.update({
        where: { id: offerId },
        data: { status: 'accepted' },
      });

      await tx.rideOffer.updateMany({
        where: {
          rideId,
          id: { not: offerId },
          status: 'pending',
        },
        data: { status: 'rejected' },
      });

      const finalFare = offer.offerAmount ?? currentRide.proposedFare;

      const updatedRide = await tx.ride.update({
        where: { id: rideId },
        data: {
          status: 'accepted',
          driverId,
          finalFare,
        },
        include: {
          passenger: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              vehicle: true,
            },
          },
        },
      });

      return {
        ride: updatedRide,
        offer: acceptedOffer,
      };
    }, { timeout: 45000, maxWait: 25000 });

    try {
      this.realtimeService.emitRideAccepted(
        {
          rideId,
          driverId,
          status: 'accepted',
          finalFare: Number(result.ride.finalFare),
        },
        {
          passengerId: result.ride.passengerId || (result.ride as any).passenger?.id,
          driverId,
        },
      );
      this.realtimeService.emitOfferUpdated(
        {
          rideId,
          offerId,
          driverId,
          status: 'accepted',
        },
        {
          passengerId: result.ride.passengerId || (result.ride as any).passenger?.id,
          driverId,
        },
      );
    } catch (err) {
      // Log and continue
    }

    // Phase 10: Asynchronous push notification to passenger
    try {
      const passengerId = result.ride.passengerId || (result.ride as any).passenger?.id;
      if (passengerId) {
        this.notificationsService
          .sendToUser(
            passengerId,
            'Ride Accepted',
            'A driver has accepted your ride request!',
            { type: 'ride_accepted', rideId, driverId },
          )
          .catch((pushErr) => this.logger.warn(`Push failed: ${pushErr?.message}`));
      }
    } catch (err) {
      this.logger.warn(`Failed to dispatch push on driverAcceptOffer: ${err?.message}`);
    }

    return result;
  }

  async driverRejectOffer(driverId: string, rideId: string, offerId: string) {
    const offer = await this.prisma.rideOffer.findUnique({ where: { id: offerId } });
    if (!offer || offer.rideId !== rideId || offer.driverId !== driverId) {
      throw new NotFoundException('Offer not found for this driver');
    }
    const updatedOffer = await this.prisma.rideOffer.update({
      where: { id: offerId },
      data: { status: 'rejected' },
    });

    try {
      this.realtimeService.emitOfferUpdated(
        {
          rideId,
          offerId,
          driverId,
          status: 'rejected',
        },
        {
          driverId,
        },
      );
    } catch (err) {
      // Log and continue
    }

    return updatedOffer;
  }

  async getDriverOffers(driverId: string) {
    await this.prisma.rideOffer.updateMany({
      where: {
        driverId,
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired' },
    });

    return this.prisma.rideOffer.findMany({
      where: {
        driverId,
        status: 'pending',
        expiresAt: { gt: new Date() },
        ride: {
          status: { in: ['requested', 'offered'] },
          driverId: null,
        },
      },
      include: {
        ride: {
          include: {
            passenger: {
              select: {
                id: true,
                name: true,
                phone: true,
                rating: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRideStatus(
    rideId: string,
    user: JwtPayload,
    dto: UpdateRideStatusDto,
  ) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    const { status: targetStatus } = dto;

    if (user.role === 'driver') {
      // Driver direct accept of requested/offered ride
      if (targetStatus === UpdateRideStatusEnum.accepted) {
        const driver = await this.prisma.driver.findUnique({ where: { id: user.sub } });
        if (!driver) {
          throw new NotFoundException('Driver not found');
        }
        if (driver.verificationStatus !== 'approved') {
          throw new ForbiddenException('Only approved drivers can accept rides');
        }

        if (ride.status !== 'requested' && ride.status !== 'offered') {
          throw new BadRequestException(
            `Cannot accept ride with current status "${ride.status}"`,
          );
        }
        if (ride.driverId && ride.driverId !== user.sub) {
          throw new ConflictException('Ride is already assigned to another driver');
        }

        const result = await this.prisma.$transaction(async (tx) => {
          // Reject if a real fare negotiation is in progress for this ride+driver
          // (see assertNoActiveNegotiation's comment for why this exists).
          await this.assertNoActiveNegotiation(tx, rideId, user.sub);

          const updateResult = await tx.ride.updateMany({
            where: {
              id: rideId,
              driverId: null,
              status: { in: ['requested', 'offered'] },
            },
            data: {
              status: 'accepted',
              driverId: user.sub,
              finalFare: ride.proposedFare,
            },
          });

          if (updateResult.count === 0) {
            throw new ConflictException('Ride is already assigned to another driver');
          }

          // Reject competing offers
          await tx.rideOffer.updateMany({
            where: {
              rideId,
              driverId: { not: user.sub },
              status: 'pending',
            },
            data: { status: 'rejected' },
          });

          // Accept this driver's pending offer if one exists
          await tx.rideOffer.updateMany({
            where: {
              rideId,
              driverId: user.sub,
              status: 'pending',
            },
            data: { status: 'accepted' },
          });

          return tx.ride.findUnique({
            where: { id: rideId },
            include: {
              passenger: { select: { id: true, name: true, phone: true } },
              driver: { select: { id: true, name: true, phone: true, vehicle: true } },
            },
          });
        }, { timeout: 45000, maxWait: 25000 });

        try {
          this.realtimeService.emitRideAccepted(
            {
              rideId,
              driverId: user.sub,
              status: 'accepted',
              finalFare: Number(result?.finalFare ?? ride.proposedFare),
            },
            {
              passengerId: ride.passengerId,
              driverId: user.sub,
            },
          );
          this.realtimeService.emitRideStatusChanged(
            { rideId, status: 'accepted' },
            { passengerId: ride.passengerId, driverId: user.sub },
          );
        } catch (err) {
          // Log and continue
        }

        // Phase 10: Asynchronous push notification to passenger
        try {
          this.notificationsService
            .sendToUser(
              ride.passengerId,
              'Ride Accepted',
              'A driver has accepted your ride request!',
              { type: 'ride_accepted', rideId, driverId: user.sub },
            )
            .catch((pushErr) => this.logger.warn(`Push failed: ${pushErr?.message}`));
        } catch (err) {
          this.logger.warn(`Failed to dispatch push on driver direct accept: ${err?.message}`);
        }

        return result;
      }

      // Driver starts ride
      if (targetStatus === UpdateRideStatusEnum.ongoing) {
        if (ride.driverId !== user.sub) {
          throw new ForbiddenException('Only the assigned driver can start this ride');
        }
        if (ride.status !== 'accepted') {
          if (ride.status === 'ongoing') {
            throw new ConflictException('Ride is already ongoing');
          }
          throw new BadRequestException(
            `Cannot start ride with current status "${ride.status}"`,
          );
        }

        const now = new Date();
        const updateResult = await this.prisma.ride.updateMany({
          where: {
            id: rideId,
            driverId: user.sub,
            status: 'accepted',
          },
          data: {
            status: 'ongoing',
            startedAt: now,
          },
        });

        if (updateResult.count === 0) {
          const fresh = await this.prisma.ride.findUnique({ where: { id: rideId } });
          if (!fresh) throw new NotFoundException('Ride not found');
          if (fresh.status === 'ongoing') throw new ConflictException('Ride is already ongoing');
          throw new BadRequestException(`Cannot start ride with current status "${fresh.status}"`);
        }

        const updated = (await this.prisma.ride.findUnique({ where: { id: rideId } }))!;
        try {
          this.realtimeService.emitRideStatusChanged(
            { rideId, status: 'ongoing', timestamp: now.toISOString() },
            { passengerId: ride.passengerId, driverId: user.sub },
          );
        } catch (err) {
          // Log and continue
        }

        // Phase 10: Asynchronous push notification to passenger
        try {
          this.notificationsService
            .sendToUser(
              ride.passengerId,
              'Ride Started',
              'Your trip is now in progress. Have a safe journey!',
              { type: 'ride_started', rideId },
            )
            .catch((pushErr) => this.logger.warn(`Push failed: ${pushErr?.message}`));
        } catch (err) {
          this.logger.warn(`Failed to dispatch push on ride start: ${err?.message}`);
        }

        return updated;
      }

      // Driver completes ride
      if (targetStatus === UpdateRideStatusEnum.completed) {
        if (ride.driverId !== user.sub) {
          throw new ForbiddenException('Only the assigned driver can complete this ride');
        }
        if (ride.status !== 'ongoing') {
          if (ride.status === 'completed') {
            throw new ConflictException('Ride is already completed');
          }
          throw new BadRequestException(
            `Cannot complete ride with current status "${ride.status}"`,
          );
        }

        const now = new Date();
        const updateResult = await this.prisma.ride.updateMany({
          where: {
            id: rideId,
            driverId: user.sub,
            status: 'ongoing',
          },
          data: {
            status: 'completed',
            completedAt: now,
          },
        });

        if (updateResult.count === 0) {
          const fresh = await this.prisma.ride.findUnique({ where: { id: rideId } });
          if (!fresh) throw new NotFoundException('Ride not found');
          if (fresh.status === 'completed') throw new ConflictException('Ride is already completed');
          throw new BadRequestException(`Cannot complete ride with current status "${fresh.status}"`);
        }

        const updated = (await this.prisma.ride.findUnique({ where: { id: rideId } }))!;
        const fare = Number(updated.finalFare ?? updated.proposedFare ?? 0);
        if (this.prisma.notification?.create) {
          try {
            await this.prisma.notification.create({
              data: {
                driverId: user.sub,
                title: 'Ride completed',
                message: `Trip to ${updated.dropoffAddress} completed. Earnings: $${fare.toFixed(2)}.`,
                type: 'ride',
                isRead: false,
              },
            });
          } catch {
            // Ignore notification creation error
          }
        }

        try {
          this.realtimeService.emitRideStatusChanged(
            { rideId, status: 'completed', timestamp: now.toISOString() },
            { passengerId: ride.passengerId, driverId: user.sub },
          );
        } catch (err) {
          // Log and continue
        }

        // Phase 10: Asynchronous push notification to passenger
        try {
          this.notificationsService
            .sendToUser(
              ride.passengerId,
              'Ride Completed',
              `Your ride has arrived! Total: $${fare.toFixed(2)}. Don't forget to rate your trip.`,
              { type: 'ride_completed', rideId, fare },
            )
            .catch((pushErr) => this.logger.warn(`Push failed: ${pushErr?.message}`));
        } catch (err) {
          this.logger.warn(`Failed to dispatch push on ride complete: ${err?.message}`);
        }

        return updated;
      }

      // Driver cancels accepted ride
      if (targetStatus === UpdateRideStatusEnum.cancelled) {
        if (ride.driverId !== user.sub) {
          throw new ForbiddenException('Only the assigned driver can cancel this ride');
        }
        if (ride.status !== 'accepted') {
          if (ride.status === 'cancelled') {
            throw new ConflictException('Ride is already cancelled');
          }
          throw new BadRequestException(
            `Driver cannot cancel ride with status "${ride.status}"`,
          );
        }

        const now = new Date();
        const updateResult = await this.prisma.ride.updateMany({
          where: {
            id: rideId,
            driverId: user.sub,
            status: 'accepted',
          },
          data: {
            status: 'cancelled',
            cancelledAt: now,
          },
        });

        if (updateResult.count === 0) {
          const fresh = await this.prisma.ride.findUnique({ where: { id: rideId } });
          if (!fresh) throw new NotFoundException('Ride not found');
          if (fresh.status === 'cancelled') throw new ConflictException('Ride is already cancelled');
          throw new BadRequestException(`Driver cannot cancel ride with status "${fresh.status}"`);
        }

        await this.prisma.rideOffer.updateMany({
          where: { rideId, status: { in: ['pending', 'accepted'] } },
          data: { status: 'rejected' },
        });

        const updated = (await this.prisma.ride.findUnique({ where: { id: rideId } }))!;
        try {
          this.realtimeService.emitRideStatusChanged(
            { rideId, status: 'cancelled', timestamp: now.toISOString() },
            { passengerId: ride.passengerId, driverId: user.sub },
          );
        } catch (err) {
          // Log and continue
        }

        // Phase 10: Asynchronous push notification to passenger
        try {
          this.notificationsService
            .sendToUser(
              ride.passengerId,
              'Ride Cancelled',
              'Your driver cancelled the ride. We apologize for the inconvenience.',
              { type: 'ride_cancelled', rideId, cancelledBy: 'driver' },
            )
            .catch((pushErr) => this.logger.warn(`Push failed: ${pushErr?.message}`));
        } catch (err) {
          this.logger.warn(`Failed to dispatch push on driver cancel: ${err?.message}`);
        }

        return updated;
      }
    }

    if (user.role === 'passenger') {
      // Passenger cancels ride
      if (targetStatus === UpdateRideStatusEnum.cancelled) {
        if (ride.passengerId !== user.sub) {
          throw new ForbiddenException('Only the ride owner can cancel this ride');
        }
        if (
          ride.status !== 'requested' &&
          ride.status !== 'offered' &&
          ride.status !== 'accepted'
        ) {
          if (ride.status === 'cancelled') {
            throw new ConflictException('Ride is already cancelled');
          }
          throw new BadRequestException(
            `Passenger cannot cancel ride with status "${ride.status}"`,
          );
        }

        const now = new Date();
        const updateResult = await this.prisma.ride.updateMany({
          where: {
            id: rideId,
            passengerId: user.sub,
            status: { in: ['requested', 'offered', 'accepted'] },
          },
          data: {
            status: 'cancelled',
            cancelledAt: now,
          },
        });

        if (updateResult.count === 0) {
          const fresh = await this.prisma.ride.findUnique({ where: { id: rideId } });
          if (!fresh) throw new NotFoundException('Ride not found');
          if (fresh.status === 'cancelled') throw new ConflictException('Ride is already cancelled');
          throw new BadRequestException(`Passenger cannot cancel ride with status "${fresh.status}"`);
        }

        await this.prisma.rideOffer.updateMany({
          where: { rideId, status: { in: ['pending', 'accepted'] } },
          data: { status: 'rejected' },
        });

        const updated = (await this.prisma.ride.findUnique({ where: { id: rideId } }))!;
        try {
          this.realtimeService.emitRideStatusChanged(
            { rideId, status: 'cancelled', timestamp: now.toISOString() },
            { passengerId: ride.passengerId, driverId: ride.driverId ?? undefined },
          );
        } catch (err) {
          // Log and continue
        }

        // Phase 10: Asynchronous push notification to driver (if assigned)
        try {
          if (ride.driverId) {
            this.notificationsService
              .sendToUser(
                ride.driverId,
                'Ride Cancelled',
                'The passenger has cancelled the ride request.',
                { type: 'ride_cancelled', rideId, cancelledBy: 'passenger' },
              )
              .catch((pushErr) => this.logger.warn(`Push failed: ${pushErr?.message}`));
          }
        } catch (err) {
          this.logger.warn(`Failed to dispatch push on passenger cancel: ${err?.message}`);
        }

        return updated;
      }
    }

    throw new BadRequestException(
      `Transition to "${targetStatus}" is not permitted for role "${user.role}"`,
    );
  }

  async cancelRide(rideId: string, user: JwtPayload, _reason?: string) {
    return this.updateRideStatus(rideId, user, { status: UpdateRideStatusEnum.cancelled });
  }

  async getPassengerRideHistory(
    passengerId: string,
    options?: { status?: string; page?: number; limit?: number },
  ) {
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      passengerId,
      status: options?.status
        ? (options.status as any)
        : { in: ['completed', 'cancelled'] },
    };

    const [rides, total] = await Promise.all([
      this.prisma.ride.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              rating: true,
              profilePhotoUrl: true,
              vehicle: true,
            },
          },
        },
      }),
      this.prisma.ride.count({ where }),
    ]);

    return {
      rides: rides.map((ride) => ({
        id: ride.id,
        passengerId: ride.passengerId,
        driverId: ride.driverId,
        status: ride.status,
        pickupAddress: ride.pickupAddress,
        destinationAddress: ride.dropoffAddress,
        dropoffAddress: ride.dropoffAddress,
        pickupLat: ride.pickupLat,
        pickupLng: ride.pickupLng,
        dropoffLat: ride.dropoffLat,
        dropoffLng: ride.dropoffLng,
        distanceKm: ride.distanceKm,
        etaMinutes: ride.etaMinutes,
        proposedFare: Number(ride.proposedFare),
        aiRecommendedFare: Number(ride.aiRecommendedFare),
        finalFare: ride.finalFare ? Number(ride.finalFare) : null,
        fare: Number(ride.finalFare ?? ride.proposedFare),
        createdAt: ride.requestedAt.toISOString(),
        requestedAt: ride.requestedAt.toISOString(),
        startedAt: ride.startedAt ? ride.startedAt.toISOString() : null,
        completedAt: ride.completedAt ? ride.completedAt.toISOString() : null,
        cancelledAt: ride.cancelledAt ? ride.cancelledAt.toISOString() : null,
        driver: ride.driver,
      })),
      total,
      page,
      limit,
    };
  }

  async getDriverRideHistory(driverId: string, statusFilter?: string) {
    const status = statusFilter === 'cancelled' ? 'cancelled' : 'completed';

    const rides = await this.prisma.ride.findMany({
      where: {
        driverId,
        status: status as any,
      },
      orderBy: status === 'completed' ? { completedAt: 'desc' } : { cancelledAt: 'desc' },
      include: {
        passenger: {
          select: {
            id: true,
            name: true,
            rating: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    return rides.map((ride) => ({
      id: ride.id,
      passengerId: ride.passengerId,
      driverId: ride.driverId,
      pickupAddress: ride.pickupAddress,
      pickupLat: ride.pickupLat,
      pickupLng: ride.pickupLng,
      dropoffAddress: ride.dropoffAddress,
      dropoffLat: ride.dropoffLat,
      dropoffLng: ride.dropoffLng,
      distanceKm: ride.distanceKm,
      etaMinutes: ride.etaMinutes,
      proposedFare: Number(ride.proposedFare),
      finalFare: ride.finalFare ? Number(ride.finalFare) : Number(ride.proposedFare),
      status: ride.status,
      requestedAt: ride.requestedAt,
      startedAt: ride.startedAt,
      completedAt: ride.completedAt,
      cancelledAt: ride.cancelledAt,
      passenger: ride.passenger,
    }));
  }

  async getDriverEarnings(driverId: string, timezoneOffsetMinutes = 0) {
    const completedRides = await this.prisma.ride.findMany({
      where: {
        driverId,
        status: 'completed',
      },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        finalFare: true,
        proposedFare: true,
        completedAt: true,
      },
    });

    const now = new Date();
    const clientOffsetMs = timezoneOffsetMinutes * 60 * 1000;
    const clientNow = new Date(now.getTime() - clientOffsetMs);

    const clientTodayYear = clientNow.getUTCFullYear();
    const clientTodayMonth = clientNow.getUTCMonth();
    const clientTodayDate = clientNow.getUTCDate();

    const startOfTodayClient = new Date(Date.UTC(clientTodayYear, clientTodayMonth, clientTodayDate));
    const startOfTodayUtc = new Date(startOfTodayClient.getTime() + clientOffsetMs);

    const dayOfWeek = clientNow.getUTCDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeekClient = new Date(Date.UTC(clientTodayYear, clientTodayMonth, clientTodayDate - diffToMonday));
    const startOfWeekUtc = new Date(startOfWeekClient.getTime() + clientOffsetMs);

    const startOfMonthClient = new Date(Date.UTC(clientTodayYear, clientTodayMonth, 1));
    const startOfMonthUtc = new Date(startOfMonthClient.getTime() + clientOffsetMs);

    let today = 0;
    let thisWeek = 0;
    let thisMonth = 0;
    let totalEarnings = 0;

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyBreakdown = dayNames.map((label, index) => {
      const dayStartClient = new Date(Date.UTC(clientTodayYear, clientTodayMonth, clientTodayDate - diffToMonday + index));
      const dayEndClient = new Date(dayStartClient.getTime() + 24 * 60 * 60 * 1000);
      const dayStartUtc = new Date(dayStartClient.getTime() + clientOffsetMs);
      const dayEndUtc = new Date(dayEndClient.getTime() + clientOffsetMs);
      return {
        label,
        earnings: 0,
        count: 0,
        dayStartUtc,
        dayEndUtc,
      };
    });

    const weeklyBreakdown = [
      { label: 'W1', earnings: 0, count: 0, startDay: 1, endDay: 7 },
      { label: 'W2', earnings: 0, count: 0, startDay: 8, endDay: 14 },
      { label: 'W3', earnings: 0, count: 0, startDay: 15, endDay: 21 },
      { label: 'W4', earnings: 0, count: 0, startDay: 22, endDay: 31 },
    ];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyBreakdown = Array.from({ length: 6 }, (_, i) => {
      const monthIdx = (clientTodayMonth - 5 + i + 12) % 12;
      return {
        label: monthNames[monthIdx],
        monthIndex: monthIdx,
        earnings: 0,
        count: 0,
      };
    });

    for (const ride of completedRides) {
      const fare = Number(ride.finalFare ?? ride.proposedFare ?? 0);
      totalEarnings += fare;

      const rideTime = ride.completedAt ?? new Date();

      if (rideTime >= startOfTodayUtc) {
        today += fare;
      }
      if (rideTime >= startOfWeekUtc) {
        thisWeek += fare;
      }
      if (rideTime >= startOfMonthUtc) {
        thisMonth += fare;
      }

      for (const bucket of dailyBreakdown) {
        if (rideTime >= bucket.dayStartUtc && rideTime < bucket.dayEndUtc) {
          bucket.earnings += fare;
          bucket.count += 1;
        }
      }

      const rideClientTime = new Date(rideTime.getTime() - clientOffsetMs);
      if (
        rideClientTime.getUTCFullYear() === clientTodayYear &&
        rideClientTime.getUTCMonth() === clientTodayMonth
      ) {
        const rideDay = rideClientTime.getUTCDate();
        for (const bucket of weeklyBreakdown) {
          if (rideDay >= bucket.startDay && rideDay <= bucket.endDay) {
            bucket.earnings += fare;
            bucket.count += 1;
          }
        }
      }

      const rideMonth = rideClientTime.getUTCMonth();
      for (const bucket of monthlyBreakdown) {
        if (bucket.monthIndex === rideMonth) {
          bucket.earnings += fare;
          bucket.count += 1;
        }
      }
    }

    return {
      today: Number(today.toFixed(2)),
      thisWeek: Number(thisWeek.toFixed(2)),
      thisMonth: Number(thisMonth.toFixed(2)),
      totalEarnings: Number(totalEarnings.toFixed(2)),
      completedRidesCount: completedRides.length,
      dailyBreakdown: dailyBreakdown.map((b) => ({
        label: b.label,
        earnings: Number(b.earnings.toFixed(2)),
        expenses: Number((b.earnings * 0.2).toFixed(2)),
        count: b.count,
      })),
      weeklyBreakdown: weeklyBreakdown.map((b) => ({
        label: b.label,
        earnings: Number(b.earnings.toFixed(2)),
        expenses: Number((b.earnings * 0.2).toFixed(2)),
        count: b.count,
      })),
      monthlyBreakdown: monthlyBreakdown.map((b) => ({
        label: b.label,
        earnings: Number(b.earnings.toFixed(2)),
        expenses: Number((b.earnings * 0.2).toFixed(2)),
        count: b.count,
      })),
    };
  }
}
