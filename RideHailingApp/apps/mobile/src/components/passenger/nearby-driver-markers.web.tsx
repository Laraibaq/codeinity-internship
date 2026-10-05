import type { NearbyDriver } from "@/lib/api/passenger/nearby-drivers";

// react-native-maps has no web build; the web PassengerMap placeholder draws no markers.
export function NearbyDriverMarkers(_props: { drivers: NearbyDriver[] }) {
  return null;
}
