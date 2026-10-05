import { Controller, ForbiddenException, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { MatchingService } from '../rides/matching.service';

const VEHICLE_TYPES = ['car', 'bike', 'rickshaw'] as const;
const MAX_NEARBY_DRIVERS = 20;
const DEFAULT_RADIUS_KM = 5;

export class NearbyDriversQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(10)
  radiusKm?: number;

  @IsOptional()
  @IsIn(VEHICLE_TYPES)
  vehicleType?: (typeof VEHICLE_TYPES)[number];
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

@Controller('drivers')
@UseGuards(JwtAuthGuard)
export class NearbyDriversController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('nearby')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getNearby(@CurrentUser() user: JwtPayload, @Query() query: NearbyDriversQueryDto) {
    if (user.role !== 'passenger') {
      throw new ForbiddenException('Only passengers can view nearby drivers');
    }
    const found = await this.matchingService.findEligibleNearbyDrivers(
      query.lat,
      query.lng,
      query.radiusKm ?? DEFAULT_RADIUS_KM,
      MAX_NEARBY_DRIVERS,
      [],
      query.vehicleType,
    );
    const drivers = found.map((d) => ({
      vehicleType: d.vehicle?.type ?? null,
      rating: d.rating,
      lat: round3(d.currentLat),
      lng: round3(d.currentLng),
    }));
    return { drivers, count: drivers.length };
  }
}
