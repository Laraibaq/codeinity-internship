import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { DRIVER_NOTIFICATIONS_QUERY_KEY } from "./use-notifications";

export interface FaqItemData {
  question: string;
  answer: string;
}

export interface SupportTicketItem {
  id: string;
  driverId: string;
  rideId?: string | null;
  category: "ride" | "account" | "vehicle_document" | "technical" | "safety" | "other";
  subject: string;
  description: string;
  status: "open" | "resolved";
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportTicketPayload {
  category: "ride" | "account" | "vehicle_document" | "technical" | "safety" | "other";
  subject: string;
  description: string;
  rideId?: string;
}

export const SUPPORT_FAQS_QUERY_KEY = ["support", "faqs"];
export const DRIVER_SUPPORT_TICKETS_QUERY_KEY = ["driver", "support-tickets"];

export function useSupportFaqs() {
  return useQuery<FaqItemData[]>({
    queryKey: SUPPORT_FAQS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<FaqItemData[]>("/support/faqs");
      return res.data;
    },
    staleTime: 60000,
  });
}

export function useDriverSupportTickets() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<SupportTicketItem[]>({
    queryKey: DRIVER_SUPPORT_TICKETS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<SupportTicketItem[]>("/support/tickets");
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });
}

export function useSubmitSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSupportTicketPayload) => {
      const res = await apiClient.post<SupportTicketItem>("/support/tickets", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVER_SUPPORT_TICKETS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DRIVER_NOTIFICATIONS_QUERY_KEY });
    },
  });
}
