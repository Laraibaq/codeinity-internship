import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { CreateOfferDto } from './dto/create-offer.dto';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideStatusDto } from './dto/update-ride-status.dto';
import { RidesService } from './rides.service';

@Controller('rides')
@UseGuards(JwtAuthGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createRide(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRideDto,
  ) {
    if (user.role !== 'passenger') {
      throw new ForbiddenException('Only passengers can create rides');
    }
    return this.ridesService.createRide(user.sub, dto);
  }

  @Get('available')
  getAvailableRides(@CurrentUser() user: JwtPayload) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can access available rides');
    }
    return this.ridesService.getAvailableRides(user.sub);
  }

  @Get('history')
  getDriverRideHistory(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can access ride history');
    }
    return this.ridesService.getDriverRideHistory(user.sub, status);
  }

  @Get('earnings')
  getDriverEarnings(
    @CurrentUser() user: JwtPayload,
    @Query('timezoneOffset') timezoneOffset?: string,
  ) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can access earnings');
    }
    const offset = timezoneOffset ? parseInt(timezoneOffset, 10) : 0;
    return this.ridesService.getDriverEarnings(
      user.sub,
      Number.isNaN(offset) ? 0 : offset,
    );
  }

  @Get(':id')
  getRideById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ridesService.getRideById(id, user);
  }

  @Post(':id/offers')
  @HttpCode(HttpStatus.CREATED)
  createOffer(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateOfferDto,
  ) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can create offers');
    }
    return this.ridesService.createOffer(user.sub, id, dto);
  }

  @Get(':id/offers')
  getOffers(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ridesService.getOffers(id, user);
  }

  @Post(':id/offers/:offerId/accept')
  @HttpCode(HttpStatus.OK)
  acceptOffer(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('offerId', new ParseUUIDPipe()) offerId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'passenger') {
      throw new ForbiddenException('Only passengers can accept offers');
    }
    return this.ridesService.acceptOffer(id, offerId, user.sub);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateRideStatusDto,
  ) {
    return this.ridesService.updateRideStatus(id, user, dto);
  }
}
