import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { SupportService } from './support.service';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('faqs')
  getFaqs() {
    return this.supportService.getFaqs();
  }

  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  createTicket(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSupportTicketDto,
  ) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can submit support tickets');
    }
    return this.supportService.createTicket(user.sub, dto);
  }

  @Get('tickets')
  getTickets(@CurrentUser() user: JwtPayload) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can access support tickets');
    }
    return this.supportService.getTickets(user.sub);
  }
}
