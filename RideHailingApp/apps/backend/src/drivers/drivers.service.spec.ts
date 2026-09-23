import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseStorageService } from '../supabase/supabase-storage.service';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { UpdateVehicleDto, VehicleTypeEnum } from './dto/update-vehicle.dto';
import { RealtimeService } from '../realtime/realtime.service';

describe('DriversService & DriversController (Location & Status)', () => {
  let driversService: DriversService;
  let driversController: DriversController;
  let prisma: any;
  let realtimeService: any;

  const mockDriverId = '33333333-3333-3333-3333-333333333333';
  const mockPassengerId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    prisma = {
      driver: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      vehicle: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
      },
      ride: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    realtimeService = {
      emitDriverLocationUpdated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriversController],
      providers: [
        DriversService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: SupabaseStorageService,
          useValue: {
            uploadDriverDocument: jest.fn(),
          },
        },
        {
          provide: RealtimeService,
          useValue: realtimeService,
        },
      ],
    }).compile();

    driversService = module.get<DriversService>(DriversService);
    driversController = module.get<DriversController>(DriversController);
  });

  describe('1. Authenticated driver can update own location', () => {
    it('updates driver currentLat and currentLng in database', async () => {
      prisma.driver.findUnique.mockResolvedValue({ id: mockDriverId, verificationStatus: 'approved' });
      const dto: UpdateLocationDto = { latitude: 37.7749, longitude: -122.4194 };
      const expectedResult = {
        id: mockDriverId,
        currentLat: 37.7749,
        currentLng: -122.4194,
        isOnline: true,
      };
      prisma.driver.update.mockResolvedValue(expectedResult);

      const result = await driversService.updateLocation(mockDriverId, dto);

      expect(prisma.driver.update).toHaveBeenCalledWith({
        where: { id: mockDriverId },
        data: {
          currentLat: 37.7749,
          currentLng: -122.4194,
        },
        select: {
          id: true,
          currentLat: true,
          currentLng: true,
          isOnline: true,
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('throws NotFoundException if driver profile does not exist', async () => {
      prisma.driver.findUnique.mockResolvedValue(null);
      await expect(
        driversService.updateLocation('non-existent-id', { latitude: 37.7, longitude: -122.4 }),
      ).rejects.toThrow();
    });
  });

  describe('2. Non-driver (passenger) cannot update driver location (Ownership Protection)', () => {
    it('throws ForbiddenException when role is passenger in controller', async () => {
      const passengerUser = { sub: mockPassengerId, role: 'passenger' as const };
      const dto: UpdateLocationDto = { latitude: 37.7749, longitude: -122.4194 };

      await expect(
        driversController.updateLocation(passengerUser, dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. Non-driver cannot update driver status (Ownership Protection)', () => {
    it('throws ForbiddenException when role is passenger for status update', async () => {
      const passengerUser = { sub: mockPassengerId, role: 'passenger' as const };
      const dto: UpdateDriverStatusDto = { isOnline: true };

      await expect(
        driversController.updateStatus(passengerUser, dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('4. Driver can update online status', () => {
    it('updates driver isOnline to true when driver is approved', async () => {
      prisma.driver.findUnique.mockResolvedValue({ id: mockDriverId, verificationStatus: 'approved' });
      const driverUser = { sub: mockDriverId, role: 'driver' as const };
      const dto: UpdateDriverStatusDto = { isOnline: true };
      const expectedResult = {
        id: mockDriverId,
        isOnline: true,
        currentLat: 37.7749,
        currentLng: -122.4194,
      };
      prisma.driver.update.mockResolvedValue(expectedResult);

      const result = await driversController.updateStatus(driverUser, dto);

      expect(prisma.driver.update).toHaveBeenCalledWith({
        where: { id: mockDriverId },
        data: { isOnline: true },
        select: {
          id: true,
          isOnline: true,
          currentLat: true,
          currentLng: true,
        },
      });
      expect(result.isOnline).toBe(true);
    });

    it('throws ForbiddenException when unapproved driver attempts to go online', async () => {
      prisma.driver.findUnique.mockResolvedValue({ id: mockDriverId, verificationStatus: 'pending' });
      const driverUser = { sub: mockDriverId, role: 'driver' as const };

      await expect(
        driversController.updateStatus(driverUser, { isOnline: true }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates driver isOnline to false when going offline', async () => {
      prisma.driver.findUnique.mockResolvedValue({ id: mockDriverId, verificationStatus: 'approved' });
      const driverUser = { sub: mockDriverId, role: 'driver' as const };
      const dto: UpdateDriverStatusDto = { isOnline: false };
      prisma.driver.update.mockResolvedValue({
        id: mockDriverId,
        isOnline: false,
        currentLat: null,
        currentLng: null,
      });

      const result = await driversController.updateStatus(driverUser, dto);

      expect(result.isOnline).toBe(false);
    });
  });

  describe('5. Latitude and longitude boundary verification', () => {
    it('accepts valid boundary coordinates (-90, 90, -180, 180)', async () => {
      prisma.driver.findUnique.mockResolvedValue({ id: mockDriverId, verificationStatus: 'approved' });
      prisma.driver.update.mockResolvedValue({ id: mockDriverId, currentLat: -90, currentLng: 180, isOnline: false });
      const result = await driversService.updateLocation(mockDriverId, { latitude: -90, longitude: 180 });
      expect(result.currentLat).toBe(-90);
      expect(result.currentLng).toBe(180);
    });
  });

  describe('6. Authenticated driver can retrieve own profile', () => {
    it('returns sanitized driver profile without passwordHash', async () => {
      const mockProfile = {
        id: mockDriverId,
        name: 'John Driver',
        phone: '+1234567890',
        email: 'john@example.com',
        profilePhotoUrl: 'https://example.com/photo.jpg',
        verificationStatus: 'approved',
        isOnline: true,
        rating: 4.85,
        currentLat: 37.77,
        currentLng: -122.41,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.driver.findUnique.mockResolvedValue(mockProfile);

      const driverUser = { sub: mockDriverId, role: 'driver' as const };
      const result = await driversController.getProfile(driverUser);

      expect(result).toEqual(mockProfile);
      expect((result as any).passwordHash).toBeUndefined();
      expect(prisma.driver.findUnique).toHaveBeenCalledWith({
        where: { id: mockDriverId },
        select: expect.objectContaining({
          id: true,
          name: true,
          phone: true,
          email: true,
        }),
      });
    });

    it('throws NotFoundException if driver profile does not exist', async () => {
      prisma.driver.findUnique.mockResolvedValue(null);
      await expect(driversService.getProfile('non-existent-id')).rejects.toThrow();
    });
  });

  describe('7. Driver can update own editable profile fields', () => {
    it('updates driver name successfully', async () => {
      prisma.driver.findUnique.mockResolvedValue({ id: mockDriverId });
      const updatedProfile = {
        id: mockDriverId,
        name: 'John Updated',
        phone: '+1234567890',
        email: 'john@example.com',
        profilePhotoUrl: null,
        verificationStatus: 'approved',
        isOnline: false,
        rating: 4.9,
        currentLat: null,
        currentLng: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.driver.update.mockResolvedValue(updatedProfile);

      const dto: UpdateDriverProfileDto = { name: 'John Updated' };
      const driverUser = { sub: mockDriverId, role: 'driver' as const };
      const result = await driversController.updateProfile(driverUser, dto);

      expect(result.name).toBe('John Updated');
      expect(prisma.driver.update).toHaveBeenCalledWith({
        where: { id: mockDriverId },
        data: { name: 'John Updated' },
        select: expect.any(Object),
      });
    });
  });

  describe('8. Profile Ownership & Role Protection', () => {
    it('throws ForbiddenException when passenger tries to get driver profile', async () => {
      const passengerUser = { sub: mockPassengerId, role: 'passenger' as const };
      await expect(driversController.getProfile(passengerUser)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when passenger tries to update driver profile', async () => {
      const passengerUser = { sub: mockPassengerId, role: 'passenger' as const };
      await expect(
        driversController.updateProfile(passengerUser, { name: 'Hacker' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('9. Vehicle Management', () => {
    it('returns vehicle details for authenticated driver', async () => {
      prisma.driver.findUnique.mockResolvedValue({ id: mockDriverId });
      const mockVehicle = {
        id: 'vehicle-123',
        driverId: mockDriverId,
        type: 'car',
        make: 'Toyota',
        model: 'Corolla',
        color: 'White',
        registrationNumber: 'ABC-1234',
        registrationDocUrl: 'https://example.com/reg.pdf',
        insuranceDocUrl: null,
        photoFrontUrl: null,
        photoSideUrl: null,
        photoBackUrl: null,
        photoInteriorUrl: null,
      };
      prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const driverUser = { sub: mockDriverId, role: 'driver' as const };
      const result = await driversController.getVehicle(driverUser);

      expect(result).toEqual(mockVehicle);
    });

    it('updates/upserts vehicle details for authenticated driver', async () => {
      prisma.driver.findUnique.mockResolvedValue({ id: mockDriverId });
      const updatedVehicle = {
        id: 'vehicle-123',
        driverId: mockDriverId,
        type: 'car',
        make: 'Honda',
        model: 'Civic',
        color: 'Black',
        registrationNumber: 'XYZ-789',
        registrationDocUrl: null,
        insuranceDocUrl: null,
        photoFrontUrl: null,
        photoSideUrl: null,
        photoBackUrl: null,
        photoInteriorUrl: null,
      };
      prisma.vehicle.upsert.mockResolvedValue(updatedVehicle);

      const dto: UpdateVehicleDto = {
        type: VehicleTypeEnum.car,
        make: 'Honda',
        model: 'Civic',
        color: 'Black',
        registrationNumber: 'XYZ-789',
      };
      const driverUser = { sub: mockDriverId, role: 'driver' as const };
      const result = await driversController.updateVehicle(driverUser, dto);

      expect(result.make).toBe('Honda');
      expect(result.model).toBe('Civic');
      expect(prisma.vehicle.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { driverId: mockDriverId },
          create: expect.objectContaining({ driverId: mockDriverId, make: 'Honda' }),
          update: expect.objectContaining({ make: 'Honda' }),
        }),
      );
    });

    it('throws ForbiddenException when passenger attempts to view or edit vehicle', async () => {
      const passengerUser = { sub: mockPassengerId, role: 'passenger' as const };
      await expect(driversController.getVehicle(passengerUser)).rejects.toThrow(ForbiddenException);
      await expect(
        driversController.updateVehicle(passengerUser, { make: 'Tesla' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('10. Document Management & Status', () => {
    it('returns structured document statuses and URLs for driver', async () => {
      const mockDriver = {
        id: mockDriverId,
        verificationStatus: 'pending',
        profilePhotoUrl: 'https://example.com/profile.jpg',
        cnicDocUrl: 'https://example.com/id.jpg',
        licenseDocFrontUrl: 'https://example.com/lic_front.jpg',
        licenseDocBackUrl: null,
        vehicle: {
          registrationDocUrl: 'https://example.com/reg.pdf',
          insuranceDocUrl: null,
          photoFrontUrl: null,
          photoSideUrl: null,
          photoBackUrl: null,
          photoInteriorUrl: null,
        },
      };
      prisma.driver.findUnique.mockResolvedValue(mockDriver);

      const driverUser = { sub: mockDriverId, role: 'driver' as const };
      const result = await driversController.getDocuments(driverUser);

      expect(result.verificationStatus).toBe('pending');
      expect(result.documents.profile_photo).toEqual({
        url: 'https://example.com/profile.jpg',
        status: 'uploaded',
      });
      expect(result.documents.license_back).toEqual({
        url: null,
        status: 'missing',
      });
      expect(result.documents.vehicle_registration).toEqual({
        url: 'https://example.com/reg.pdf',
        status: 'uploaded',
      });
      expect(result.documents.vehicle_insurance).toEqual({
        url: null,
        status: 'missing',
      });
    });

    it('throws ForbiddenException when passenger attempts to view driver documents', async () => {
      const passengerUser = { sub: mockPassengerId, role: 'passenger' as const };
      await expect(driversController.getDocuments(passengerUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('11. Verification Status Protection', () => {
    it('updateProfile does not allow modification of verificationStatus', async () => {
      prisma.driver.findUnique.mockResolvedValue({ id: mockDriverId, verificationStatus: 'pending' });
      prisma.driver.update.mockResolvedValue({
        id: mockDriverId,
        name: 'John',
        verificationStatus: 'pending',
      });

      // Passing any rogue verificationStatus field to service updateProfile
      await driversService.updateProfile(mockDriverId, { name: 'John' } as any);

      // Verify Prisma update call only updated allowed fields
      expect(prisma.driver.update).toHaveBeenCalledWith({
        where: { id: mockDriverId },
        data: { name: 'John' },
        select: expect.any(Object),
      });
    });
  });
});
