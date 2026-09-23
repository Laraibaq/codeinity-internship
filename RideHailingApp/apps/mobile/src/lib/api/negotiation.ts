import { apiClient } from '../api-client';

export interface NegotiationOfferItem {
  id: string;
  negotiationId: string;
  rideId: string;
  proposerId: string;
  recipientId: string;
  amount: number | string;
  type: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'superseded';
  reason?: string;
  expiresAt: string;
  createdAt: string;
}

export interface NegotiationSession {
  id: string;
  rideId: string;
  driverId: string;
  passengerId: string;
  status: 'active' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  currentAmount: number | string;
  currentProposerId: string;
  acceptedAt?: string;
  expiresAt: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating?: number;
    vehicle?: any;
  };
  offers: NegotiationOfferItem[];
}

export interface AiFareSuggestion {
  suggestedFare: number;
  currency: string;
  minBound: number;
  maxBound: number;
  confidence: number;
  reason: string;
  providerStatus: 'live' | 'fallback' | 'not_configured';
  isAdvisoryOnly: boolean;
}

export const negotiationApi = {
  getNegotiations: async (rideId: string): Promise<NegotiationSession[]> => {
    const { data } = await apiClient.get<NegotiationSession[]>(`/rides/${rideId}/negotiation`);
    return data;
  },

  driverCounter: async (
    rideId: string,
    offerAmount: number,
    reason?: string,
    idempotencyKey?: string,
  ): Promise<NegotiationOfferItem> => {
    const { data } = await apiClient.post<NegotiationOfferItem>(
      `/rides/${rideId}/negotiation/driver-counter`,
      { offerAmount, reason, idempotencyKey },
    );
    return data;
  },

  passengerCounter: async (
    rideId: string,
    driverId: string,
    offerAmount: number,
    reason?: string,
    idempotencyKey?: string,
  ): Promise<NegotiationOfferItem> => {
    const { data } = await apiClient.post<NegotiationOfferItem>(
      `/rides/${rideId}/negotiation/passenger-counter`,
      { driverId, offerAmount, reason, idempotencyKey },
    );
    return data;
  },

  acceptNegotiation: async (
    rideId: string,
    offerId: string,
  ): Promise<{ offer: NegotiationOfferItem; ride: any }> => {
    const { data } = await apiClient.post<{ offer: NegotiationOfferItem; ride: any }>(
      `/rides/${rideId}/negotiation/accept/${offerId}`,
    );
    return data;
  },

  rejectNegotiation: async (
    rideId: string,
    negotiationId: string,
  ): Promise<{ success: boolean; status: string }> => {
    const { data } = await apiClient.post<{ success: boolean; status: string }>(
      `/rides/${rideId}/negotiation/reject/${negotiationId}`,
    );
    return data;
  },

  getFareSuggestion: async (rideId: string): Promise<AiFareSuggestion> => {
    const { data } = await apiClient.post<AiFareSuggestion>(
      `/rides/${rideId}/negotiation/suggestion`,
    );
    return data;
  },
};
