import { Type } from 'class-transformer';
import { FareTierEnum, VehicleBodyTypeEnum } from '../../negotiation/dto/fare-quote.dto';

export enum PaymentMethodEnum {
  cash = 'cash',
  wallet = 'wallet',
  card = 'card',
}

import {
  IsEnum,
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

  // Pricing tier the passenger picked; the server prices and validates proposedFare against it.
  @IsEnum(FareTierEnum)
  fareTier: FareTierEnum;

  // Driver body type to match against. Optional: defaults to the tier's primary body type.
  @IsOptional()
  @IsEnum(VehicleBodyTypeEnum)
  vehicleType?: VehicleBodyTypeEnum;

  @IsOptional()
  @IsEnum(PaymentMethodEnum)
  paymentMethod?: PaymentMethodEnum;
}
