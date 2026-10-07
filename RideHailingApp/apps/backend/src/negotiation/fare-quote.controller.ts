import { Body, Controller, ForbiddenException, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { FareQuoteRequestDto } from './dto/fare-quote.dto';
import { FareQuoteService } from './fare-quote.service';

@Controller('fare')
@UseGuards(JwtAuthGuard)
export class FareQuoteController {
  constructor(private readonly fareQuoteService: FareQuoteService) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  quote(@CurrentUser() user: JwtPayload, @Body() dto: FareQuoteRequestDto) {
    if (user.role !== 'passenger') {
      throw new ForbiddenException('Only passengers can request fare quotes');
    }
    return this.fareQuoteService.quote(dto);
  }
}
