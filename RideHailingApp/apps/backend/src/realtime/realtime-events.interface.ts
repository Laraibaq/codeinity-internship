export interface OfferCreatedEvent {
  rideId: string;
  offerId: string;
  driverId: string;
  status: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  proposedFare?: number;
  distanceKm?: number;
  etaMinutes?: number;
  expiresAt?: Date;
  driverName?: string;
  driverRating?: number;
  vehicleModel?: string;
  vehiclePlate?: string;
}

export interface OfferUpdatedEvent {
  rideId: string;
  offerId: string;
  driverId?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

export interface RideAcceptedEvent {
  rideId: string;
  driverId: string;
  status: 'accepted';
  finalFare?: number;
}

export interface RideStatusChangedEvent {
  rideId: string;
  status: string;
  timestamp?: string;
}

export interface DriverLocationUpdatedEvent {
  rideId: string;
  driverId: string;
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
}

export interface PaymentStatusChangedEvent {
  paymentId: string;
  rideId: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paidAt?: string;
}

export interface NegotiationOfferCreatedEvent {
  negotiationId: string;
  rideId: string;
  offerId: string;
  proposerId: string;
  recipientId: string;
  proposerRole: 'passenger' | 'driver';
  amount: number;
  currency: string;
  type: string;
  reason?: string;
  expiresAt: string;
}

export interface NegotiationAcceptedEvent {
  negotiationId: string;
  rideId: string;
  offerId: string;
  driverId: string;
  passengerId: string;
  finalFare: number;
  currency: string;
  acceptedAt: string;
}

export interface NegotiationRejectedEvent {
  negotiationId: string;
  rideId: string;
  rejectedBy: string;
  reason?: string;
}

