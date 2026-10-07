import { apiClient } from "@/lib/api-client";

// Driver bids, accepting and rejecting go through lib/api/negotiation.ts (the negotiation
// endpoints). The legacy RideOffer accept/decline/list calls were removed from here on purpose so
// no screen can reach the stale-fare path.
export const passengerOffersApi = {
  matchRide: async (rideId: string) => {
    const { data } = await apiClient.post<{ message: string; offersCount: number }>(
      `/rides/${rideId}/match`,
    );
    return data;
  },
};

