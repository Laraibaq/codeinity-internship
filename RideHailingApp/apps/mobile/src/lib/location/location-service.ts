import * as Location from "expo-location";
import {
  isMapboxConfigured,
  searchPlacesMapbox,
  type MapboxSearchResult,
} from "@/lib/api/passenger/mapbox";

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp?: number;
}

export interface GeocodedPlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
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
      timestamp: loc.timestamp,
    };
  } catch {
    // Fallback to last known position if fresh fix fails
    try {
      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        return {
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
          accuracy: last.coords.accuracy ?? null,
          timestamp: last.timestamp,
        };
      }
    } catch {
      // ignore
    }
    return null;
  }
}

import {
  searchPlacesNominatim,
  reverseGeocodeNominatim,
} from "@/lib/api/passenger/nominatim";

/**
 * Converts latitude and longitude into human-readable street and city address
 */
export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
): Promise<{ name: string; address: string }> {
  // Try Nominatim reverse geocode first for rich local address names
  try {
    const nominatimRev = await reverseGeocodeNominatim(latitude, longitude);
    if (nominatimRev && nominatimRev.name && nominatimRev.address) {
      return nominatimRev;
    }
  } catch {
    // fallback
  }

  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!results || results.length === 0) {
      return {
        name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        address: "Pinned Location",
      };
    }

    const first = results[0];
    const streetLine = [first.streetNumber, first.street || first.name]
      .filter(Boolean)
      .join(" ");
    const cityLine = [first.city || first.subregion, first.region]
      .filter(Boolean)
      .join(", ");

    const name = streetLine || first.name || "Pinned Location";
    const address = [streetLine, cityLine].filter(Boolean).join(", ") || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    return { name, address };
  } catch {
    return {
      name: "Pinned Location",
      address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
  }
}

/**
 * Searches for places via Nominatim (with Pakistan priority), Mapbox, or native device geocoding
 */
export async function searchPlaces(
  query: string,
  proximity?: { latitude: number; longitude: number },
): Promise<GeocodedPlace[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // 1. Try Nominatim (high precision for Pakistan landmarks, malls, airports, universities, cities)
  try {
    const osmResults = await searchPlacesNominatim(trimmed, proximity);
    if (osmResults.length > 0) {
      return osmResults;
    }
  } catch (err: any) {
    console.warn("Nominatim search error, trying fallback:", err.message);
  }

  // 2. Try Mapbox Places API if configured
  if (isMapboxConfigured()) {
    try {
      const mapboxResults = await searchPlacesMapbox(trimmed, proximity);
      if (mapboxResults.length > 0) {
        return mapboxResults;
      }
    } catch (err: any) {
      console.warn("Mapbox geocoding error, falling back to native geocoder:", err.message);
    }
  }

  // 3. Native expo-location geocoding fallback
  try {
    const geoResults = await Location.geocodeAsync(trimmed);
    if (!geoResults || geoResults.length === 0) {
      return [];
    }

    const places: GeocodedPlace[] = [];
    for (let i = 0; i < Math.min(geoResults.length, 5); i++) {
      const item = geoResults[i];
      const rev = await reverseGeocodeLocation(item.latitude, item.longitude);
      places.push({
        id: `geo-${i}-${item.latitude}-${item.longitude}`,
        name: rev.name || trimmed,
        address: rev.address,
        latitude: item.latitude,
        longitude: item.longitude,
      });
    }

    return places;
  } catch {
    return [];
  }
}

export async function startLocationSubscription(
  onLocation: (coords: Coordinates) => void,
  onError?: (err: unknown) => void,
  options?: {
    accuracy?: Location.Accuracy;
    timeInterval?: number;
    distanceInterval?: number;
  },
): Promise<(() => void) | null> {
  try {
    const perm = await checkForegroundLocationPermission();
    if (perm !== Location.PermissionStatus.GRANTED) {
      return null;
    }

    const sub = await Location.watchPositionAsync(
      {
        accuracy: options?.accuracy ?? Location.Accuracy.Balanced,
        timeInterval: options?.timeInterval ?? 10000,
        distanceInterval: options?.distanceInterval ?? 15,
      },
      (loc) => {
        onLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy ?? null,
          timestamp: loc.timestamp,
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
