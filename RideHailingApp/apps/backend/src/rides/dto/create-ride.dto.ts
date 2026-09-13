import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateRideDto {
  @Type(() => Number)
  @IsNumber()
  pickupLat: number;

  @Type(() => Number)
  @IsNumber()
  pickupLng: number;

  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @Type(() => Number)
  @IsNumber()
  dropoffLat: number;

  @Type(() => Number)
  @IsNumber()
  dropoffLng: number;

  @IsString()
  @IsNotEmpty()
  dropoffAddress: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  distanceKm: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  etaMinutes: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  proposedFare: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  aiRecommendedFare?: number;
}
