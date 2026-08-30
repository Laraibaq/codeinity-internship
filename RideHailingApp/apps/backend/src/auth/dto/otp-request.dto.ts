import { Matches } from 'class-validator';

export class OtpRequestDto {
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'phone must be a valid phone number',
  })
  phone!: string;
}
