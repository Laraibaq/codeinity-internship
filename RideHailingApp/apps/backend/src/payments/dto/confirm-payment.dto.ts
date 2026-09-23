import { IsOptional, IsString } from 'class-validator';

export class ConfirmPaymentDto {
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  providerPaymentId?: string;
}
