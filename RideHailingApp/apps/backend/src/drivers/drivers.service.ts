import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { DocumentType } from './dto/upload-document.dto';

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
  ) {}

  async uploadDocument(
    driverId: string,
    documentType: DocumentType,
    file: Express.Multer.File,
  ): Promise<{ documentType: DocumentType; url: string }> {
    const path = `drivers/${driverId}/${documentType}${extensionFor(file.mimetype)}`;
    const url = await this.storage.uploadDriverDocument(
      path,
      file.buffer,
      file.mimetype,
    );

    // Explicit per-case update calls (rather than a field-name lookup table) so every write is a
    // real, statically-typed Prisma call -- no dynamic keys, no casts.
    switch (documentType) {
      case DocumentType.profile_photo:
        await this.prisma.driver.update({
          where: { id: driverId },
          data: { profilePhotoUrl: url },
        });
        break;
      case DocumentType.identity_document:
        await this.prisma.driver.update({
          where: { id: driverId },
          data: { cnicDocUrl: url },
        });
        break;
      case DocumentType.license_front:
        await this.prisma.driver.update({
          where: { id: driverId },
          data: { licenseDocFrontUrl: url },
        });
        break;
      case DocumentType.license_back:
        await this.prisma.driver.update({
          where: { id: driverId },
          data: { licenseDocBackUrl: url },
        });
        break;
      case DocumentType.vehicle_registration:
        await this.prisma.vehicle.upsert({
          where: { driverId },
          create: { driverId, registrationDocUrl: url },
          update: { registrationDocUrl: url },
        });
        break;
      case DocumentType.vehicle_insurance:
        await this.prisma.vehicle.upsert({
          where: { driverId },
          create: { driverId, insuranceDocUrl: url },
          update: { insuranceDocUrl: url },
        });
        break;
      case DocumentType.vehicle_photo_front:
        await this.prisma.vehicle.upsert({
          where: { driverId },
          create: { driverId, photoFrontUrl: url },
          update: { photoFrontUrl: url },
        });
        break;
      case DocumentType.vehicle_photo_side:
        await this.prisma.vehicle.upsert({
          where: { driverId },
          create: { driverId, photoSideUrl: url },
          update: { photoSideUrl: url },
        });
        break;
      case DocumentType.vehicle_photo_back:
        await this.prisma.vehicle.upsert({
          where: { driverId },
          create: { driverId, photoBackUrl: url },
          update: { photoBackUrl: url },
        });
        break;
      case DocumentType.vehicle_photo_interior:
        await this.prisma.vehicle.upsert({
          where: { driverId },
          create: { driverId, photoInteriorUrl: url },
          update: { photoInteriorUrl: url },
        });
        break;
    }

    return { documentType, url };
  }
}

function extensionFor(mimetype: string): string {
  switch (mimetype) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'application/pdf':
      return '.pdf';
    default:
      return '';
  }
}
