import { ForbiddenException } from '@nestjs/common';
import { NearbyDriversController } from './nearby-drivers.controller';

describe('NearbyDriversController', () => {
  const find = jest.fn();
  const controller = new NearbyDriversController({
    findEligibleNearbyDrivers: find,
  } as any);
  const passenger = { sub: 'p1', role: 'passenger' } as any;

  beforeEach(() => find.mockReset());

  it('returns only coarse fields with rounded coordinates', async () => {
    find.mockResolvedValue([
      {
        id: 'd1',
        name: 'Ali',
        phone: '+923001234567',
        rating: 4.8,
        currentLat: 31.520371,
        currentLng: 74.358749,
        distanceKm: 1.23,
        estimatedArrivalMinutes: 3,
        vehicle: { make: 'Toyota', model: 'Corolla', color: 'white', registrationNumber: 'ABC-123', type: 'car' },
      },
      {
        id: 'd2',
        name: 'Bo',
        phone: '1',
        rating: 4.1,
        currentLat: 31.5,
        currentLng: 74.3,
        distanceKm: 2,
        estimatedArrivalMinutes: 4,
        vehicle: null,
      },
    ]);
    const res = await controller.getNearby(passenger, { lat: 31.52, lng: 74.35 });
    expect(res.count).toBe(2);
    expect(res.drivers[0]).toEqual({ vehicleType: 'car', rating: 4.8, lat: 31.52, lng: 74.359 });
    expect(res.drivers[1].vehicleType).toBeNull();
    for (const d of res.drivers) {
      expect(Object.keys(d).sort()).toEqual(['lat', 'lng', 'rating', 'vehicleType']);
      for (const k of ['id', 'name', 'phone', 'plate', 'registrationNumber']) {
        expect(d).not.toHaveProperty(k);
      }
    }
    expect(find).toHaveBeenCalledWith(31.52, 74.35, 5, 20, [], undefined);
  });

  it('forwards vehicleType and radius', async () => {
    find.mockResolvedValue([]);
    const res = await controller.getNearby(passenger, { lat: 1, lng: 2, radiusKm: 8, vehicleType: 'bike' });
    expect(res).toEqual({ drivers: [], count: 0 });
    expect(find).toHaveBeenCalledWith(1, 2, 8, 20, [], 'bike');
  });

  it('forbids non-passengers', async () => {
    await expect(
      controller.getNearby({ sub: 'd1', role: 'driver' } as any, { lat: 1, lng: 2 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(find).not.toHaveBeenCalled();
  });
});
