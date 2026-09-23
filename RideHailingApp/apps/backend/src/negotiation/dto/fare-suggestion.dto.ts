export interface AiFareSuggestionResponse {
  suggestedFare: number;
  currency: string;
  minBound: number;
  maxBound: number;
  confidence: number;
  reason: string;
  providerStatus: 'live' | 'fallback' | 'not_configured';
  isAdvisoryOnly: boolean;
}
