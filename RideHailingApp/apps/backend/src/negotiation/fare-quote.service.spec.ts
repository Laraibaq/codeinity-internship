import { BadRequestException } from '@nestjs/common';
import { AiNegotiationProvider } from './ai-negotiation.provider';
import { FareQuoteService } from './fare-quote.service';
import { FareQuoteRequestDto, FareTierEnum, VehicleBodyTypeEnum } from './dto/fare-quote.dto';
import { PLACEHOLDER_FARE_STEP_REQUIRES_BUSINESS_SIGNOFF } from './fare-config';

describe('FareQuoteService', () => {
  const service = new FareQuoteService(new AiNegotiationProvider());

  // ~1.1 km apart on the equator, so the straight-line floor never dominates a 5.2 km route
  const base: FareQuoteRequestDto = {
    pickupLat: 0,
    pickupLng: 0,
    dropoffLat: 0,
    dropoffLng: 0.01,
    distanceKm: 5.2,
    fareTier: FareTierEnum.standard,
  };

  it('returns recommended/min/max/step in PKR, all snapped to the configured step', () => {
    const q = service.quote(base);

    expect(q.currency).toBe('PKR');
    expect(q.fareStep).toBe(PLACEHOLDER_FARE_STEP_REQUIRES_BUSINESS_SIGNOFF);
    // standard: 100 + 45*5.2 = 334 -> min max(50, 233.8)=233.8 -> 250; max 734.8 -> 700; rec 334 -> 350
    expect(q).toMatchObject({ minimumFare: 250, recommendedFare: 350, maximumFare: 700 });
    for (const v of [q.minimumFare, q.recommendedFare, q.maximumFare]) {
      expect(v % q.fareStep).toBe(0);
    }
    expect(q.minimumFare).toBeLessThanOrEqual(q.recommendedFare);
    expect(q.recommendedFare).toBeLessThanOrEqual(q.maximumFare);
  });

  it('is honest about its source: deterministic formula, not AI', () => {
    const q = service.quote(base);
    expect(q.source).toBe('deterministic_formula');
    expect(q.aiGenerated).toBe(false);
  });

  it('defaults the body type from the tier, and echoes the tier', () => {
    expect(service.quote({ ...base, fareTier: FareTierEnum.bike })).toMatchObject({
      fareTier: 'bike',
      vehicleType: 'bike',
    });
    expect(service.quote(base).vehicleType).toBe('car');
  });

  it('rejects a body type that cannot serve the tier', () => {
    expect(() =>
      service.quote({ ...base, fareTier: FareTierEnum.bike, vehicleType: VehicleBodyTypeEnum.car }),
    ).toThrow(BadRequestException);
  });

  it('prices on at least the straight-line distance, whatever the client reports', () => {
    // ~111 km straight line; client claims 1 km
    const q = service.quote({ ...base, dropoffLng: 1, distanceKm: 1 });
    expect(q.pricedDistanceKm).toBeGreaterThan(100);
    expect(q.minimumFare).toBeGreaterThan(3000);
  });

  it('gives a higher quote for premium than standard on the same trip', () => {
    expect(service.quote({ ...base, fareTier: FareTierEnum.premium }).recommendedFare).toBeGreaterThan(
      service.quote(base).recommendedFare,
    );
  });
});
