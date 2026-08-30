import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

// Base URL comes from an env var, not a hardcoded string, since it has to change for
// physical-device testing (localhost only resolves to the device itself, not this machine) -- see
// .env.example. EXPO_PUBLIC_-prefixed vars are inlined by Expo's Metro config at build time, no
// expo-constants/app.json plumbing needed.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

// Same key name settings.tsx's Sign Out already deletes (it was a placeholder guess made before
// any screen actually stored a token -- now it's real).
export const ACCESS_TOKEN_KEY = "driverAuthToken";
export const REFRESH_TOKEN_KEY = "driverRefreshToken";

export async function storeAuthTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearAuthTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export const apiClient = axios.create({ baseURL: API_BASE_URL });

// Forward-looking: no endpoint besides /auth/* exists yet, so this never actually fires today, but
// every future authenticated request will need the access token attached.
apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retriedAfterRefresh?: boolean;
}

// Forward-looking scaffolding, same reasoning as the request interceptor: once a real
// authenticated endpoint exists and its access token expires mid-session, this retries it once
// with a refreshed token before giving up. /auth/* itself is excluded -- a 401 from login/register
// (wrong password, bad OTP) means the credentials were wrong, not that the token expired.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retriedAfterRefresh ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post<{ accessToken: string }>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
      );
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.accessToken);

      originalRequest._retriedAfterRefresh = true;
      originalRequest.headers.set("Authorization", `Bearer ${data.accessToken}`);
      return apiClient(originalRequest);
    } catch {
      await clearAuthTokens();
      return Promise.reject(error);
    }
  },
);

// Every /auth/* failure response shares this shape (see backend AuthController's error responses).
export interface ApiErrorResponse {
  message: string | string[];
  error: string;
  statusCode: number;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error) && error.response) {
    const { message } = error.response.data;
    return Array.isArray(message) ? message[0] : message;
  }
  return fallback;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}
