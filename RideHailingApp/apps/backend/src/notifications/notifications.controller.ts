import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@CurrentUser() user: JwtPayload) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can access notifications');
    }
    return this.notificationsService.getDriverNotifications(user.sub);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() user: JwtPayload) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can modify notifications');
    }
    return this.notificationsService.markAllAsRead(user.sub);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can modify notifications');
    }
    return this.notificationsService.markAsRead(id, user.sub);
  }
}
