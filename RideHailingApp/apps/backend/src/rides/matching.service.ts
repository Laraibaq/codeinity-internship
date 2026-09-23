import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';

export const INITIAL_MATCH_RADIUS_KM = 10;
export const MAX_MATCH_DRIVERS = 5;
export const OFFER_EXPIRY_SECONDS = 120; // 2 minutes

export interface MatchedDriver {
  id: string;
  name: string;
  phone: string;
  rating: number | null;
  currentLat: number;
  currentLng: number;
  distanceKm: number;
  estimatedArrivalMinutes: number;
  vehicle?: {
    make: string | null;
    model: string | null;
    color: string | null;
    registrationNumber: string | null;
    type: string | null;
  } | null;
}

/**
 * Calculates great-circle distance between two points using the Haversine formula.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Discovers eligible, online, approved drivers within radiusKm of the pickup point
   * who are not currently assigned to another active (accepted or ongoing) ride.
   */
  async findEligibleNearbyDrivers(
    pickupLat: number,
    pickupLng: number,
    radiusKm: number = INITIAL_MATCH_RADIUS_KM,
    limit: number = MAX_MATCH_DRIVERS,
    excludeDriverIds: string[] = [],
  ): Promise<MatchedDriver[]> {
    // 1. Query drivers matching eligibility constraints
    const drivers = await this.prisma.driver.findMany({
      where: {
        verificationStatus: 'approved',
        isOnline: true,
        currentLat: { not: null },
        currentLng: { not: null },
        id: excludeDriverIds.length > 0 ? { notIn: excludeDriverIds } : undefined,
        // Exclude drivers occupied with an active ride
        rides: {
          none: {
            status: { in: ['accepted', 'ongoing'] },
          },
        },
      },
      include: {
        vehicle: true,
      },
    });

    // 2. Compute geographic distance & filter within radius
    const candidates: MatchedDriver[] = [];

    for (const driver of drivers) {
      if (driver.currentLat == null || driver.currentLng == null) continue;

      const distKm = calculateHaversineDistanceKm(
        pickupLat,
        pickupLng,
        driver.currentLat,
        driver.currentLng,
      );

      if (distKm <= radiusKm) {
        // Estimate arrival time assuming average city speed of 30 km/h (2 min per km, min 1 min)
        const etaMin = Math.max(1, Math.round(distKm * 2));

        candidates.push({
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          rating: driver.rating,
          currentLat: driver.currentLat,
          currentLng: driver.currentLng,
          distanceKm: distKm,
          estimatedArrivalMinutes: etaMin,
          vehicle: driver.vehicle
            ? {
                make: driver.vehicle.make,
                model: driver.vehicle.model,
                color: driver.vehicle.color,
                registrationNumber: driver.vehicle.registrationNumber,
                type: driver.vehicle.type,
              }
            : null,
        });
      }
    }

    // 3. Sort by proximity ascending
    candidates.sort((a, b) => a.distanceKm - b.distanceKm);

    // 4. Return top limit
    return candidates.slice(0, limit);
  }

  /**
   * Initiates matching for a given ride:
   * Finds nearby eligible drivers and creates RideOffer records.
   * Safe & idempotent: avoids duplicate offers to already offered drivers.
   */
  async matchRide(rideId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      this.logger.warn(`Cannot match ride ${rideId}: ride not found`);
      return { matchedCount: 0, offers: [] };
    }

    if (ride.status !== 'requested' && ride.status !== 'offered') {
      this.logger.log(`Ride ${rideId} is not in requested/offered status (${ride.status}); skipping matching`);
      return { matchedCount: 0, offers: [] };
    }

    // Identify drivers who already have an offer for this ride
    const existingOffers = await this.prisma.rideOffer.findMany({
      where: { rideId },
      select: { driverId: true },
    });
    const alreadyOfferedDriverIds = existingOffers.map((o) => o.driverId);

    // Find nearby eligible drivers excluding already offered drivers
    const matchedDrivers = await this.findEligibleNearbyDrivers(
      ride.pickupLat,
      ride.pickupLng,
      INITIAL_MATCH_RADIUS_KM,
      MAX_MATCH_DRIVERS,
      alreadyOfferedDriverIds,
    );

    if (matchedDrivers.length === 0) {
      this.logger.log(`No new eligible nearby drivers found for ride ${rideId}`);
      return { matchedCount: 0, offers: [] };
    }

    const expiresAt = new Date(Date.now() + OFFER_EXPIRY_SECONDS * 1000);

    // Create RideOffer records in a transaction
    const createdOffers = await this.prisma.$transaction(async (tx) => {
      const offers: any[] = [];
      for (const driver of matchedDrivers) {

        const offer = await tx.rideOffer.create({
          data: {
            rideId,
            driverId: driver.id,
            offerType: 'accept',
            offerAmount: ride.proposedFare,
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
        offers.push(offer);
      }

      if (ride.status === 'requested') {
        await tx.ride.update({
          where: { id: rideId },
          data: { status: 'offered' },
        });
      }

      return offers;
    }, { timeout: 15000, maxWait: 10000 });

    this.logger.log(`Created ${createdOffers.length} ride offers for ride ${rideId}`);

    // Emit realtime events
    try {
      for (const offer of createdOffers) {
        const matchedDriver = matchedDrivers.find((d) => d.id === offer.driverId);
        this.realtimeService.emitOfferCreated(
          {
            rideId,
            offerId: offer.id,
            driverId: offer.driverId,
            status: offer.status,
            pickupAddress: ride.pickupAddress,
            dropoffAddress: ride.dropoffAddress,
            proposedFare: Number(offer.offerAmount),
            distanceKm: matchedDriver?.distanceKm,
            etaMinutes: matchedDriver?.estimatedArrivalMinutes,
            expiresAt: offer.expiresAt,
            driverName: offer.driver?.name,
            driverRating: offer.driver?.rating != null ? Number(offer.driver.rating) : undefined,
            vehicleModel: offer.driver?.vehicle?.model || undefined,
            vehiclePlate: offer.driver?.vehicle?.registrationNumber || undefined,
          },
          {
            driverId: offer.driverId,
            passengerId: ride.passengerId,
          },
        );
      }

      if (ride.status === 'requested' && createdOffers.length > 0) {
        this.realtimeService.emitRideStatusChanged(
          {
            rideId,
            status: 'offered',
          },
          {
            passengerId: ride.passengerId,
          },
        );
      }
    } catch (realtimeErr) {
      this.logger.warn(`Failed to emit realtime events for ride ${rideId}:`, realtimeErr);
    }

    // Phase 10: Asynchronous, failure-isolated push notifications for matched drivers
    try {
      for (const offer of createdOffers) {
        this.notificationsService
          .sendToUser(
            offer.driverId,
            'New Ride Request Nearby',
            `New ride request from ${ride.pickupAddress || 'pickup location'} to ${ride.dropoffAddress || 'destination'}`,
            {
              type: 'ride_offer',
              rideId,
              offerId: offer.id,
            },
          )
          .catch((pushErr) => {
            this.logger.warn(`Failed to send push notification for offer ${offer.id}: ${pushErr?.message}`);
          });
      }
    } catch (err) {
      this.logger.warn(`Error triggering push notifications for ride ${rideId}:`, err);
    }

    return {
      matchedCount: createdOffers.length,
      offers: createdOffers,
    };
  }
}
