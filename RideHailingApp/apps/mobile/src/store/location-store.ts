import { create } from "zustand";
import { PermissionStatus } from "expo-location";
import {
  checkForegroundLocationPermission,
  Coordinates,
  getCurrentCoordinates,
  requestForegroundLocationPermission,
  startLocationSubscription,
} from "@/lib/location/location-service";
import { apiClient } from "@/lib/api-client";

let unsubscribeWatcher: (() => void) | null = null;
let lastSyncTimestamp = 0;
const MIN_SYNC_INTERVAL_MS = 10000; // 10s throttle for REST updates

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  permissionStatus: "granted" | "denied" | "undetermined";
  isTracking: boolean;
  error: string | null;

  checkPermission: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  fetchCurrentLocation: () => Promise<Coordinates | null>;
  startTracking: () => Promise<boolean>;
  stopTracking: () => void;
  syncLocationToBackend: (lat: number, lng: number) => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  latitude: null,
  longitude: null,
  accuracy: null,
  permissionStatus: "undetermined",
  isTracking: false,
  error: null,

  checkPermission: async () => {
    const status = await checkForegroundLocationPermission();
    const isGranted = status === PermissionStatus.GRANTED;
    set({
      permissionStatus: isGranted
        ? "granted"
        : status === PermissionStatus.DENIED
          ? "denied"
          : "undetermined",
    });
    return isGranted;
  },

  requestPermission: async () => {
    const status = await requestForegroundLocationPermission();
    const isGranted = status === PermissionStatus.GRANTED;
    set({
      permissionStatus: isGranted ? "granted" : "denied",
      error: isGranted ? null : "Location permission is required to go online.",
    });
    return isGranted;
  },

  fetchCurrentLocation: async () => {
    const coords = await getCurrentCoordinates();
    if (coords) {
      set({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        error: null,
      });
    }
    return coords;
  },

  syncLocationToBackend: async (latitude: number, longitude: number) => {
    const now = Date.now();
    if (now - lastSyncTimestamp < MIN_SYNC_INTERVAL_MS) {
      return;
    }
    lastSyncTimestamp = now;
    try {
      await apiClient.put("/drivers/me/location", { latitude, longitude });
    } catch {
      // Silently ignore background network errors during GPS subscription
    }
  },

  startTracking: async () => {
    let hasPerm = await get().checkPermission();
    if (!hasPerm) {
      hasPerm = await get().requestPermission();
    }
    if (!hasPerm) {
      return false;
    }

    if (unsubscribeWatcher) {
      unsubscribeWatcher();
      unsubscribeWatcher = null;
    }

    const initial = await get().fetchCurrentLocation();
    if (initial) {
      get().syncLocationToBackend(initial.latitude, initial.longitude);
    }

    const unsub = await startLocationSubscription(
      (coords) => {
        set({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          error: null,
        });
        get().syncLocationToBackend(coords.latitude, coords.longitude);
      },
      () => {
        set({ error: "Failed to subscribe to location updates" });
      },
    );

    if (unsub) {
      unsubscribeWatcher = unsub;
      set({ isTracking: true, error: null });
      return true;
    }
    return false;
  },

  stopTracking: () => {
    if (unsubscribeWatcher) {
      unsubscribeWatcher();
      unsubscribeWatcher = null;
    }
    set({ isTracking: false });
  },
}));
