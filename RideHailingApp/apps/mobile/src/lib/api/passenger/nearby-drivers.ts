import { apiClient } from "@/lib/api-client";

export type NearbyVehicleType = "car" | "bike" | "rickshaw";

export interface NearbyDriver {
  vehicleType: NearbyVehicleType | null;
  rating: number | null;
  lat: number;
  lng: number;
}

export interface NearbyDriversResponse {
  drivers: NearbyDriver[];
  count: number;
}

export interface NearbyDriversParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  vehicleType?: NearbyVehicleType;
}

export const nearbyDriversApi = {
  getNearby: async (params: NearbyDriversParams): Promise<NearbyDriversResponse> => {
    const query = new URLSearchParams({
      lat: String(params.lat),
      lng: String(params.lng),
    });
    if (params.radiusKm != null) query.set("radiusKm", String(params.radiusKm));
    if (params.vehicleType) query.set("vehicleType", params.vehicleType);
    const { data } = await apiClient.get<NearbyDriversResponse>(
      `/drivers/nearby?${query.toString()}`,
    );
    return data;
  },
};
