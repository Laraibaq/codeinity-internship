import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum PaymentMethodDtoEnum {
  cash = 'cash',
  wallet = 'wallet',
  card = 'card',
}

export class InitiatePaymentDto {
  @IsUUID()
  rideId: string;

  @IsEnum(PaymentMethodDtoEnum)
  paymentMethod: PaymentMethodDtoEnum;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  /**
   * Optional client-provided amount for validation/protection tests.
   * NOTE: Authoritative payment amount is ALWAYS derived from Ride.finalFare in PostgreSQL.
   */
  @IsOptional()
  amount?: any;
}
