import { IsOptional, IsString } from 'class-validator';

export class RefundPaymentDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
