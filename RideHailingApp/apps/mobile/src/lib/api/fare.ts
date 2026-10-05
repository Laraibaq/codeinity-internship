import { apiClient } from "@/lib/api-client";

// The four tiers the picker shows. These are PRICING/COMFORT tiers, not vehicle body types.
// The body type a driver needs in order to be matched for a tier (car/bike/rickshaw) is decided
// by the backend (VEHICLE_BODY_TYPES_BY_FARE_TIER_REQUIRES_BUSINESS_SIGNOFF in
// apps/backend/src/negotiation/fare-config.ts) and comes back on every quote as `vehicleType`.
// That single backend table is the only tier -> body-type mapping; do not duplicate it here.
export type FareTier = "standard" | "premium" | "xl" | "bike";
export type VehicleBodyType = "car" | "bike" | "rickshaw";

export interface FareQuote {
  currency: "PKR";
  recommendedFare: number;
  minimumFare: number;
  maximumFare: number;
  fareStep: number;
  fareTier: FareTier;
  vehicleType: VehicleBodyType;
  source: "deterministic_formula";
  aiGenerated: false;
}

export interface FareQuoteRequest {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  distanceKm: number;
  fareTier: FareTier;
}

export const fareApi = {
  getQuote: async (payload: FareQuoteRequest): Promise<FareQuote> => {
    const { data } = await apiClient.post<FareQuote>("/fare/quote", payload);
    return data;
  },
};
