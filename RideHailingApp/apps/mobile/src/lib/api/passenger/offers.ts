import { apiClient } from "@/lib/api-client";
import type { DriverOffer } from "@/store/passenger/passenger-ride-store";

export const passengerOffersApi = {
  getRidesOffers: async (rideId: string) => {
    const { data } = await apiClient.get<DriverOffer[]>(`/rides/${rideId}/offers`);
    return data;
  },

  acceptOffer: async (rideId: string, offerId: string) => {
    const { data } = await apiClient.post<{ message: string; rideId: string }>(
      `/rides/${rideId}/offers/${offerId}/accept`,
    );
    return data;
  },

  declineOffer: async (rideId: string, offerId: string) => {
    const { data } = await apiClient.post<{ message: string }>(
      `/rides/${rideId}/offers/${offerId}/decline`,
    );
    return data;
  },

  matchRide: async (rideId: string) => {
    const { data } = await apiClient.post<{ message: string; offersCount: number }>(
      `/rides/${rideId}/match`,
    );
    return data;
  },
};

