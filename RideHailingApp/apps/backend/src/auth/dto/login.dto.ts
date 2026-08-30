import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  // Phone number or email -- whichever the account was registered with.
  @IsString()
  @MinLength(1)
  identifier!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
