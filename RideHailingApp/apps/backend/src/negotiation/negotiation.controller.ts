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
import { NegotiationService } from './negotiation.service';
import { DriverCounterOfferDto, PassengerCounterOfferDto } from './dto/counter-offer.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('rides/:id/negotiation')
@UseGuards(JwtAuthGuard)
export class NegotiationController {
  constructor(private readonly negotiationService: NegotiationService) {}

  @Get()
  getNegotiations(
    @Param('id', new ParseUUIDPipe()) rideId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.negotiationService.getNegotiationsForRide(rideId, user);
  }

  @Post('driver-counter')
  @HttpCode(HttpStatus.OK)
  driverCounter(
    @Param('id', new ParseUUIDPipe()) rideId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: DriverCounterOfferDto,
  ) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can submit driver counteroffers');
    }
    return this.negotiationService.driverCounter(rideId, user.sub, dto);
  }

  @Post('passenger-counter')
  @HttpCode(HttpStatus.OK)
  passengerCounter(
    @Param('id', new ParseUUIDPipe()) rideId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: PassengerCounterOfferDto,
  ) {
    if (user.role !== 'passenger') {
      throw new ForbiddenException('Only passengers can submit passenger counteroffers');
    }
    return this.negotiationService.passengerCounter(rideId, user.sub, dto);
  }

  @Post('accept/:offerId')
  @HttpCode(HttpStatus.OK)
  acceptNegotiation(
    @Param('id', new ParseUUIDPipe()) rideId: string,
    @Param('offerId', new ParseUUIDPipe()) offerId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.negotiationService.acceptNegotiation(rideId, user, offerId);
  }

  @Post('reject/:negotiationId')
  @HttpCode(HttpStatus.OK)
  rejectNegotiation(
    @Param('id', new ParseUUIDPipe()) rideId: string,
    @Param('negotiationId', new ParseUUIDPipe()) negotiationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.negotiationService.rejectNegotiation(rideId, user, negotiationId);
  }

  @Post('suggestion')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  getFareSuggestion(
    @Param('id', new ParseUUIDPipe()) rideId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.negotiationService.getFareSuggestion(rideId, user);
  }
}
