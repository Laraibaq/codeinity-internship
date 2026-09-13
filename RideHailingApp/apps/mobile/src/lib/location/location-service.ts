import * as Location from "expo-location";

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export async function requestForegroundLocationPermission(): Promise<Location.PermissionStatus> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status;
  } catch {
    return Location.PermissionStatus.DENIED;
  }
}

export async function checkForegroundLocationPermission(): Promise<Location.PermissionStatus> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status;
  } catch {
    return Location.PermissionStatus.DENIED;
  }
}

export async function getCurrentCoordinates(): Promise<Coordinates | null> {
  try {
    const perm = await checkForegroundLocationPermission();
    if (perm !== Location.PermissionStatus.GRANTED) {
      return null;
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy ?? null,
    };
  } catch {
    // Attempt fallback to last known position if fresh fix fails
    try {
      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        return {
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
          accuracy: last.coords.accuracy ?? null,
        };
      }
    } catch {
      // ignore
    }
    return null;
  }
}

export async function startLocationSubscription(
  onLocation: (coords: Coordinates) => void,
  onError?: (err: unknown) => void,
): Promise<(() => void) | null> {
  try {
    const perm = await checkForegroundLocationPermission();
    if (perm !== Location.PermissionStatus.GRANTED) {
      return null;
    }

    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // 10s battery-conscious sampling
        distanceInterval: 15, // 15m minimum displacement
      },
      (loc) => {
        onLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy ?? null,
        });
      },
    );

    return () => {
      sub.remove();
    };
  } catch (err) {
    if (onError) onError(err);
    return null;
  }
}
