import { IsString, MinLength } from 'class-validator';

export class PasswordResetRequestDto {
  // Phone or email, whichever the account was registered with -- same "identifier" convention as
  // LoginDto.
  @IsString()
  @MinLength(1)
  identifier!: string;
}
