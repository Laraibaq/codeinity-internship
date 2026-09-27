// Fare constants used by the AI negotiation engine (ai-negotiation.provider.ts) to compute a
// baseline fare and acceptable negotiation bounds per ride type.
//
// IMPORTANT: every number in this file is a placeholder invented during development, not a real
// business decision. None of these values (base fares, per-km rates, the minimum-fare floor, or
// the min/max negotiation-bound multipliers) have been signed off by anyone with authority over
// pricing. They exist only so the negotiation flow has *something* deterministic to compute with
// end-to-end. Do not treat them as real pricing, and do not let them quietly become real pricing
// by shipping them to production without a business sign-off pass -- that's the whole reason they
// carry the `_REQUIRES_BUSINESS_SIGNOFF` suffix (the same convention already used for placeholder
// fare constants on the mobile frontend).
//
// This file is a relocation of numbers that previously lived inline in
// ai-negotiation.provider.ts's calculateFareBounds(). The numbers and the math that uses them are
// unchanged -- this only moves them somewhere they can't hide as unlabeled magic numbers.

export interface RideTypeFareRateRequiresBusinessSignoff {
  PLACEHOLDER_BASE_FARE_REQUIRES_BUSINESS_SIGNOFF: number;
  PLACEHOLDER_PER_KM_RATE_REQUIRES_BUSINESS_SIGNOFF: number;
}

// Base fare (PKR) + per-km rate (PKR/km), by ride type. "standard" is also the fallback used for
// any ride type not explicitly listed here.
export const FARE_RATES_BY_RIDE_TYPE_REQUIRES_BUSINESS_SIGNOFF: Record<
  string,
  RideTypeFareRateRequiresBusinessSignoff
> = {
  standard: {
    PLACEHOLDER_BASE_FARE_REQUIRES_BUSINESS_SIGNOFF: 100,
    PLACEHOLDER_PER_KM_RATE_REQUIRES_BUSINESS_SIGNOFF: 45,
  },
  bike: {
    PLACEHOLDER_BASE_FARE_REQUIRES_BUSINESS_SIGNOFF: 60,
    PLACEHOLDER_PER_KM_RATE_REQUIRES_BUSINESS_SIGNOFF: 25,
  },
  premium: {
    PLACEHOLDER_BASE_FARE_REQUIRES_BUSINESS_SIGNOFF: 160,
    PLACEHOLDER_PER_KM_RATE_REQUIRES_BUSINESS_SIGNOFF: 70,
  },
  xl: {
    PLACEHOLDER_BASE_FARE_REQUIRES_BUSINESS_SIGNOFF: 200,
    PLACEHOLDER_PER_KM_RATE_REQUIRES_BUSINESS_SIGNOFF: 80,
  },
};

// Absolute floor under the "minimum acceptable" negotiation bound, regardless of ride type/distance.
export const PLACEHOLDER_MIN_FARE_FLOOR_REQUIRES_BUSINESS_SIGNOFF = 50;

// "Minimum acceptable" = baselineFare * this multiplier (subject to the floor above).
export const PLACEHOLDER_MIN_FARE_MULTIPLIER_REQUIRES_BUSINESS_SIGNOFF = 0.7;

// "Maximum acceptable" = baselineFare * this multiplier.
export const PLACEHOLDER_MAX_FARE_MULTIPLIER_REQUIRES_BUSINESS_SIGNOFF = 2.2;
