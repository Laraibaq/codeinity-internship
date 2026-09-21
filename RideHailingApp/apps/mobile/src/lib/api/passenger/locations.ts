import { apiClient } from "@/lib/api-client";
import type { PassengerLocationPoint } from "@/store/passenger/passenger-ride-store";

export interface SavedPlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: "home" | "work" | "favorite";
}

export const passengerLocationsApi = {
  getSavedPlaces: async () => {
    const { data } = await apiClient.get<SavedPlace[]>("/passengers/me/saved-places");
    return data;
  },

  addSavedPlace: async (place: Omit<SavedPlace, "id">) => {
    const { data } = await apiClient.post<SavedPlace>("/passengers/me/saved-places", place);
    return data;
  },

  deleteSavedPlace: async (id: string) => {
    const { data } = await apiClient.delete<{ message: string }>(`/passengers/me/saved-places/${id}`);
    return data;
  },

  searchPlaces: async (query: string): Promise<PassengerLocationPoint[]> => {
    const { data } = await apiClient.get<PassengerLocationPoint[]>(`/locations/search?q=${encodeURIComponent(query)}`);
    return data;
  },
};
