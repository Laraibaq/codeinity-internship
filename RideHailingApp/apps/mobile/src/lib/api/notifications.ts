import { apiClient } from "@/lib/api-client";

let globalActiveDeviceToken: string | null = null;

export function setGlobalActiveDeviceToken(token: string | null) {
  globalActiveDeviceToken = token;
}

export function getGlobalActiveDeviceToken(): string | null {
  return globalActiveDeviceToken;
}

export interface RegisterDeviceTokenPayload {
  token: string;
  platform?: "ios" | "android" | "web";
}

export interface DeviceTokenResponse {
  success: boolean;
  id?: string;
  count?: number;
}

export async function registerDeviceToken(
  payload: RegisterDeviceTokenPayload,
): Promise<DeviceTokenResponse> {
  const { data } = await apiClient.post<DeviceTokenResponse>(
    "/notifications/device-token",
    payload,
  );
  if (data?.success) {
    setGlobalActiveDeviceToken(payload.token);
  }
  return data;
}

export async function removeDeviceToken(
  token: string,
): Promise<DeviceTokenResponse> {
  const { data } = await apiClient.delete<DeviceTokenResponse>(
    "/notifications/device-token",
    {
      data: { token },
    },
  );
  if (globalActiveDeviceToken === token) {
    setGlobalActiveDeviceToken(null);
  }
  return data;
}
