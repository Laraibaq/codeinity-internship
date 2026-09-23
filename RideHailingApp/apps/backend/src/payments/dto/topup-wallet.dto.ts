import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class TopupWalletDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
