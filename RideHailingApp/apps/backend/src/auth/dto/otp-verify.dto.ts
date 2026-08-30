import { Matches } from 'class-validator';

export class OtpVerifyDto {
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'phone must be a valid phone number',
  })
  phone!: string;

  @Matches(/^\d{6}$/, { message: 'code must be a 6-digit string' })
  code!: string;
}
