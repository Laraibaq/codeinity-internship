import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum VehicleTypeEnum {
  car = 'car',
  bike = 'bike',
  rickshaw = 'rickshaw',
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsEnum(VehicleTypeEnum, { message: 'Vehicle type must be car, bike, or rickshaw' })
  type?: VehicleTypeEnum;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Make cannot be empty' })
  make?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Model cannot be empty' })
  model?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Color cannot be empty' })
  color?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Registration number cannot be empty' })
  registrationNumber?: string;
}
