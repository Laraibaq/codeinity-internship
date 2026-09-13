import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  profilePhotoUrl: string | null;
  verificationStatus: "pending" | "approved" | "rejected";
  isOnline: boolean;
  rating: number | null;
  currentLat: number | null;
  currentLng: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDriverProfilePayload {
  name?: string;
  profilePhotoUrl?: string;
}

export interface DriverVehicle {
  id: string;
  driverId: string;
  type: "car" | "bike" | "rickshaw" | null;
  make: string | null;
  model: string | null;
  color: string | null;
  registrationNumber: string | null;
  registrationDocUrl: string | null;
  insuranceDocUrl: string | null;
  photoFrontUrl: string | null;
  photoSideUrl: string | null;
  photoBackUrl: string | null;
  photoInteriorUrl: string | null;
}

export interface UpdateVehiclePayload {
  type?: "car" | "bike" | "rickshaw";
  make?: string;
  model?: string;
  color?: string;
  registrationNumber?: string;
}

export interface DocumentItem {
  url: string | null;
  status: "uploaded" | "missing";
}

export interface DriverDocumentsResponse {
  verificationStatus: "pending" | "approved" | "rejected";
  documents: {
    profile_photo: DocumentItem;
    identity_document: DocumentItem;
    license_front: DocumentItem;
    license_back: DocumentItem;
    vehicle_registration: DocumentItem;
    vehicle_insurance: DocumentItem;
    vehicle_photo_front: DocumentItem;
    vehicle_photo_side: DocumentItem;
    vehicle_photo_back: DocumentItem;
    vehicle_photo_interior: DocumentItem;
  };
}

export const DRIVER_PROFILE_QUERY_KEY = ["driver", "profile"];
export const DRIVER_VEHICLE_QUERY_KEY = ["driver", "vehicle"];
export const DRIVER_DOCUMENTS_QUERY_KEY = ["driver", "documents"];

export function useDriverProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<DriverProfile>({
    queryKey: DRIVER_PROFILE_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<DriverProfile>("/drivers/me");
      if (res.data.verificationStatus) {
        useAuthStore.getState().setVerificationStatus(res.data.verificationStatus);
      }
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });
}

export function useUpdateDriverProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateDriverProfilePayload) => {
      const res = await apiClient.patch<DriverProfile>("/drivers/me", payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(DRIVER_PROFILE_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: DRIVER_PROFILE_QUERY_KEY });
    },
  });
}

export function useDriverVehicle() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<DriverVehicle | null>({
    queryKey: DRIVER_VEHICLE_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<DriverVehicle | null>("/drivers/me/vehicle");
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });
}

export function useUpdateDriverVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateVehiclePayload) => {
      const res = await apiClient.patch<DriverVehicle>("/drivers/me/vehicle", payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(DRIVER_VEHICLE_QUERY_KEY, data);
      queryClient.invalidateQueries({ queryKey: DRIVER_VEHICLE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DRIVER_DOCUMENTS_QUERY_KEY });
    },
  });
}

export function useDriverDocuments() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<DriverDocumentsResponse>({
    queryKey: DRIVER_DOCUMENTS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<DriverDocumentsResponse>("/drivers/me/documents");
      if (res.data.verificationStatus) {
        useAuthStore.getState().setVerificationStatus(res.data.verificationStatus);
      }
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });
}
