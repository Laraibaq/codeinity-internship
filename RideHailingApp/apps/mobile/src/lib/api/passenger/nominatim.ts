import axios from "axios";
import { calculateHaversineDistanceKm } from "./mapbox";

export interface NominatimPlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "RideHailingApp-Pakistan/1.0 (support@ridehailing.pk)";

// Pakistan approximate bounding box
const PK_BOUNDS = {
  minLat: 23.5,
  maxLat: 37.5,
  minLon: 60.5,
  maxLon: 78.0,
};

export function isCoordinatesInPakistan(lat: number, lon: number): boolean {
  return (
    lat >= PK_BOUNDS.minLat &&
    lat <= PK_BOUNDS.maxLat &&
    lon >= PK_BOUNDS.minLon &&
    lon <= PK_BOUNDS.maxLon
  );
}

/**
 * Searches places via OpenStreetMap Nominatim API, tailored for Pakistan accuracy
 */
export async function searchPlacesNominatim(
  query: string,
  proximity?: { latitude: number; longitude: number },
): Promise<NominatimPlace[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    // Search with countrycodes=pk for high-precision Pakistan geocoding
    const params: Record<string, string> = {
      q: trimmed,
      format: "json",
      addressdetails: "1",
      limit: "8",
      countrycodes: "pk",
    };

    const res = await axios.get<any[]>(`${NOMINATIM_BASE}/search`, {
      params,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en,ur",
      },
      timeout: 8000,
    });

    let data = res.data || [];

    // If no results found with countrycodes=pk, fallback to global search
    if (data.length === 0) {
      delete params.countrycodes;
      const fallbackRes = await axios.get<any[]>(`${NOMINATIM_BASE}/search`, {
        params,
        headers: {
          "User-Agent": USER_AGENT,
          "Accept-Language": "en,ur",
        },
        timeout: 8000,
      });
      data = fallbackRes.data || [];
    }

    return data
      .filter((item) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
      })
      .map((item) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const displayName = item.display_name || "";
        const parts = displayName.split(",").map((s: string) => s.trim());
        const primaryName = item.name || parts[0] || trimmed;

        let distanceKm: number | undefined;
        if (proximity && isCoordinatesInPakistan(proximity.latitude, proximity.longitude)) {
          distanceKm = calculateHaversineDistanceKm(
            proximity.latitude,
            proximity.longitude,
            lat,
            lon,
          );
        }

        return {
          id: `osm-${item.place_id || item.osm_id}`,
          name: primaryName,
          address: displayName,
          latitude: lat,
          longitude: lon,
          distanceKm,
        };
      });
  } catch (err: any) {
    console.warn("Nominatim geocoding error:", err.message);
    return [];
  }
}

/**
 * Reverse geocodes coordinates to street & locality via Nominatim
 */
export async function reverseGeocodeNominatim(
  latitude: number,
  longitude: number,
): Promise<{ name: string; address: string } | null> {
  try {
    const res = await axios.get(`${NOMINATIM_BASE}/reverse`, {
      params: {
        lat: latitude,
        lon: longitude,
        format: "json",
        addressdetails: "1",
      },
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en,ur",
      },
      timeout: 8000,
    });

    const item = res.data;
    if (!item) return null;

    const displayName = item.display_name || "";
    const parts = displayName.split(",").map((s: string) => s.trim());
    const name = item.name || parts[0] || "Pinned Location";

    return {
      name,
      address: displayName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    };
  } catch {
    return null;
  }
}
