import { create } from "zustand";
import {
  clearAuthTokens,
  getAccessToken,
  getAuthUser,
  getRefreshToken,
  storeAuthTokens,
  storeAuthUser,
  type StoredAuthUser,
} from "@/lib/api-client";
import {
  getGlobalActiveDeviceToken,
  removeDeviceToken,
} from "@/lib/api/notifications";

export type AuthRole = "driver" | "passenger";
export type DriverVerificationStatus = "pending" | "approved" | "rejected";

export interface LoginPayload {
  accessToken: string;
  refreshToken: string;
  role: AuthRole;
  verificationStatus?: DriverVerificationStatus;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: AuthRole | null;
  verificationStatus: DriverVerificationStatus | null;
  isAuthenticated: boolean;
  isHydrating: boolean;

  hydrate: () => Promise<void>;
  login: (data: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  setVerificationStatus: (status: DriverVerificationStatus) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  role: null,
  verificationStatus: null,
  isAuthenticated: false,
  isHydrating: true,

  hydrate: async () => {
    try {
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();
      const user = await getAuthUser();

      if (accessToken && user) {
        set({
          accessToken,
          refreshToken,
          role: user.role,
          verificationStatus: user.verificationStatus ?? null,
          isAuthenticated: true,
          isHydrating: false,
        });
      } else {
        set({
          accessToken: null,
          refreshToken: null,
          role: null,
          verificationStatus: null,
          isAuthenticated: false,
          isHydrating: false,
        });
      }
    } catch {
      set({
        accessToken: null,
        refreshToken: null,
        role: null,
        verificationStatus: null,
        isAuthenticated: false,
        isHydrating: false,
      });
    }
  },

  login: async (data: LoginPayload) => {
    const user: StoredAuthUser = {
      role: data.role,
      verificationStatus: data.verificationStatus,
    };
    await storeAuthTokens(data.accessToken, data.refreshToken, user);
    set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      role: data.role,
      verificationStatus: data.verificationStatus ?? null,
      isAuthenticated: true,
      isHydrating: false,
    });
  },

  logout: async () => {
    try {
      const activeToken = getGlobalActiveDeviceToken();
      if (activeToken) {
        await removeDeviceToken(activeToken).catch(() => {});
      }
    } catch {
      // Ignore network errors on logout cleanup
    }
    await clearAuthTokens();
    set({
      accessToken: null,
      refreshToken: null,
      role: null,
      verificationStatus: null,
      isAuthenticated: false,
      isHydrating: false,
    });
  },

  setVerificationStatus: async (status: DriverVerificationStatus) => {
    const currentRole = get().role;
    if (currentRole) {
      await storeAuthUser({ role: currentRole, verificationStatus: status });
    }
    set({ verificationStatus: status });
  },
}));
