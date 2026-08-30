import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDriverDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'phone must be a valid phone number',
  })
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
