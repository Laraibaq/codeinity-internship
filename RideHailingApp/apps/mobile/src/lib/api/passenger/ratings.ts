import { apiClient } from "@/lib/api-client";

export interface RateDriverRequest {
  rideId: string;
  driverId: string;
  rating: number;
  feedback?: string;
}

export const passengerRatingsApi = {
  rateDriver: async (payload: RateDriverRequest) => {
    const { data } = await apiClient.post<{ message: string }>("/ratings/driver", payload);
    return data;
  },
};
