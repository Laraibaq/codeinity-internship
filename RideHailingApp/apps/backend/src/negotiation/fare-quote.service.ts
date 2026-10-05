import { BadRequestException, Injectable } from '@nestjs/common';
import { AiNegotiationProvider } from './ai-negotiation.provider';
import {
  PLACEHOLDER_FARE_STEP_REQUIRES_BUSINESS_SIGNOFF,
  VEHICLE_BODY_TYPES_BY_FARE_TIER_REQUIRES_BUSINESS_SIGNOFF,
} from './fare-config';
import {
  FareQuoteRequestDto,
  FareQuoteResponse,
  FareTierEnum,
  VehicleBodyTypeEnum,
} from './dto/fare-quote.dto';
import { calculateHaversineDistanceKm } from '../rides/matching.service';

// Single source of truth for "what may this ride cost". Both the quote endpoint and POST /rides
// call quote(), so the bounds the passenger sees are exactly the bounds the server enforces.
@Injectable()
export class FareQuoteService {
  constructor(private readonly aiProvider: AiNegotiationProvider) {}

  quote(input: FareQuoteRequestDto): FareQuoteResponse {
    const step = PLACEHOLDER_FARE_STEP_REQUIRES_BUSINESS_SIGNOFF;
    const eligible: readonly string[] =
      VEHICLE_BODY_TYPES_BY_FARE_TIER_REQUIRES_BUSINESS_SIGNOFF[input.fareTier];
    const vehicleType = input.vehicleType ?? (eligible[0] as VehicleBodyTypeEnum);
    if (!eligible.includes(vehicleType)) {
      throw new BadRequestException(
        `Vehicle type '${vehicleType}' cannot serve fare tier '${input.fareTier}'`,
      );
    }

    // The client reports the route distance, which would otherwise let it shrink the price floor.
    // A road route can never be shorter than the straight line, so floor it there.
    const straightLineKm = calculateHaversineDistanceKm(
      input.pickupLat,
      input.pickupLng,
      input.dropoffLat,
      input.dropoffLng,
    );
    const pricedDistanceKm = Math.max(input.distanceKm, straightLineKm);

    const { baselineFare, minBound, maxBound } = this.aiProvider.calculateFareBounds(
      pricedDistanceKm,
      input.fareTier,
    );

    // Snap to the step so every stepper position is a server-valid fare. Min rounds up and max
    // rounds down so the snapped range never exceeds the raw bounds; keep at least one step.
    const minimumFare = Math.max(step, Math.ceil(minBound / step) * step);
    const maximumFare = Math.max(minimumFare, Math.floor(maxBound / step) * step);
    const recommendedFare = Math.min(
      maximumFare,
      Math.max(minimumFare, Math.round(baselineFare / step) * step),
    );

    return {
      currency: 'PKR',
      recommendedFare,
      minimumFare,
      maximumFare,
      fareStep: step,
      fareTier: input.fareTier as FareTierEnum,
      vehicleType,
      source: 'deterministic_formula',
      aiGenerated: false,
      pricedDistanceKm,
    };
  }
}
