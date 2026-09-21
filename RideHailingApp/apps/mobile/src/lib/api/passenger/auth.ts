import { apiClient } from "@/lib/api-client";

export interface RegisterPassengerPayload {
  name: string;
  phone: string;
  email?: string;
  password: string;
}

export interface RegisterPassengerResponse {
  id: string;
  name: string;
  phone: string;
  email?: string;
  phoneVerified: boolean;
  profilePhotoUrl?: string;
  rating?: number;
  rideCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PassengerLoginPayload {
  identifier: string;
  password: string;
}

export interface PassengerLoginResponse {
  accessToken: string;
  refreshToken: string;
  role: "passenger" | "driver";
}

export interface OtpRequestPayload {
  phone: string;
}

export interface OtpRequestResponse {
  message: string;
}

export interface OtpVerifyPayload {
  phone: string;
  code: string;
}

export interface OtpVerifyResponse {
  verified: boolean;
}

export interface PasswordResetRequestPayload {
  identifier: string;
}

export interface PasswordResetRequestResponse {
  message: string;
}

export interface PasswordResetVerifyPayload {
  identifier: string;
  code: string;
}

export interface PasswordResetVerifyResponse {
  resetToken: string;
}

export interface PasswordResetConfirmPayload {
  resetToken: string;
  password: string;
}

export interface PasswordResetConfirmResponse {
  message: string;
}

export const passengerAuthApi = {
  register: async (payload: RegisterPassengerPayload): Promise<RegisterPassengerResponse> => {
    const { data } = await apiClient.post<RegisterPassengerResponse>(
      "/auth/register/passenger",
      payload,
    );
    return data;
  },

  login: async (payload: PassengerLoginPayload): Promise<PassengerLoginResponse> => {
    const { data } = await apiClient.post<PassengerLoginResponse>(
      "/auth/login",
      payload,
    );
    return data;
  },

  requestOtp: async (phone: string): Promise<OtpRequestResponse> => {
    const { data } = await apiClient.post<OtpRequestResponse>(
      "/auth/otp/request",
      { phone },
    );
    return data;
  },

  verifyOtp: async (payload: OtpVerifyPayload): Promise<OtpVerifyResponse> => {
    const { data } = await apiClient.post<OtpVerifyResponse>(
      "/auth/otp/verify",
      payload,
    );
    return data;
  },

  requestPasswordReset: async (identifier: string): Promise<PasswordResetRequestResponse> => {
    const { data } = await apiClient.post<PasswordResetRequestResponse>(
      "/auth/password-reset/request",
      { identifier },
    );
    return data;
  },

  verifyPasswordReset: async (payload: PasswordResetVerifyPayload): Promise<PasswordResetVerifyResponse> => {
    const { data } = await apiClient.post<PasswordResetVerifyResponse>(
      "/auth/password-reset/verify",
      payload,
    );
    return data;
  },

  confirmPasswordReset: async (payload: PasswordResetConfirmPayload): Promise<PasswordResetConfirmResponse> => {
    const { data } = await apiClient.post<PasswordResetConfirmResponse>(
      "/auth/password-reset/confirm",
      payload,
    );
    return data;
  },
};
