import { apiClient } from "@/lib/api-client";
import type { PassengerProfile } from "@/store/passenger/passenger-auth-store";

export const passengerUsersApi = {
  getProfile: async () => {
    const { data } = await apiClient.get<PassengerProfile>("/passengers/me");
    return data;
  },

  updateProfile: async (payload: Partial<PassengerProfile>) => {
    const { data } = await apiClient.patch<PassengerProfile>("/passengers/me", payload);
    return data;
  },
};
