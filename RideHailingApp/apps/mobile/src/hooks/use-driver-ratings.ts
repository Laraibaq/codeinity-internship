import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

export interface StarBreakdownItem {
  stars: number;
  count: number;
}

export interface RatingReviewItem {
  id: string;
  rideId: string;
  name: string;
  stars: number;
  comment: string | null;
  createdAt: string;
}

export interface DriverRatingsResponse {
  averageRating: number;
  totalRatings: number;
  starBreakdown: StarBreakdownItem[];
  reviews: RatingReviewItem[];
}

export interface SubmitRatingPayload {
  rideId: string;
  score: number;
  comment?: string;
}

export const DRIVER_RATINGS_QUERY_KEY = ["driver", "ratings"];

export function useDriverRatings() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<DriverRatingsResponse>({
    queryKey: DRIVER_RATINGS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<DriverRatingsResponse>("/drivers/me/ratings");
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });
}

export function useSubmitRideRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rideId, score, comment }: SubmitRatingPayload) => {
      const res = await apiClient.post(`/rides/${rideId}/rate`, { score, comment });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVER_RATINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["driver", "ride-history"] });
    },
  });
}
