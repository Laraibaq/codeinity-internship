import { apiClient } from '../api-client';

export type PaymentMethodType = 'cash' | 'wallet' | 'card';
export type PaymentStatusType =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export interface PaymentRecord {
  id: string;
  rideId: string;
  passengerId: string;
  driverId: string;
  amount: string | number;
  currency: string;
  paymentMethod: PaymentMethodType;
  status: PaymentStatusType;
  provider?: string | null;
  providerPaymentId?: string | null;
  failureReason?: string | null;
  refundedAmount?: string | number;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RidePaymentResponse {
  rideId: string;
  authoritativeFare: string | number;
  currency: string;
  rideStatus: string;
  payment: PaymentRecord | null;
}

export interface WalletRecord {
  id: string;
  userId: string;
  userRole: string;
  balance: string | number;
  currency: string;
}

export interface WalletTransactionRecord {
  id: string;
  walletId: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: string | number;
  currency: string;
  referenceType: string;
  referenceId?: string | null;
  balanceBefore: string | number;
  balanceAfter: string | number;
  description?: string | null;
  createdAt: string;
}

export interface InitiatePaymentPayload {
  rideId: string;
  paymentMethod: PaymentMethodType;
  idempotencyKey?: string;
}

export interface ConfirmPaymentPayload {
  providerPaymentId?: string;
  idempotencyKey?: string;
}

export const paymentsApi = {
  async initiatePayment(payload: InitiatePaymentPayload): Promise<PaymentRecord> {
    const { data } = await apiClient.post<PaymentRecord>('/payments/initiate', payload);
    return data;
  },

  async confirmPayment(
    paymentId: string,
    payload?: ConfirmPaymentPayload,
  ): Promise<{ payment: PaymentRecord; isAlreadyConfirmed: boolean }> {
    const { data } = await apiClient.post<{ payment: PaymentRecord; isAlreadyConfirmed: boolean }>(
      `/payments/${paymentId}/confirm`,
      payload || {},
    );
    return data;
  },

  async getRidePayment(rideId: string): Promise<RidePaymentResponse> {
    const { data } = await apiClient.get<RidePaymentResponse>(`/payments/ride/${rideId}`);
    return data;
  },

  async getMyWallet(): Promise<WalletRecord> {
    const { data } = await apiClient.get<WalletRecord>('/wallet/me');
    return data;
  },

  async getWalletTransactions(limit = 20, offset = 0): Promise<{
    transactions: WalletTransactionRecord[];
    total: number;
  }> {
    const { data } = await apiClient.get<{
      transactions: WalletTransactionRecord[];
      total: number;
    }>('/wallet/transactions', { params: { limit, offset } });
    return data;
  },
};
