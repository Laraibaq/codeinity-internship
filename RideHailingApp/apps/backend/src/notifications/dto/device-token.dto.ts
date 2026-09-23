import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  @IsIn(['android', 'ios', 'web'])
  platform?: string;
}

export class RemoveDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
