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

// Granularity (PKR) of the fare adjuster in the passenger app, and of every fare the quote
// endpoint hands out: recommended/min/max are all snapped to a multiple of this, so a client
// stepping by this amount from the recommended fare can only land on values the server accepts.
export const PLACEHOLDER_FARE_STEP_REQUIRES_BUSINESS_SIGNOFF = 50;

// The ONE place that maps the passenger-facing fare tier (what the picker shows, and what pricing
// uses) to the driver vehicle body type(s) eligible to serve it. The two are separate concepts --
// see the RideFareTier/VehicleType comment in schema.prisma. The first entry is the default body
// type recorded on the Ride when the client does not pick one. Which body types may serve which
// tier is a business decision nobody has signed off on (e.g. whether a rickshaw may take
// "standard"), hence the suffix.
export const VEHICLE_BODY_TYPES_BY_FARE_TIER_REQUIRES_BUSINESS_SIGNOFF: Record<
  'standard' | 'premium' | 'xl' | 'bike',
  readonly ('car' | 'bike' | 'rickshaw')[]
> = {
  standard: ['car'],
  premium: ['car'],
  xl: ['car'],
  bike: ['bike'],
};

// Payment methods a ride may currently be requested with. MVP policy is cash-only; wallet/card
// exist in the schema (PaymentMethod) but have no passenger-side flow yet.
export const SUPPORTED_RIDE_PAYMENT_METHODS: readonly string[] = ['cash'];
