import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { CreateRideDto } from './dto/create-ride.dto';
import { CreateOfferDto, OfferTypeEnum } from './dto/create-offer.dto';
import { UpdateRideStatusDto, UpdateRideStatusEnum } from './dto/update-ride-status.dto';

import { MatchingService, calculateHaversineDistanceKm } from './matching.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class RidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: MatchingService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async createRide(passengerId: string, dto: CreateRideDto) {
    const passenger = await this.prisma.user.findUnique({
      where: { id: passengerId },
    });
    if (!passenger) {
      throw new NotFoundException('Passenger account not found');
    }

    const aiRecommendedFare = dto.aiRecommendedFare ?? dto.proposedFare;

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
        aiRecommendedFare,
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
    });

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
    });

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
        });

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

        return result;
      }

      // Driver starts ride
      if (targetStatus === UpdateRideStatusEnum.ongoing) {
        if (ride.driverId !== user.sub) {
          throw new ForbiddenException('Only the assigned driver can start this ride');
        }
        if (ride.status !== 'accepted') {
          throw new BadRequestException(
            `Cannot start ride with current status "${ride.status}"`,
          );
        }
        const updated = await this.prisma.ride.update({
          where: { id: rideId },
          data: {
            status: 'ongoing',
            startedAt: new Date(),
          },
        });
        try {
          this.realtimeService.emitRideStatusChanged(
            { rideId, status: 'ongoing' },
            { passengerId: ride.passengerId, driverId: user.sub },
          );
        } catch (err) {
          // Log and continue
        }
        return updated;
      }

      // Driver completes ride
      if (targetStatus === UpdateRideStatusEnum.completed) {
        if (ride.driverId !== user.sub) {
          throw new ForbiddenException('Only the assigned driver can complete this ride');
        }
        if (ride.status !== 'ongoing') {
          throw new BadRequestException(
            `Cannot complete ride with current status "${ride.status}"`,
          );
        }
        const updated = await this.prisma.ride.update({
          where: { id: rideId },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        });

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
            { rideId, status: 'completed' },
            { passengerId: ride.passengerId, driverId: user.sub },
          );
        } catch (err) {
          // Log and continue
        }

        return updated;
      }

      // Driver cancels accepted ride
      if (targetStatus === UpdateRideStatusEnum.cancelled) {
        if (ride.driverId !== user.sub) {
          throw new ForbiddenException('Only the assigned driver can cancel this ride');
        }
        if (ride.status !== 'accepted') {
          throw new BadRequestException(
            `Driver cannot cancel ride with status "${ride.status}"`,
          );
        }
        const updated = await this.prisma.ride.update({
          where: { id: rideId },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
          },
        });
        try {
          this.realtimeService.emitRideStatusChanged(
            { rideId, status: 'cancelled' },
            { passengerId: ride.passengerId, driverId: user.sub },
          );
        } catch (err) {
          // Log and continue
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
          throw new BadRequestException(
            `Passenger cannot cancel ride with status "${ride.status}"`,
          );
        }
        const updated = await this.prisma.ride.update({
          where: { id: rideId },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
          },
        });
        try {
          this.realtimeService.emitRideStatusChanged(
            { rideId, status: 'cancelled' },
            { passengerId: ride.passengerId, driverId: ride.driverId ?? undefined },
          );
        } catch (err) {
          // Log and continue
        }
        return updated;
      }
    }

    throw new BadRequestException(
      `Transition to "${targetStatus}" is not permitted for role "${user.role}"`,
    );
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
