import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { DriversService } from './drivers.service';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // matches the bucket's own 10MB limit

@Controller('drivers/me')
@UseGuards(JwtAuthGuard)
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  @Post('documents')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  async uploadDocument(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can upload driver documents');
    }
    if (!file) {
      throw new BadRequestException('file is required');
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}" -- expected JPEG, PNG, WebP, or PDF`,
      );
    }

    return this.drivers.uploadDocument(user.sub, dto.documentType, file);
  }

  @Put('location')
  async updateLocation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateLocationDto,
  ) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can update driver location');
    }
    return this.drivers.updateLocation(user.sub, dto);
  }

  @Patch('status')
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateDriverStatusDto,
  ) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can update driver status');
    }
    return this.drivers.updateStatus(user.sub, dto);
  }

  @Get()
  async getProfile(@CurrentUser() user: JwtPayload) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can access this endpoint');
    }
    return this.drivers.getProfile(user.sub);
  }

  @Patch()
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateDriverProfileDto,
  ) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can update driver profile');
    }
    return this.drivers.updateProfile(user.sub, dto);
  }

  @Get('vehicle')
  async getVehicle(@CurrentUser() user: JwtPayload) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can access vehicle details');
    }
    return this.drivers.getVehicle(user.sub);
  }

  @Patch('vehicle')
  async updateVehicle(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateVehicleDto,
  ) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can update vehicle details');
    }
    return this.drivers.upsertVehicle(user.sub, dto);
  }

  @Get('documents')
  async getDocuments(@CurrentUser() user: JwtPayload) {
    if (user.role !== 'driver') {
      throw new ForbiddenException('Only drivers can view driver documents');
    }
    return this.drivers.getDocuments(user.sub);
  }
}
