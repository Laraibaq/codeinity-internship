import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDriverRatings(driverId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: { id: true, rating: true },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const ratings = await this.prisma.rating.findMany({
      where: {
        toUserId: driverId,
        fromRole: 'passenger',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        ride: {
          select: {
            passenger: {
              select: {
                id: true,
                name: true,
                profilePhotoUrl: true,
              },
            },
          },
        },
      },
    });

    const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let scoreSum = 0;

    for (const r of ratings) {
      const score = Math.max(1, Math.min(5, Math.round(r.score)));
      starCounts[score] = (starCounts[score] || 0) + 1;
      scoreSum += r.score;
    }

    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0
        ? Number((scoreSum / totalRatings).toFixed(1))
        : driver.rating !== null
        ? Number(driver.rating.toFixed(1))
        : 5.0;

    const starBreakdown = [
      { stars: 5, count: starCounts[5] },
      { stars: 4, count: starCounts[4] },
      { stars: 3, count: starCounts[3] },
      { stars: 2, count: starCounts[2] },
      { stars: 1, count: starCounts[1] },
    ];

    const reviews = ratings.map((r) => ({
      id: r.id,
      rideId: r.rideId,
      name: r.ride?.passenger?.name || 'Passenger',
      stars: r.score,
      comment: r.comment,
      createdAt: r.createdAt,
    }));

    return {
      averageRating,
      totalRatings,
      starBreakdown,
      reviews,
    };
  }

  async createRideRating(rideId: string, user: JwtPayload, dto: CreateRatingDto) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        ratings: true,
      },
    });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    if (ride.status !== 'completed') {
      throw new BadRequestException('Cannot rate a ride that is not completed');
    }

    const alreadyRated = ride.ratings.some((r) => r.fromUserId === user.sub);
    if (alreadyRated) {
      throw new ConflictException('You have already rated this ride');
    }

    if (user.role === 'driver') {
      if (ride.driverId !== user.sub) {
        throw new ForbiddenException('You are not the driver of this ride');
      }

      return this.prisma.rating.create({
        data: {
          rideId,
          fromUserId: user.sub,
          toUserId: ride.passengerId,
          fromRole: 'driver',
          score: dto.score,
          comment: dto.comment,
        },
      });
    }

    if (user.role === 'passenger') {
      if (ride.passengerId !== user.sub) {
        throw new ForbiddenException('You are not the passenger of this ride');
      }

      if (!ride.driverId) {
        throw new BadRequestException('Ride has no assigned driver');
      }

      const driverId = ride.driverId;

      return this.prisma.$transaction(async (tx) => {
        const rating = await tx.rating.create({
          data: {
            rideId,
            fromUserId: user.sub,
            toUserId: driverId,
            fromRole: 'passenger',
            score: dto.score,
            comment: dto.comment,
          },
        });

        const allDriverRatings = await tx.rating.findMany({
          where: {
            toUserId: driverId,
            fromRole: 'passenger',
          },
          select: { score: true },
        });

        const total = allDriverRatings.length;
        const avg = total > 0 ? allDriverRatings.reduce((s, r) => s + r.score, 0) / total : 5.0;

        await tx.driver.update({
          where: { id: driverId },
          data: { rating: Number(avg.toFixed(2)) },
        });

        return rating;
      });
    }

    throw new ForbiddenException('Unauthorized role');
  }
}
