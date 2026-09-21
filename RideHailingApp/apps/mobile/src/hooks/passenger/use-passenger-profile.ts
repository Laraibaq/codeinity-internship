import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { passengerUsersApi } from "@/lib/api/passenger/users";
import { usePassengerAuthStore, type PassengerProfile } from "@/store/passenger/passenger-auth-store";

export function usePassengerProfile() {
  const queryClient = useQueryClient();
  const setProfile = usePassengerAuthStore((s) => s.setProfile);

  const query = useQuery({
    queryKey: ["passenger-profile"],
    queryFn: async () => {
      const data = await passengerUsersApi.getProfile();
      setProfile(data);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<PassengerProfile>) => passengerUsersApi.updateProfile(updates),
    onSuccess: (updated) => {
      setProfile(updated);
      queryClient.setQueryData(["passenger-profile"], updated);
    },
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
