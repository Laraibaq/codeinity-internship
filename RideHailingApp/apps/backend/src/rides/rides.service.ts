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

@Injectable()
export class RidesService {
  constructor(private readonly prisma: PrismaService) {}

  async createRide(passengerId: string, dto: CreateRideDto) {
    const passenger = await this.prisma.user.findUnique({
      where: { id: passengerId },
    });
    if (!passenger) {
      throw new NotFoundException('Passenger account not found');
    }

    const aiRecommendedFare = dto.aiRecommendedFare ?? dto.proposedFare;

    return this.prisma.ride.create({
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
    }

    return offer;
  }

  async getOffers(rideId: string, user: JwtPayload) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (user.role === 'passenger') {
      if (ride.passengerId !== user.sub) {
        throw new ForbiddenException('You cannot access offers for another passenger\'s ride');
      }
      return this.prisma.rideOffer.findMany({
        where: { rideId },
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

    return this.prisma.$transaction(async (tx) => {
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

      const finalFare = offer.offerAmount ?? ride.proposedFare;

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

        return this.prisma.$transaction(async (tx) => {
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
        return this.prisma.ride.update({
          where: { id: rideId },
          data: {
            status: 'ongoing',
            startedAt: new Date(),
          },
        });
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
        return this.prisma.ride.update({
          where: { id: rideId },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
          },
        });
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
        return this.prisma.ride.update({
          where: { id: rideId },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
          },
        });
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
