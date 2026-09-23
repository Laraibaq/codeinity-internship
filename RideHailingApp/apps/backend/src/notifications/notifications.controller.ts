import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import {
  RegisterDeviceTokenDto,
  RemoveDeviceTokenDto,
} from './dto/device-token.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  registerDeviceToken(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return this.notificationsService.registerDeviceToken(
      user.sub,
      user.role,
      dto.token,
      dto.platform,
    );
  }

  @Delete('device-token')
  @HttpCode(HttpStatus.OK)
  removeDeviceToken(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RemoveDeviceTokenDto,
  ) {
    return this.notificationsService.removeDeviceToken(user.sub, dto.token);
  }

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
