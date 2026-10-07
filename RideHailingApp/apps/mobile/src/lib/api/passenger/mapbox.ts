import axios from "axios";
import type { PassengerLocationPoint } from "@/store/passenger/passenger-ride-store";

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() || "";

export function isMapboxConfigured(): boolean {
  return MAPBOX_ACCESS_TOKEN.length > 0 && !MAPBOX_ACCESS_TOKEN.includes("dummy");
}

export function getMapboxToken(): string {
  return MAPBOX_ACCESS_TOKEN;
}

export interface MapboxSearchResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
}

export interface MapboxRouteInfo {
  distanceKm: number;
  durationMinutes: number;
  geometry: { latitude: number; longitude: number }[];
  isEstimatedFallback?: boolean;
}

/**
 * Calculates straight-line geodesic distance in kilometers between two coordinates
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Generates an estimated driving route when Mapbox Directions API is unavailable
 */
export function calculateEstimatedRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
): MapboxRouteInfo {
  const straightDist = calculateHaversineDistanceKm(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude,
  );

  // Urban road grid factor (~1.28x direct distance)
  const drivingDistanceKm = Number((straightDist * 1.28).toFixed(1));

  // Average city driving speed ~30 km/h plus 2 min traffic margin
  const durationMinutes = Math.max(3, Math.round((drivingDistanceKm / 30) * 60) + 2);

  // Generate 8-point interpolated path for visual polyline
  const geometry: { latitude: number; longitude: number }[] = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const factor = i / steps;
    // Slight lateral curve based on sine
    const curveOffset = Math.sin(factor * Math.PI) * 0.0018;
    geometry.push({
      latitude: origin.latitude + (destination.latitude - origin.latitude) * factor + curveOffset,
      longitude: origin.longitude + (destination.longitude - origin.longitude) * factor - curveOffset,
    });
  }

  return {
    distanceKm: drivingDistanceKm,
    durationMinutes,
    geometry,
    isEstimatedFallback: true,
  };
}

/**
 * Searches places using Mapbox Places Geocoding API
 */
export async function searchPlacesMapbox(
  query: string,
  proximity?: { latitude: number; longitude: number },
): Promise<MapboxSearchResult[]> {
  if (!isMapboxConfigured()) {
    throw new Error("BLOCKED: Mapbox token is not configured");
  }

  const trimmed = query.trim();
  if (!trimmed) return [];

  // Check if proximity is in Pakistan (lat 23.5-37.5, lon 60.5-78.0)
  const isPkProximity =
    proximity &&
    proximity.latitude >= 23.5 &&
    proximity.latitude <= 37.5 &&
    proximity.longitude >= 60.5 &&
    proximity.longitude <= 78.0;

  let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    trimmed,
  )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true&types=address,poi,neighborhood,place,locality`;

  // Always bias to Pakistan for ride hailing app unless specific foreign query
  url += `&country=pk`;

  if (isPkProximity) {
    url += `&proximity=${proximity.longitude},${proximity.latitude}`;
  }

  const res = await axios.get(url, { timeout: 8000 });
  const features = res.data?.features || [];

  return features.map((f: any) => {
    const [lon, lat] = f.center || [0, 0];
    const dist = isPkProximity
      ? calculateHaversineDistanceKm(proximity.latitude, proximity.longitude, lat, lon)
      : undefined;

    return {
      id: f.id,
      name: f.text || f.place_name?.split(",")[0] || trimmed,
      address: f.place_name || trimmed,
      latitude: lat,
      longitude: lon,
      distanceKm: dist,
    };
  });
}

/**
 * Fetches driving route from Mapbox Directions API
 */
export async function getDirectionsMapbox(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
): Promise<MapboxRouteInfo> {
  if (!isMapboxConfigured()) {
    return calculateEstimatedRoute(origin, destination);
  }

  try {
    const coordsStr = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsStr}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`;

    const res = await axios.get(url, { timeout: 10000 });
    const route = res.data?.routes?.[0];

    if (!route || !route.geometry?.coordinates) {
      return calculateEstimatedRoute(origin, destination);
    }

    const distanceKm = Number((route.distance / 1000).toFixed(1));
    const durationMinutes = Math.max(1, Math.round(route.duration / 60));

    const geometry = route.geometry.coordinates.map(([lon, lat]: [number, number]) => ({
      latitude: lat,
      longitude: lon,
    }));

    return {
      distanceKm,
      durationMinutes,
      geometry,
      isEstimatedFallback: false,
    };
  } catch {
    // Fallback to computed route on network or Mapbox error
    return calculateEstimatedRoute(origin, destination);
  }
}
