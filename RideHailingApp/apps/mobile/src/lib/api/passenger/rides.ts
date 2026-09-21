import { apiClient } from "@/lib/api-client";

export interface CreateRideRequest {
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  distanceKm: number;
  etaMinutes: number;
  proposedFare: number;
  aiRecommendedFare?: number;
}

export interface PassengerRideResponse {
  id: string;
  passengerId: string;
  driverId?: string | null;
  status: string;
  pickupAddress: string;
  destinationAddress: string;
  dropoffAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  distanceKm?: number;
  etaMinutes?: number;
  proposedFare?: string | number;
  aiRecommendedFare?: string | number;
  finalFare?: string | number | null;
  fare: number;
  createdAt: string;
  requestedAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  updatedAt?: string;
  passenger?: {
    id: string;
    name: string;
    phone: string;
    rating?: number | null;
    profilePhotoUrl?: string | null;
  };
}

export const passengerRidesApi = {
  createRideRequest: async (payload: CreateRideRequest): Promise<PassengerRideResponse> => {
    const { data } = await apiClient.post<any>("/rides", payload);
    return {
      ...data,
      destinationAddress: data.dropoffAddress ?? "",
      fare: Number(data.proposedFare) || 0,
      createdAt: data.requestedAt ?? new Date().toISOString(),
    };
  },

  getCurrentRide: async () => {
    const { data } = await apiClient.get<PassengerRideResponse | null>("/rides/current");
    return data;
  },

  getRideById: async (rideId: string) => {
    const { data } = await apiClient.get<PassengerRideResponse>(`/rides/${rideId}`);
    return data;
  },

  getRideHistory: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get<{ rides: PassengerRideResponse[]; total: number }>(
      `/rides/history?page=${page}&limit=${limit}`,
    );
    return data;
  },

  cancelRide: async (rideId: string, reason?: string) => {
    const { data } = await apiClient.post<{ message: string }>(`/rides/${rideId}/cancel`, { reason });
    return data;
  },
};
