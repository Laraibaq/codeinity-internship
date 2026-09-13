import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

export interface NotificationItem {
  id: string;
  driverId: string;
  title: string;
  message: string;
  type: "account" | "ride" | "support" | "system";
  isRead: boolean;
  createdAt: string;
}

export interface DriverNotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export const DRIVER_NOTIFICATIONS_QUERY_KEY = ["driver", "notifications"];

export function useDriverNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<DriverNotificationsResponse>({
    queryKey: DRIVER_NOTIFICATIONS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<DriverNotificationsResponse>("/notifications");
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch<NotificationItem>(`/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<DriverNotificationsResponse>(
        DRIVER_NOTIFICATIONS_QUERY_KEY,
        (old) => {
          if (!old) return old;
          const notifications = old.notifications.map((n) =>
            n.id === updated.id ? { ...n, isRead: true } : n,
          );
          const unreadCount = notifications.filter((n) => !n.isRead).length;
          return { notifications, unreadCount };
        },
      );
      queryClient.invalidateQueries({ queryKey: DRIVER_NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch<{ success: boolean }>("/notifications/read-all");
      return res.data;
    },
    onSuccess: () => {
      queryClient.setQueryData<DriverNotificationsResponse>(
        DRIVER_NOTIFICATIONS_QUERY_KEY,
        (old) => {
          if (!old) return old;
          return {
            notifications: old.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: DRIVER_NOTIFICATIONS_QUERY_KEY });
    },
  });
}
