import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';

export enum FareTierEnum {
  standard = 'standard',
  premium = 'premium',
  xl = 'xl',
  bike = 'bike',
}

export enum VehicleBodyTypeEnum {
  car = 'car',
  bike = 'bike',
  rickshaw = 'rickshaw',
}

export class FareQuoteRequestDto {
  @Type(() => Number)
  @IsNumber()
  pickupLat: number;

  @Type(() => Number)
  @IsNumber()
  pickupLng: number;

  @Type(() => Number)
  @IsNumber()
  dropoffLat: number;

  @Type(() => Number)
  @IsNumber()
  dropoffLng: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  distanceKm: number;

  @IsEnum(FareTierEnum)
  fareTier: FareTierEnum;

  // Optional: defaults to the tier's primary body type. If given it must be eligible for the tier.
  @IsOptional()
  @IsEnum(VehicleBodyTypeEnum)
  vehicleType?: VehicleBodyTypeEnum;
}

export interface FareQuoteResponse {
  currency: 'PKR';
  recommendedFare: number;
  minimumFare: number;
  maximumFare: number;
  fareStep: number;
  fareTier: FareTierEnum;
  vehicleType: VehicleBodyTypeEnum;
  // Honest provenance. The quote is ALWAYS computed by the deterministic distance formula in
  // fare-config.ts; no external AI model is consulted, so aiGenerated is false.
  source: 'deterministic_formula';
  aiGenerated: false;
  // The distance the quote was actually priced on (client value, floored at straight-line).
  pricedDistanceKm: number;
}
