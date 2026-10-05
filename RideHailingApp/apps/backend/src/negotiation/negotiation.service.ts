import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AiNegotiationProvider } from './ai-negotiation.provider';
import { FareQuoteService } from './fare-quote.service';
import { calculateHaversineDistanceKm } from '../rides/matching.service';
import { DriverCounterOfferDto, PassengerCounterOfferDto } from './dto/counter-offer.dto';
import { AiFareSuggestionResponse } from './dto/fare-suggestion.dto';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class NegotiationService {
  private readonly logger = new Logger(NegotiationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
    private readonly notificationsService: NotificationsService,
    private readonly aiProvider: AiNegotiationProvider,
    private readonly fareQuoteService: FareQuoteService,
  ) {}

  /**
   * Counter-offers must stay inside the same server-computed range POST /rides enforces, so the
   * minimum fare cannot be bypassed by opening at a valid fare and then countering below it.
   * Rides created before fareTier existed have no tier to price against and are not bounded.
   */
  private assertWithinFareBounds(
    ride: {
      fareTier: string | null;
      pickupLat: number;
      pickupLng: number;
      dropoffLat: number;
      dropoffLng: number;
      distanceKm: number;
    },
    amount: number,
  ) {
    if (!ride.fareTier) return;
    const quote = this.fareQuoteService.quote({
      pickupLat: ride.pickupLat,
      pickupLng: ride.pickupLng,
      dropoffLat: ride.dropoffLat,
      dropoffLng: ride.dropoffLng,
      distanceKm: ride.distanceKm,
      fareTier: ride.fareTier as any,
    });
    if (amount < quote.minimumFare || amount > quote.maximumFare) {
      throw new BadRequestException({
        message: `Offer must be between PKR ${quote.minimumFare} and PKR ${quote.maximumFare} for this trip`,
        code: 'OFFER_OUT_OF_RANGE',
      });
    }
  }

  /**
   * Retrieves active negotiation sessions for a ride.
   */
  async getNegotiationsForRide(rideId: string, user: JwtPayload) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        negotiations: {
          include: {
            driver: {
              // Explicit allow-list: the passenger sees who is coming and in what, never the
              // driver's documents, raw coordinates or contact details beyond name/phone.
              select: {
                id: true,
                name: true,
                phone: true,
                rating: true,
                currentLat: true,
                currentLng: true,
                vehicle: {
                  select: {
                    type: true,
                    make: true,
                    model: true,
                    color: true,
                    registrationNumber: true,
                  },
                },
              },
            },
            offers: {
              orderBy: { createdAt: 'desc' },
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
        throw new ForbiddenException('You can only access negotiations for your own ride');
      }
      return ride.negotiations.map(({ driver, ...n }) => {
        const { currentLat, currentLng, ...publicDriver } = driver;
        // ETA is an estimate from the driver's last reported position (straight line at the same
        // 2 min/km city-speed assumption the matcher uses); null when the driver has no position.
        const hasPosition = currentLat != null && currentLng != null;
        const driverDistanceKm = hasPosition
          ? calculateHaversineDistanceKm(ride.pickupLat, ride.pickupLng, currentLat, currentLng)
          : null;
        return {
          ...n,
          driver: publicDriver,
          driverDistanceKm,
          etaMinutes: driverDistanceKm != null ? Math.max(1, Math.round(driverDistanceKm * 2)) : null,
        };
      });
    }

    if (user.role === 'driver') {
      const driverNeg = ride.negotiations.filter((n) => n.driverId === user.sub);
      return driverNeg;
    }

    throw new ForbiddenException('Unauthorized to access negotiations');
  }

  /**
   * Driver sends a counteroffer to the passenger.
   */
  async driverCounter(rideId: string, driverId: string, dto: DriverCounterOfferDto) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver || driver.verificationStatus !== 'approved') {
      throw new ForbiddenException('Only approved drivers can participate in negotiations');
    }

    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.status !== 'requested' && ride.status !== 'offered') {
      throw new ConflictException(`Ride is not available for negotiation (status: ${ride.status})`);
    }

    if (ride.driverId && ride.driverId !== driverId) {
      throw new ConflictException('Ride has already been assigned to another driver');
    }

    this.assertWithinFareBounds(ride, dto.offerAmount);

    const amountDecimal = new Prisma.Decimal(dto.offerAmount.toFixed(2));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Idempotency check
    if (dto.idempotencyKey) {
      const existingOffer = await this.prisma.negotiationOffer.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existingOffer) {
        this.logger.log(`Idempotent driver counter detected: returning existing offer ${existingOffer.id}`);
        return existingOffer;
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Upsert negotiation session between this ride and driver
      const negotiation = await tx.negotiation.upsert({
        where: {
          rideId_driverId: {
            rideId,
            driverId,
          },
        },
        create: {
          rideId,
          driverId,
          passengerId: ride.passengerId,
          status: 'active',
          currentAmount: amountDecimal,
          currentProposerId: driverId,
          expiresAt,
        },
        update: {
          status: 'active',
          currentAmount: amountDecimal,
          currentProposerId: driverId,
          expiresAt,
          updatedAt: new Date(),
        },
      });

      // Mark older pending offers in this session as superseded
      await tx.negotiationOffer.updateMany({
        where: {
          negotiationId: negotiation.id,
          status: 'pending',
        },
        data: { status: 'superseded' },
      });

      // Append new counteroffer
      const offer = await tx.negotiationOffer.create({
        data: {
          negotiationId: negotiation.id,
          rideId,
          proposerId: driverId,
          recipientId: ride.passengerId,
          amount: amountDecimal,
          type: 'counter',
          status: 'pending',
          reason: dto.reason || null,
          idempotencyKey: dto.idempotencyKey || null,
          expiresAt,
        },
      });

      // Update ride status to 'offered' if it was 'requested'
      if (ride.status === 'requested') {
        await tx.ride.update({
          where: { id: rideId },
          data: { status: 'offered' },
        });
      }

      // Retire this driver's older pending legacy rows (incl. the matcher's original ask) so no
      // surface can still show or accept them at a price that has since moved.
      await tx.rideOffer.updateMany({
        where: { rideId, driverId, status: 'pending', id: { not: offer.id } },
        data: { status: 'rejected' },
      });

      // Synchronize with legacy RideOffer for backward compatibility
      await tx.rideOffer.upsert({
        where: {
          id: offer.id,
        },
        create: {
          id: offer.id,
          rideId,
          driverId,
          offerType: 'counter',
          offerAmount: amountDecimal,
          status: 'pending',
          expiresAt,
        },
        update: {
          offerAmount: amountDecimal,
          status: 'pending',
          expiresAt,
        },
      });

      return { negotiation, offer };
    });

    // Realtime notification
    try {
      this.realtimeService.emitNegotiationOfferCreated(
        {
          negotiationId: result.negotiation.id,
          rideId,
          offerId: result.offer.id,
          proposerId: driverId,
          recipientId: ride.passengerId,
          proposerRole: 'driver',
          amount: Number(result.offer.amount),
          currency: 'PKR',
          type: 'counter',
          reason: dto.reason,
          expiresAt: result.offer.expiresAt.toISOString(),
        },
        { passengerId: ride.passengerId, driverId },
      );
    } catch (err) {
      // Log and continue
    }

    // Push notification to passenger
    try {
      this.notificationsService
        .sendToUser(
          ride.passengerId,
          'New Driver Counteroffer',
          `A driver countered with PKR ${dto.offerAmount.toFixed(2)} for your ride.`,
          { type: 'negotiation_counter', rideId, offerId: result.offer.id, amount: dto.offerAmount },
        )
        .catch((err) => this.logger.warn(`Push notification failed: ${err?.message}`));
    } catch (err) {
      // Ignore push errors
    }

    return result.offer;
  }

  /**
   * Passenger counters a driver's counteroffer (multi-turn negotiation).
   */
  async passengerCounter(rideId: string, passengerId: string, dto: PassengerCounterOfferDto) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.passengerId !== passengerId) {
      throw new ForbiddenException('Only the ride owner can counter offers');
    }

    if (ride.status !== 'requested' && ride.status !== 'offered') {
      throw new ConflictException(`Ride is no longer negotiable (status: ${ride.status})`);
    }

    if (ride.driverId) {
      throw new ConflictException('Ride has already been accepted');
    }

    const negotiation = await this.prisma.negotiation.findUnique({
      where: {
        rideId_driverId: {
          rideId,
          driverId: dto.driverId,
        },
      },
    });

    if (!negotiation || negotiation.status !== 'active') {
      throw new BadRequestException('No active negotiation found with this driver');
    }

    this.assertWithinFareBounds(ride, dto.offerAmount);

    const amountDecimal = new Prisma.Decimal(dto.offerAmount.toFixed(2));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Idempotency check
    if (dto.idempotencyKey) {
      const existingOffer = await this.prisma.negotiationOffer.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existingOffer) {
        return existingOffer;
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Supersede older pending offers
      await tx.negotiationOffer.updateMany({
        where: {
          negotiationId: negotiation.id,
          status: 'pending',
        },
        data: { status: 'superseded' },
      });

      // Create passenger counteroffer
      const offer = await tx.negotiationOffer.create({
        data: {
          negotiationId: negotiation.id,
          rideId,
          proposerId: passengerId,
          recipientId: dto.driverId,
          amount: amountDecimal,
          type: 'counter',
          status: 'pending',
          reason: dto.reason || null,
          idempotencyKey: dto.idempotencyKey || null,
          expiresAt,
        },
      });

      // Update negotiation session
      await tx.negotiation.update({
        where: { id: negotiation.id },
        data: {
          currentAmount: amountDecimal,
          currentProposerId: passengerId,
          expiresAt,
          updatedAt: new Date(),
        },
      });

      return offer;
    });

    // Realtime notification
    try {
      this.realtimeService.emitNegotiationOfferCreated(
        {
          negotiationId: negotiation.id,
          rideId,
          offerId: result.id,
          proposerId: passengerId,
          recipientId: dto.driverId,
          proposerRole: 'passenger',
          amount: Number(result.amount),
          currency: 'PKR',
          type: 'counter',
          reason: dto.reason,
          expiresAt: result.expiresAt.toISOString(),
        },
        { passengerId, driverId: dto.driverId },
      );
    } catch (err) {
      // Log and continue
    }

    // Push notification to driver
    try {
      this.notificationsService
        .sendToUser(
          dto.driverId,
          'Passenger Counteroffer',
          `Passenger countered with PKR ${dto.offerAmount.toFixed(2)} for the ride.`,
          { type: 'negotiation_counter', rideId, offerId: result.id, amount: dto.offerAmount },
        )
        .catch((err) => this.logger.warn(`Push notification failed: ${err?.message}`));
    } catch (err) {
      // Ignore push errors
    }

    return result;
  }

  /**
   * Accepts a negotiation offer atomically, setting the authoritative Ride.finalFare.
   */
  async acceptNegotiation(rideId: string, user: JwtPayload, offerId: string) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        // 1. Verify offer existence and validity
        const offer = await tx.negotiationOffer.findUnique({
          where: { id: offerId },
          include: { negotiation: true },
        });

        if (!offer || offer.rideId !== rideId) {
          throw new NotFoundException('Negotiation offer not found for this ride');
        }

        // Verify user is a legitimate participant to this negotiation
        if (offer.recipientId !== user.sub && offer.proposerId !== user.sub) {
          throw new ForbiddenException('Only the designated negotiation parties can interact with this offer');
        }

        if (offer.status !== 'pending') {
          if (offer.status === 'accepted') {
            const currentRide = await tx.ride.findUnique({ where: { id: rideId } });
            return { offer, ride: currentRide!, isAlreadyAccepted: true };
          }
          // 'superseded' means a newer counter replaced this price while the user was looking at it.
          throw new ConflictException({
            message:
              offer.status === 'superseded'
                ? 'The price changed while you were deciding. Review the latest offer.'
                : `Offer is no longer pending (status: ${offer.status})`,
            code: offer.status === 'superseded' ? 'PRICE_CHANGED' : 'OFFER_NOT_PENDING',
          });
        }

        if (offer.expiresAt < new Date()) {
          await tx.negotiationOffer.update({
            where: { id: offerId },
            data: { status: 'expired' },
          });
          throw new BadRequestException({
            message: 'This offer has expired.',
            code: 'OFFER_EXPIRED',
          });
        }

        // Proposer cannot accept their own offer
        if (offer.proposerId === user.sub) {
          throw new BadRequestException('You cannot accept your own offer; awaiting counterparty acceptance');
        }

        // Verify user is the intended recipient
        if (offer.recipientId !== user.sub) {
          throw new ForbiddenException('Only the designated recipient can accept this offer');
        }

        // 2. Lock and verify Ride state
        const ride = await tx.ride.findUnique({ where: { id: rideId } });
        if (!ride) {
          throw new NotFoundException('Ride not found');
        }

        if (ride.status !== 'requested' && ride.status !== 'offered') {
          throw new ConflictException({
            message: `Ride is no longer available (status: ${ride.status})`,
            code: 'RIDE_UNAVAILABLE',
          });
        }

        if (ride.driverId !== null) {
          throw new ConflictException({
            message: 'This ride has already been taken.',
            code: 'RIDE_TAKEN',
          });
        }

        const winningDriverId = offer.negotiation.driverId;

        // Check if winning driver is occupied with another ride
        const occupiedRide = await tx.ride.findFirst({
          where: {
            driverId: winningDriverId,
            status: { in: ['accepted', 'ongoing'] },
          },
        });
        if (occupiedRide) {
          throw new ConflictException({
            message: 'This driver is no longer available.',
            code: 'DRIVER_BUSY',
          });
        }

        const acceptedAt = new Date();
        const finalFareDecimal = offer.amount;

        // 3. Mark winning offer accepted
        const updatedOffer = await tx.negotiationOffer.update({
          where: { id: offerId },
          data: { status: 'accepted' },
        });

        // 4. Mark winning negotiation session accepted
        await tx.negotiation.update({
          where: { id: offer.negotiationId },
          data: {
            status: 'accepted',
            currentAmount: finalFareDecimal,
            acceptedAt,
          },
        });

        // 5. Supersede other pending offers in this negotiation
        await tx.negotiationOffer.updateMany({
          where: {
            negotiationId: offer.negotiationId,
            id: { not: offerId },
            status: 'pending',
          },
          data: { status: 'superseded' },
        });

        // 6. Reject all competing negotiations for this ride
        await tx.negotiation.updateMany({
          where: {
            rideId,
            id: { not: offer.negotiationId },
            status: 'active',
          },
          data: { status: 'rejected' },
        });

        // Reject competing offers across other negotiations for this ride
        await tx.negotiationOffer.updateMany({
          where: {
            rideId,
            negotiationId: { not: offer.negotiationId },
            status: 'pending',
          },
          data: { status: 'rejected' },
        });

        // Also reject legacy RideOffers
        await tx.rideOffer.updateMany({
          where: {
            rideId,
            status: 'pending',
          },
          data: { status: 'rejected' },
        });

        // 7. Authoritatively set Ride finalFare, status=accepted, and assign driver
        const updatedRide = await tx.ride.update({
          where: { id: rideId },
          data: {
            status: 'accepted',
            driverId: winningDriverId,
            finalFare: finalFareDecimal,
          },
        });

        return { offer: updatedOffer, ride: updatedRide, driverId: winningDriverId, isAlreadyAccepted: false };
      },
      { timeout: 45000, maxWait: 25000 },
    );

    if (result.isAlreadyAccepted) {
      return result;
    }

    const driverId = (result as any).driverId || result.ride.driverId;
    const passengerId = result.ride.passengerId;

    // Realtime events
    try {
      this.realtimeService.emitNegotiationAccepted(
        {
          negotiationId: result.offer.negotiationId,
          rideId,
          offerId: result.offer.id,
          driverId,
          passengerId,
          finalFare: Number(result.ride.finalFare),
          currency: 'PKR',
          acceptedAt: new Date().toISOString(),
        },
        { passengerId, driverId },
      );

      this.realtimeService.emitRideAccepted(
        {
          rideId,
          driverId,
          status: 'accepted',
          finalFare: Number(result.ride.finalFare),
        },
        { passengerId, driverId },
      );
    } catch (err) {
      // Log and continue
    }

    // Push notifications
    try {
      this.notificationsService
        .sendToUser(
          passengerId,
          'Fare Agreed & Ride Accepted',
          `Ride confirmed at PKR ${Number(result.ride.finalFare).toFixed(2)}. Driver is on their way!`,
          { type: 'ride_accepted', rideId, driverId },
        )
        .catch((err) => this.logger.warn(`Push failed: ${err?.message}`));

      this.notificationsService
        .sendToUser(
          driverId,
          'Fare Accepted',
          `Passenger confirmed fare PKR ${Number(result.ride.finalFare).toFixed(2)}. Proceed to pickup!`,
          { type: 'ride_accepted', rideId },
        )
        .catch((err) => this.logger.warn(`Push failed: ${err?.message}`));
    } catch (err) {
      // Ignore push errors
    }

    return result;
  }

  /**
   * Rejects an active negotiation session.
   */
  async rejectNegotiation(rideId: string, user: JwtPayload, negotiationId: string) {
    const negotiation = await this.prisma.negotiation.findUnique({
      where: { id: negotiationId },
    });

    if (!negotiation || negotiation.rideId !== rideId) {
      throw new NotFoundException('Negotiation not found for this ride');
    }

    if (negotiation.passengerId !== user.sub && negotiation.driverId !== user.sub) {
      throw new ForbiddenException('You are not a participant in this negotiation');
    }

    if (negotiation.status !== 'active') {
      throw new BadRequestException(`Negotiation is not active (status: ${negotiation.status})`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.negotiation.update({
        where: { id: negotiationId },
        data: { status: 'rejected' },
      });

      await tx.negotiationOffer.updateMany({
        where: {
          negotiationId,
          status: 'pending',
        },
        data: { status: 'rejected' },
      });
    });

    try {
      this.realtimeService.emitNegotiationRejected(
        {
          negotiationId,
          rideId,
          rejectedBy: user.sub,
        },
        { passengerId: negotiation.passengerId, driverId: negotiation.driverId },
      );
    } catch (err) {
      // Log and continue
    }

    return { success: true, status: 'rejected' };
  }

  /**
   * Provides advisory AI Smart Fare suggestion.
   * STRICT SAFETY: This method is advisory only and NEVER mutates the database.
   */
  async getFareSuggestion(rideId: string, user: JwtPayload): Promise<AiFareSuggestionResponse> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        negotiations: {
          where: user.role === 'driver' ? { driverId: user.sub } : undefined,
          include: { offers: true },
        },
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    const isPassenger = ride.passengerId === user.sub;
    const isDriver = user.role === 'driver';

    if (!isPassenger && !isDriver) {
      throw new ForbiddenException('You are not an authorized participant for this ride');
    }

    // Determine current fare from negotiation or proposed fare
    const activeNegotiation = ride.negotiations.find((n) => n.status === 'active');
    const currentFare = activeNegotiation ? Number(activeNegotiation.currentAmount) : Number(ride.proposedFare);

    return this.aiProvider.generateFareSuggestion({
      rideId,
      distanceKm: ride.distanceKm,
      etaMinutes: ride.etaMinutes,
      proposedFare: Number(ride.proposedFare),
      currentFare,
      counterpartyRole: isPassenger ? 'passenger' : 'driver',
      roundsCount: activeNegotiation?.offers.length || 0,
    });
  }
}
