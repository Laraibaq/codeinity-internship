import { IsEnum } from 'class-validator';

export enum UpdateRideStatusEnum {
  accepted = 'accepted',
  ongoing = 'ongoing',
  completed = 'completed',
  cancelled = 'cancelled',
}

export class UpdateRideStatusDto {
  @IsEnum(UpdateRideStatusEnum)
  status: UpdateRideStatusEnum;
}
