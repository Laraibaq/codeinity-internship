import { IsString, Matches, MinLength } from 'class-validator';

export class PasswordResetVerifyDto {
  @IsString()
  @MinLength(1)
  identifier!: string;

  @Matches(/^\d{6}$/, { message: 'code must be a 6-digit string' })
  code!: string;
}
