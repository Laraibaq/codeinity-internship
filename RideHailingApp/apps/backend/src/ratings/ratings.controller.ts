import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingsService } from './ratings.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Get('drivers/me/ratings')
  getDriverRatings(@CurrentUser() user: JwtPayload) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can access driver ratings');
    }
    return this.ratingsService.getDriverRatings(user.sub);
  }

  @Get('passengers/me/ratings')
  getPassengerRatings(@CurrentUser() user: JwtPayload) {
    if (user.role !== 'passenger') {
      throw new ForbiddenException('Only passengers can access passenger ratings');
    }
    return this.ratingsService.getPassengerRatings(user.sub);
  }

  @Post('rides/:id/rate')
  @HttpCode(HttpStatus.CREATED)
  rateRide(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingsService.createRideRating(id, user, dto);
  }
}
