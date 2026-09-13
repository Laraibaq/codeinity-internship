import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';

export enum OfferTypeEnum {
  accept = 'accept',
  reject = 'reject',
  counter = 'counter',
}

export class CreateOfferDto {
  @IsEnum(OfferTypeEnum)
  offerType: OfferTypeEnum;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  offerAmount?: number;
}
