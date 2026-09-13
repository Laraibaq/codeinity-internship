import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { DocumentType } from './dto/upload-document.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

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

  async updateLocation(
    driverId: string,
    dto: UpdateLocationDto,
  ): Promise<{ id: string; currentLat: number | null; currentLng: number | null; isOnline: boolean }> {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return this.prisma.driver.update({
      where: { id: driverId },
      data: {
        currentLat: dto.latitude,
        currentLng: dto.longitude,
      },
      select: {
        id: true,
        currentLat: true,
        currentLng: true,
        isOnline: true,
      },
    });
  }

  async updateStatus(
    driverId: string,
    dto: UpdateDriverStatusDto,
  ): Promise<{ id: string; isOnline: boolean; currentLat: number | null; currentLng: number | null }> {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    if (dto.isOnline && driver.verificationStatus !== 'approved') {
      throw new ForbiddenException('Driver must be verified and approved to go online');
    }

    return this.prisma.driver.update({
      where: { id: driverId },
      data: {
        isOnline: dto.isOnline,
      },
      select: {
        id: true,
        isOnline: true,
        currentLat: true,
        currentLng: true,
      },
    });
  }

  async getProfile(driverId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        profilePhotoUrl: true,
        verificationStatus: true,
        isOnline: true,
        rating: true,
        currentLat: true,
        currentLng: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }
    return driver;
  }

  async updateProfile(driverId: string, dto: UpdateDriverProfileDto) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const dataToUpdate: { name?: string; profilePhotoUrl?: string } = {};
    if (dto.name !== undefined) dataToUpdate.name = dto.name;
    if (dto.profilePhotoUrl !== undefined) dataToUpdate.profilePhotoUrl = dto.profilePhotoUrl;

    return this.prisma.driver.update({
      where: { id: driverId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        profilePhotoUrl: true,
        verificationStatus: true,
        isOnline: true,
        rating: true,
        currentLat: true,
        currentLng: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getVehicle(driverId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return this.prisma.vehicle.findUnique({
      where: { driverId },
      select: {
        id: true,
        driverId: true,
        type: true,
        make: true,
        model: true,
        color: true,
        registrationNumber: true,
        registrationDocUrl: true,
        insuranceDocUrl: true,
        photoFrontUrl: true,
        photoSideUrl: true,
        photoBackUrl: true,
        photoInteriorUrl: true,
      },
    });
  }

  async upsertVehicle(driverId: string, dto: UpdateVehicleDto) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return this.prisma.vehicle.upsert({
      where: { driverId },
      create: {
        driverId,
        type: dto.type,
        make: dto.make,
        model: dto.model,
        color: dto.color,
        registrationNumber: dto.registrationNumber,
      },
      update: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.make !== undefined && { make: dto.make }),
        ...(dto.model !== undefined && { model: dto.model }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.registrationNumber !== undefined && { registrationNumber: dto.registrationNumber }),
      },
      select: {
        id: true,
        driverId: true,
        type: true,
        make: true,
        model: true,
        color: true,
        registrationNumber: true,
        registrationDocUrl: true,
        insuranceDocUrl: true,
        photoFrontUrl: true,
        photoSideUrl: true,
        photoBackUrl: true,
        photoInteriorUrl: true,
      },
    });
  }

  async getDocuments(driverId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { vehicle: true },
    });
    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const vehicle = driver.vehicle;

    return {
      verificationStatus: driver.verificationStatus,
      documents: {
        profile_photo: {
          url: driver.profilePhotoUrl,
          status: driver.profilePhotoUrl ? 'uploaded' : 'missing',
        },
        identity_document: {
          url: driver.cnicDocUrl,
          status: driver.cnicDocUrl ? 'uploaded' : 'missing',
        },
        license_front: {
          url: driver.licenseDocFrontUrl,
          status: driver.licenseDocFrontUrl ? 'uploaded' : 'missing',
        },
        license_back: {
          url: driver.licenseDocBackUrl,
          status: driver.licenseDocBackUrl ? 'uploaded' : 'missing',
        },
        vehicle_registration: {
          url: vehicle?.registrationDocUrl ?? null,
          status: vehicle?.registrationDocUrl ? 'uploaded' : 'missing',
        },
        vehicle_insurance: {
          url: vehicle?.insuranceDocUrl ?? null,
          status: vehicle?.insuranceDocUrl ? 'uploaded' : 'missing',
        },
        vehicle_photo_front: {
          url: vehicle?.photoFrontUrl ?? null,
          status: vehicle?.photoFrontUrl ? 'uploaded' : 'missing',
        },
        vehicle_photo_side: {
          url: vehicle?.photoSideUrl ?? null,
          status: vehicle?.photoSideUrl ? 'uploaded' : 'missing',
        },
        vehicle_photo_back: {
          url: vehicle?.photoBackUrl ?? null,
          status: vehicle?.photoBackUrl ? 'uploaded' : 'missing',
        },
        vehicle_photo_interior: {
          url: vehicle?.photoInteriorUrl ?? null,
          status: vehicle?.photoInteriorUrl ? 'uploaded' : 'missing',
        },
      },
    };
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
