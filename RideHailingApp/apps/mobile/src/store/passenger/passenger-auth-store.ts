import { create } from "zustand";
import { useAuthStore } from "@/store/auth-store";

export interface PassengerProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string;
  rating?: number;
}

export interface PassengerRegistrationDraft {
  name: string;
  phone: string;
  email?: string;
  password?: string;
  pendingTokens?: {
    accessToken: string;
    refreshToken: string;
  } | null;
}

export interface PassengerPasswordResetDraft {
  identifier: string;
  resetToken?: string;
}

export const passengerRegistrationDraft: PassengerRegistrationDraft = {
  name: "",
  phone: "",
  pendingTokens: null,
};

export const passengerPasswordResetDraft: PassengerPasswordResetDraft = {
  identifier: "",
};

export interface PassengerAuthState {
  profile: PassengerProfile | null;
  setProfile: (profile: PassengerProfile | null) => void;
  isPassenger: () => boolean;
  logoutPassenger: () => Promise<void>;
}

export const usePassengerAuthStore = create<PassengerAuthState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  isPassenger: () => {
    const auth = useAuthStore.getState();
    return auth.isAuthenticated && auth.role === "passenger";
  },
  logoutPassenger: async () => {
    set({ profile: null });
    passengerRegistrationDraft.pendingTokens = null;
    passengerRegistrationDraft.password = undefined;
    passengerPasswordResetDraft.resetToken = undefined;
    await useAuthStore.getState().logout();
  },
}));
