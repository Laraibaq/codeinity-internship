import { apiClient } from "@/lib/api-client";

export interface RatingReviewItem {
  id: string;
  rideId: string;
  name: string;
  stars: number;
  comment?: string | null;
  createdAt: string;
}

export interface UserRatingsSummary {
  averageRating: number;
  totalRatings: number;
  starBreakdown: { stars: number; count: number }[];
  reviews: RatingReviewItem[];
}

export interface CreateRatingPayload {
  score: number;
  comment?: string;
}

export async function submitRideRating(rideId: string, payload: CreateRatingPayload) {
  const { data } = await apiClient.post(`/rides/${rideId}/rate`, payload);
  return data;
}

export async function getDriverRatings(): Promise<UserRatingsSummary> {
  const { data } = await apiClient.get<UserRatingsSummary>("/drivers/me/ratings");
  return data;
}

export async function getPassengerRatings(): Promise<UserRatingsSummary> {
  const { data } = await apiClient.get<UserRatingsSummary>("/passengers/me/ratings");
  return data;
}
