// Geographic center of Pakistan, used as the map fallback when no pickup, destination, or device
// location is available yet. Never used as a stand-in for a real user location.
export const PAKISTAN_CENTER = {
  latitude: 30.3753,
  longitude: 69.3451,
} as const;

export const PAKISTAN_DEFAULT_REGION = {
  latitude: PAKISTAN_CENTER.latitude,
  longitude: PAKISTAN_CENTER.longitude,
  latitudeDelta: 14,
  longitudeDelta: 14,
};
