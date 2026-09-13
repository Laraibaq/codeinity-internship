import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

export interface HistoryRideItem {
  id: string;
  passengerId: string;
  driverId: string | null;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  distanceKm: number;
  etaMinutes: number;
  proposedFare: number;
  finalFare: number;
  status: "completed" | "cancelled" | string;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  passenger: {
    id: string;
    name: string;
    rating: number | null;
    profilePhotoUrl: string | null;
  };
}

export interface EarningsBucket {
  label: string;
  earnings: number;
  expenses: number;
  count: number;
}

export interface DriverEarningsResponse {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalEarnings: number;
  completedRidesCount: number;
  dailyBreakdown: EarningsBucket[];
  weeklyBreakdown: EarningsBucket[];
  monthlyBreakdown: EarningsBucket[];
}

export interface RideDetailResponse {
  id: string;
  passengerId: string;
  driverId: string | null;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  distanceKm: number;
  etaMinutes: number;
  proposedFare: number;
  finalFare: number | null;
  status: string;
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  passenger?: {
    id: string;
    name: string;
    phone: string;
    rating: number | null;
    profilePhotoUrl: string | null;
  };
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating: number | null;
    vehicle: any;
  };
}

export const DRIVER_RIDE_HISTORY_QUERY_KEY = (status?: string) => [
  "driver",
  "ride-history",
  status ?? "all",
];

export const DRIVER_EARNINGS_QUERY_KEY = ["driver", "earnings"];

export const RIDE_DETAILS_QUERY_KEY = (rideId: string) => ["rides", rideId];

export function useDriverRideHistory(status?: "completed" | "cancelled") {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<HistoryRideItem[]>({
    queryKey: DRIVER_RIDE_HISTORY_QUERY_KEY(status),
    queryFn: async () => {
      const res = await apiClient.get<HistoryRideItem[]>("/rides/history", {
        params: status ? { status } : undefined,
      });
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });
}

export function useDriverEarnings(timezoneOffsetMinutes?: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const offset = timezoneOffsetMinutes ?? new Date().getTimezoneOffset();

  return useQuery<DriverEarningsResponse>({
    queryKey: DRIVER_EARNINGS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<DriverEarningsResponse>("/rides/earnings", {
        params: { timezoneOffset: offset },
      });
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });
}

export function useRideDetails(rideId: string | undefined) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isValidRideId = Boolean(rideId) && !rideId?.startsWith("req-");

  return useQuery<RideDetailResponse>({
    queryKey: RIDE_DETAILS_QUERY_KEY(rideId ?? ""),
    queryFn: async () => {
      const res = await apiClient.get<RideDetailResponse>(`/rides/${rideId}`);
      return res.data;
    },
    enabled: isAuthenticated && isValidRideId,
    staleTime: 30000,
  });
}
