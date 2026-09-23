import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  score: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  comment?: string;
}
