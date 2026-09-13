import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { useRideDetails } from "@/hooks/use-ride-history";
import { formatCurrency } from "@/utils/currency";
import { NativeMap } from "@/components/native-map";

function formatTimeOnly(dateString?: string | null): string | null {
  if (!dateString) return null;
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return null;
  }
}

// This source's own hardcoded example trip ($24.50 fare, 123 Market St -> 456 Embarcadero, base/
// distance/tip of $10/$12.50/$2) is kept as the fallback data below.
const DEFAULT_FARE = 24.5;
const DEFAULT_PICKUP = "123 Market St, San Francisco";
const DEFAULT_DROPOFF = "456 Embarcadero, San Francisco";
const DEFAULT_PICKUP_TIME = "10:15 AM";
const DEFAULT_DROPOFF_TIME = "10:40 AM";
// Source's own example breakdown is $10 base / $12.50 distance / $2 tip out of a $24.50 total --
// kept as ratios (not fixed dollar amounts) so the three lines still sum to whatever total fare a
// caller passes in, rather than visibly not adding up to it. This is a proportional split of the
// given total for display consistency, not real fare-computation logic (no such backend exists).
const BASE_FARE_RATIO = 10 / DEFAULT_FARE;
const DISTANCE_FARE_RATIO = 12.5 / DEFAULT_FARE;
const TIP_RATIO = 2 / DEFAULT_FARE;

// Source: "Ride Details" (Part 2). Reached from (tabs)/history.tsx's ride rows (previously inert
// with a TODO -- "no ride-detail screen ... built yet"), passing that row's own data as params; NOT
// wired from ride-completed.tsx, which has no "Ride Details" button/link on it at all, per explicit
// confirmation. A past-trip detail view fits browsing ride history more naturally than a
// just-finished trip anyway.
//
// history.tsx's row data (dateTime, pickup, dropoff, fare) doesn't cover everything this screen
// shows -- no passenger identity, distance/duration, or fare breakdown exists in that list. Those
// fields keep this source's own literal fallback values below (rule 5, UI shell only) regardless of
// which row was tapped; only fare/pickup/dropoff/pickup-time actually vary per row.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("arrow_back", "layers", "check_circle", "star", "mail", "location_on", "help") verified
//   against the installed glyph map.
// - The map preview's `bg-gradient-to-b from-transparent to-surface` fade (ensuring the overlapping
//   detail card below reads cleanly against the image) is functional, not decorative -- substituted
//   with `expo-linear-gradient`'s <LinearGradient>, same policy as this project's other load-bearing
//   gradients.
// - `-mt-8` (detail card overlapping the map preview) carries over directly -- NativeWind resolves
//   negative-margin utilities the same as positive ones.
// - `hover:*` / `group-hover:*` / `transition-*` dropped throughout: no hover state on touch
//   devices.
//
// Rule 5 approved presentation state / left inert (not guessed):
// - NativeMap renders real MapView with pickup and dropoff markers and route polyline.
// - The "layers" FAB (map layer options) is inert with a TODO: no alternate map layers exist yet.
// - The mail icon button (message passenger) is inert with a TODO: no in-app messaging screen
//   exists yet, same as this project's chat icons elsewhere.
// - "Help with this trip" is inert with a TODO: no help/support screen exists yet.
//
// Back arrow -> router.back(), per this batch's instructions.
//
// Fixed (Root Cause B of this batch): the map preview + detail card were in a plain View, not a
// ScrollView -- this is a genuinely long screen (map + earnings + passenger row + meta grid + route
// timeline + fare breakdown + help link), which was simply cut off below the fold on any device
// shorter than its full content height, with no way to reach it, and attempting to scroll it was
// instead triggering the OS's edge-swipe-back gesture.
export default function RideDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    rideId?: string;
    fare?: string;
    pickup?: string;
    dropoff?: string;
    dateTime?: string;
    pickupLat?: string;
    pickupLng?: string;
    dropoffLat?: string;
    dropoffLng?: string;
  }>();

  const { data: rideDetails } = useRideDetails(params.rideId);

  const rawFare = rideDetails
    ? (rideDetails.finalFare ?? rideDetails.proposedFare)
    : Number(params.fare);
  const fare = Number.isFinite(rawFare) && rawFare > 0 ? rawFare : DEFAULT_FARE;
  const pickupLabel = rideDetails?.pickupAddress || params.pickup || DEFAULT_PICKUP;
  const dropoffLabel = rideDetails?.dropoffAddress || params.dropoff || DEFAULT_DROPOFF;
  const pickupTimeLabel =
    formatTimeOnly(rideDetails?.startedAt || rideDetails?.requestedAt) ||
    params.dateTime ||
    DEFAULT_PICKUP_TIME;
  const dropoffTimeLabel =
    formatTimeOnly(rideDetails?.completedAt) ||
    DEFAULT_DROPOFF_TIME;

  const baseFare = fare * BASE_FARE_RATIO;
  const distanceFare = fare * DISTANCE_FARE_RATIO;
  const tipFare = fare * TIP_RATIO;

  const parsedPickupLat =
    rideDetails?.pickupLat ?? (params.pickupLat ? Number(params.pickupLat) : NaN);
  const parsedPickupLng =
    rideDetails?.pickupLng ?? (params.pickupLng ? Number(params.pickupLng) : NaN);
  const pickupPoint =
    Number.isFinite(parsedPickupLat) && Number.isFinite(parsedPickupLng)
      ? {
          latitude: parsedPickupLat,
          longitude: parsedPickupLng,
          title: pickupLabel,
        }
      : null;

  const parsedDropoffLat =
    rideDetails?.dropoffLat ?? (params.dropoffLat ? Number(params.dropoffLat) : NaN);
  const parsedDropoffLng =
    rideDetails?.dropoffLng ?? (params.dropoffLng ? Number(params.dropoffLng) : NaN);
  const dropoffPoint =
    Number.isFinite(parsedDropoffLat) && Number.isFinite(parsedDropoffLng)
      ? {
          latitude: parsedDropoffLat,
          longitude: parsedDropoffLng,
          title: dropoffLabel,
        }
      : null;

  const passengerName = rideDetails?.passenger?.name || "Sarah J.";
  const passengerRating = rideDetails?.passenger?.rating
    ? rideDetails.passenger.rating.toFixed(1)
    : "4.9";
  const passengerPhoto =
    rideDetails?.passenger?.profilePhotoUrl ||
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCqrQ_c8klcWjtubHBOG1chwzpb2NDyEx1-MtQrqckZsGEj4uhTs-QMBa9-0Buh69QT8-rMQxx_Hj_lwZqkaA4VYhn-sgUQ-_AnRa0hSe7Hd68FWc2eh4Oshz1dd2KY2Bmefgo4eJzyVMk0KKySrAO6aUxDLwwS6FZ2oFZPKAqk7SOdLOjS6uGaRkX9LlO-YH5-WzAGVx3WwuU32XfQ5SzvwYo86m0cKTzf4UAYb9kNEfD65s671Ec8";

  const distanceText = rideDetails?.distanceKm
    ? `${Number(rideDetails.distanceKm).toFixed(1)} km`
    : "3.2 mi";
  const durationText = rideDetails?.etaMinutes
    ? `${rideDetails.etaMinutes} min`
    : "25 min";

  return (
    <View className="flex-1 items-center bg-background">
      <View style={{ paddingTop: insets.top }} className="z-50 w-full bg-surface shadow-sm">
        <View className="mx-auto w-full max-w-md flex-row items-center justify-between px-container-margin py-base">
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurfaceVariant} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Ride Details
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="w-full max-w-md flex-1"
        contentContainerClassName="pb-stack-lg"
      >
        <View className="relative h-64 w-full overflow-hidden bg-surface-container-high">
          <NativeMap
            pickup={pickupPoint}
            dropoff={dropoffPoint}
            showsRoutePolyline={true}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={["transparent", themeColors.surface]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.9 }}
            pointerEvents="none"
          />
          {/* TODO: no alternate map layers exist yet. */}
          <Pressable className="absolute right-4 top-4 items-center justify-center rounded-full bg-surface p-2 shadow-sm active:scale-95">
            <MaterialIcons name="layers" size={20} color={themeColors.primary} />
          </Pressable>
        </View>

        <View className="relative z-10 -mt-8 px-container-margin">
          <View className="gap-stack-md rounded-xl border border-outline-variant bg-surface p-stack-md shadow-lg">
            <View className="items-center border-b border-surface-container-highest pb-stack-sm">
              <Text className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Total Earnings
              </Text>
              <Text className="font-display-lg text-display-lg text-on-surface">
                {formatCurrency(fare)}
              </Text>
              <View className="mt-2 flex-row items-center gap-1 rounded-full bg-surface-container-low px-3 py-1">
                <MaterialIcons
                  name={rideDetails?.status === "cancelled" ? "cancel" : "check-circle"}
                  size={16}
                  color={rideDetails?.status === "cancelled" ? "#be123c" : themeColors.primary}
                />
                <Text
                  className="font-label-sm text-label-sm"
                  style={{
                    color: rideDetails?.status === "cancelled" ? "#be123c" : themeColors.primary,
                  }}
                >
                  {rideDetails?.status === "cancelled" ? "Cancelled" : "Completed"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4 py-2">
              <View className="h-12 w-12 overflow-hidden rounded-full border-2 border-surface bg-surface-container-high">
                <Image
                  source={{ uri: passengerPhoto }}
                  resizeMode="cover"
                  className="h-full w-full"
                />
              </View>
              <View className="flex-1">
                <Text className="font-body-md text-body-md font-bold text-on-surface">
                  {passengerName}
                </Text>
                <View className="flex-row items-center gap-1">
                  <MaterialIcons name="star" size={14} color="#f59e0b" />
                  <Text className="font-label-sm text-label-sm text-secondary">{passengerRating}</Text>
                </View>
              </View>
              {/* TODO: no in-app messaging screen exists yet. */}
              <Pressable className="items-center justify-center rounded-full bg-surface-container p-2 active:scale-95">
                <MaterialIcons name="mail" size={20} color={themeColors.primary} />
              </Pressable>
            </View>

            <View className="flex-row gap-gutter rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-sm">
              <View className="flex-1">
                <Text className="font-label-sm text-label-sm text-on-surface-variant">
                  Distance
                </Text>
                <Text className="font-body-md text-body-md font-semibold text-on-surface">
                  {distanceText}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-label-sm text-label-sm text-on-surface-variant">
                  Duration
                </Text>
                <Text className="font-body-md text-body-md font-semibold text-on-surface">
                  {durationText}
                </Text>
              </View>
            </View>

            <View className="relative gap-4 py-2">
              <View className="absolute bottom-4 left-[11px] top-4 w-0.5 bg-surface-container-highest" />
              <View className="relative z-10 flex-row items-start gap-4">
                <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-surface-container">
                  <View className="h-2 w-2 rounded-full bg-primary" />
                </View>
                <View className="flex-1">
                  <Text className="font-body-md text-body-md font-semibold text-on-surface">
                    {pickupTimeLabel}
                  </Text>
                  <Text className="font-label-sm text-label-sm text-on-surface-variant">
                    {pickupLabel}
                  </Text>
                </View>
              </View>
              <View className="relative z-10 flex-row items-start gap-4">
                <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-on-surface">
                  <MaterialIcons name="location-on" size={14} color={themeColors.surface} />
                </View>
                <View className="flex-1">
                  <Text className="font-body-md text-body-md font-semibold text-on-surface">
                    {dropoffTimeLabel}
                  </Text>
                  <Text className="font-label-sm text-label-sm text-on-surface-variant">
                    {dropoffLabel}
                  </Text>
                </View>
              </View>
            </View>

            <View className="gap-3 border-t border-surface-container-highest pt-stack-sm">
              <Text className="mb-1 font-body-md text-body-md font-bold text-on-surface">
                Fare Breakdown
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="font-body-md text-body-md text-on-surface-variant">Base Fare</Text>
                <Text className="font-body-md text-body-md text-on-surface-variant">
                  {formatCurrency(baseFare)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="font-body-md text-body-md text-on-surface-variant">Distance</Text>
                <Text className="font-body-md text-body-md text-on-surface-variant">
                  {formatCurrency(distanceFare)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="font-body-md text-body-md text-on-surface-variant">Tip</Text>
                <Text className="font-body-md text-body-md font-semibold text-primary">
                  {formatCurrency(tipFare)}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-center border-t border-surface-container-highest pt-stack-sm">
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(driver)/(drawer)/help-center",
                    params: params.rideId ? { rideId: params.rideId } : undefined,
                  })
                }
                className="flex-row items-center gap-2 p-2 active:scale-95"
              >
                <MaterialIcons name="help" size={20} color={themeColors.primary} />
                <Text className="font-body-md text-body-md font-semibold text-primary">
                  Help with this trip
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
