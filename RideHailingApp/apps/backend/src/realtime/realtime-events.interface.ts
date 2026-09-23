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
}

export interface DriverLocationUpdatedEvent {
  rideId: string;
  driverId: string;
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
}

