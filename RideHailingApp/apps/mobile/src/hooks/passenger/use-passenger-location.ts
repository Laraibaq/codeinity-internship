import { useState, useCallback, useEffect } from "react";
import { PermissionStatus } from "expo-location";
import {
  checkForegroundLocationPermission,
  requestForegroundLocationPermission,
  getCurrentCoordinates,
  type Coordinates,
} from "@/lib/location/location-service";

export function usePassengerLocation() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      const status = await requestForegroundLocationPermission();
      setPermissionStatus(status);
      return status === PermissionStatus.GRANTED;
    } catch {
      setError("Failed to request location permission");
      return false;
    }
  }, []);

  const refreshLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const hasPermission = await checkForegroundLocationPermission();
      setPermissionStatus(hasPermission);

      if (hasPermission !== PermissionStatus.GRANTED) {
        const granted = await requestPermission();
        if (!granted) {
          setError("Location permission denied");
          setIsLoading(false);
          return null;
        }
      }

      const coords = await getCurrentCoordinates();
      setCoordinates(coords);
      return coords;
    } catch {
      setError("Failed to acquire current location");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [requestPermission]);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  return {
    coordinates,
    permissionStatus,
    isLoading,
    error,
    refreshLocation,
    requestPermission,
  };
}
