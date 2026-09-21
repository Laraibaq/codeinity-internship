import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { passengerRidesApi, type CreateRideRequest } from "@/lib/api/passenger/rides";

export function usePassengerRides() {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ["passenger-ride-history"],
    queryFn: () => passengerRidesApi.getRideHistory(),
    staleTime: 1000 * 60 * 2,
  });

  const currentRideQuery = useQuery({
    queryKey: ["passenger-current-ride"],
    queryFn: () => passengerRidesApi.getCurrentRide(),
    staleTime: 1000 * 15,
  });

  const createRideMutation = useMutation({
    mutationFn: (payload: CreateRideRequest) => passengerRidesApi.createRideRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passenger-current-ride"] });
    },
  });

  const cancelRideMutation = useMutation({
    mutationFn: ({ rideId, reason }: { rideId: string; reason?: string }) =>
      passengerRidesApi.cancelRide(rideId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passenger-current-ride"] });
      queryClient.invalidateQueries({ queryKey: ["passenger-ride-history"] });
    },
  });

  return {
    history: historyQuery.data?.rides ?? [],
    totalRides: historyQuery.data?.total ?? 0,
    isLoadingHistory: historyQuery.isLoading,
    currentRide: currentRideQuery.data ?? null,
    isLoadingCurrentRide: currentRideQuery.isLoading,
    createRide: createRideMutation.mutateAsync,
    isCreatingRide: createRideMutation.isPending,
    cancelRide: cancelRideMutation.mutateAsync,
    isCancellingRide: cancelRideMutation.isPending,
  };
}
