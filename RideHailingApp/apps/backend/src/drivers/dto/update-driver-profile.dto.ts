import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpdateDriverProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Profile photo URL must be a valid URL' })
  profilePhotoUrl?: string;
}
