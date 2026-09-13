import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export enum SupportCategoryEnum {
  ride = 'ride',
  account = 'account',
  vehicle_document = 'vehicle_document',
  technical = 'technical',
  safety = 'safety',
  other = 'other',
}

export class CreateSupportTicketDto {
  @IsEnum(SupportCategoryEnum)
  @IsNotEmpty()
  category: SupportCategoryEnum;

  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  subject: string;

  @IsString()
  @MinLength(5)
  @IsNotEmpty()
  description: string;

  @IsUUID()
  @IsOptional()
  rideId?: string;
}
