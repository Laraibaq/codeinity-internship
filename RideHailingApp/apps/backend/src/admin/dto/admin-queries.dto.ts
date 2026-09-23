import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class DateRangeQueryDto {
  @IsOptional()
  @IsEnum(['today', '7d', '30d', 'custom'])
  range?: 'today' | '7d' | '30d' | 'custom' = '7d';

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class DriverFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected', 'suspended'])
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isOnline?: boolean;
}

export class RideFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(['requested', 'offered', 'accepted', 'ongoing', 'completed', 'cancelled'])
  status?: 'requested' | 'offered' | 'accepted' | 'ongoing' | 'completed' | 'cancelled';

  @IsOptional()
  @IsString()
  passengerId?: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class PaymentFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(['pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded'])
  status?: string;

  @IsOptional()
  @IsEnum(['cash', 'wallet', 'card'])
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class UpdateTicketDto {
  @IsEnum(['open', 'resolved'])
  status: 'open' | 'resolved';
}

export class DriverActionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
