import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { UploadDocumentDto } from './dto/upload-document.dto';
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
}
