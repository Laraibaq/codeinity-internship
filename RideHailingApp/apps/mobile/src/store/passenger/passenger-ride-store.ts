import { create } from "zustand";

export interface PassengerLocationPoint {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

export type PassengerRideStatus =
  | "idle"
  | "selecting_pickup"
  | "selecting_destination"
  | "offering_fare"
  | "waiting_for_drivers"
  | "driver_assigned"
  | "driver_arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface DriverOffer {
  id: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  driverPhotoUrl?: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor?: string;
  offeredFare: number;
  estimatedArrivalMinutes: number;
  distanceKm: number;
}

export interface PassengerRideState {
  currentLocation: PassengerLocationPoint | null;
  pickup: PassengerLocationPoint | null;
  destination: PassengerLocationPoint | null;
  routeCoordinates: { latitude: number; longitude: number }[] | null;
  proposedFare: number | null;
  estimatedDistanceKm: number | null;
  estimatedDurationMinutes: number | null;
  selectedRideType: string;
  currentRideId: string | null;
  createdRideId: string | null;
  rideStatus: PassengerRideStatus;
  isCreatingRide: boolean;
  createRideError: string | null;
  offers: DriverOffer[];
  selectedOffer: DriverOffer | null;

  setCurrentLocation: (point: PassengerLocationPoint | null) => void;
  setPickup: (point: PassengerLocationPoint | null) => void;
  setDestination: (point: PassengerLocationPoint | null) => void;
  setRoute: (
    distanceKm: number,
    durationMinutes: number,
    coords: { latitude: number; longitude: number }[],
  ) => void;
  setProposedFare: (fare: number | null) => void;
  setSelectedRideType: (type: string) => void;
  setRideStatus: (status: PassengerRideStatus) => void;
  setCurrentRideId: (rideId: string | null) => void;
  setCreatedRideId: (rideId: string | null) => void;
  setIsCreatingRide: (isCreating: boolean) => void;
  setCreateRideError: (error: string | null) => void;
  setOffers: (offers: DriverOffer[]) => void;
  selectOffer: (offer: DriverOffer | null) => void;
  resetDraft: () => void;
  resetRide: () => void;
}

const initialRideState = {
  currentLocation: null,
  pickup: null,
  destination: null,
  routeCoordinates: null,
  proposedFare: null,
  estimatedDistanceKm: null,
  estimatedDurationMinutes: null,
  selectedRideType: "standard",
  currentRideId: null,
  createdRideId: null,
  rideStatus: "idle" as PassengerRideStatus,
  isCreatingRide: false,
  createRideError: null,
  offers: [],
  selectedOffer: null,
};

export const usePassengerRideStore = create<PassengerRideState>((set) => ({
  ...initialRideState,

  setCurrentLocation: (currentLocation) => set({ currentLocation }),
  setPickup: (pickup) => set({ pickup }),
  setDestination: (destination) => set({ destination }),
  setRoute: (estimatedDistanceKm, estimatedDurationMinutes, routeCoordinates) =>
    set({
      estimatedDistanceKm,
      estimatedDurationMinutes,
      routeCoordinates,
    }),
  setProposedFare: (proposedFare) => set({ proposedFare }),
  setSelectedRideType: (selectedRideType) => set({ selectedRideType }),
  setRideStatus: (rideStatus) => set({ rideStatus }),
  setCurrentRideId: (currentRideId) =>
    set({ currentRideId, createdRideId: currentRideId }),
  setCreatedRideId: (createdRideId) =>
    set({ createdRideId, currentRideId: createdRideId }),
  setIsCreatingRide: (isCreatingRide) => set({ isCreatingRide }),
  setCreateRideError: (createRideError) => set({ createRideError }),
  setOffers: (offers) => set({ offers }),
  selectOffer: (selectedOffer) => set({ selectedOffer }),
  resetDraft: () =>
    set({
      pickup: null,
      destination: null,
      routeCoordinates: null,
      proposedFare: null,
      estimatedDistanceKm: null,
      estimatedDurationMinutes: null,
      selectedRideType: "standard",
      isCreatingRide: false,
      createRideError: null,
      offers: [],
      selectedOffer: null,
    }),
  resetRide: () => set(initialRideState),
}));
