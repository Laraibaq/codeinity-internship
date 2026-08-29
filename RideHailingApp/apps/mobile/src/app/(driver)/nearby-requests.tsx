import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { formatCurrency } from "@/utils/currency";

type RequestRow = {
  id: string;
  badge?: { label: string; tone: "surge" | "comfort" };
  timeAway: string;
  fare: number;
  accentPrimary?: boolean;
  pickup: { label: string; meta: string };
  dropoff: { label: string; meta: string };
};

const initialRequests: RequestRow[] = [
  {
    id: "1",
    badge: { label: "Surge +1.5x", tone: "surge" },
    timeAway: "2 min away",
    fare: 24.5,
    accentPrimary: true,
    pickup: { label: "1428 Elm Street", meta: "Pickup • 0.8 mi" },
    dropoff: { label: "SFO International Airport", meta: "Dropoff • 12.4 mi" },
  },
  {
    id: "2",
    timeAway: "5 min away",
    fare: 12.0,
    pickup: { label: "Blue Bottle Coffee", meta: "Pickup • 1.2 mi" },
    dropoff: { label: "Transamerica Pyramid", meta: "Dropoff • 3.1 mi" },
  },
  {
    id: "3",
    badge: { label: "Comfort", tone: "comfort" },
    timeAway: "8 min away",
    fare: 38.75,
    pickup: { label: "Palace Hotel", meta: "Pickup • 2.5 mi" },
    dropoff: { label: "Stanford University", meta: "Dropoff • 28.4 mi" },
  },
];

// Source: "Nearby Ride Requests" (Part 5). Regular pushed screen. No screen currently links here
// yet -- dashboard.tsx's online state now has a small badge/button added for this (see that file's
// header comment), since nothing in the ride-flow otherwise reaches it.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("arrow_back", "schedule", "close", "map") verified against the installed glyph map.
// - The desktop header, desktop "Map View" toggle, and desktop side-nav (`hidden md:flex` /
//   `md:flex flex-col ... w-24 h-screen fixed`) are dropped entirely, same treatment as every other
//   screen in this project with a mobile/desktop split.
// - The mobile bottom-nav-bar markup from the source is NOT reproduced: this screen is a pushed
//   Stack screen OUTSIDE the (tabs) group (like settings.tsx/safety-center.tsx), not a 5th real
//   tab, so it would render as inert dead chrome duplicating the real Tabs navigator -- same
//   explicit correction already applied to safety-center.tsx. The header's back arrow is this
//   screen's only navigation.
// - `grid md:grid-cols-2` (request list) resolves to a single stacked column on a native phone
//   screen, same substitution used throughout this project for this grid pattern.
// - `hover:*` / `group-hover:*` / `transition-*` / `duration-*` / `cursor-pointer` dropped
//   throughout: no hover state on touch devices.
//
// Rule 5 approved presentation state / left inert (not guessed):
// - The "12 active requests" count is computed from the live `requests` list length instead of
//   reproducing the source's literal "12" -- the source only ever renders 3 cards, so its own
//   hardcoded "12" already contradicts its own content; a static wrong number that also doesn't
//   shrink as rows get dismissed below would be a more visible bug than deriving it from the list
//   that's actually driving this screen's own new interactive behavior.
// - The mobile "Map" toggle button is inert with a TODO: no map view of these requests exists yet.
//
// Each row's "Accept" -> navigate-to-pickup.tsx directly (skipping any detail screen), matching
// ride-request-notification.tsx and ride-request-detail.tsx's Accept buttons. All three used to go
// through passenger-accepted.tsx, a celebratory hand-off screen, first; that screen has been deleted
// and its content folded into navigate-to-pickup.tsx's bottom sheet's collapsed "peek" state instead.
// Each row's "X" removes that row from local state only -- no backend call exists to actually
// decline a nearby request yet.
// Back arrow -> router.back().
export default function NearbyRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState(initialRequests);

  return (
    <View className="flex-1 bg-background">
      <View
        style={{ paddingTop: insets.top }}
        className="z-50 w-full border-b border-outline-variant/30 bg-surface"
      >
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          <Pressable
            onPress={() => router.back()}
            className="-ml-2 items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Requests
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="z-40 flex-row items-center justify-between border-b border-outline-variant/20 bg-surface px-container-margin py-3">
        <Text className="font-body-md text-body-md font-semibold text-on-surface">
          {requests.length} active requests
        </Text>
        {/* TODO: no map view of these requests exists yet. */}
        <Pressable className="flex-row items-center gap-1.5 rounded-full bg-primary-container px-3 py-1.5 active:scale-95">
          <MaterialIcons name="map" size={18} color={themeColors.onPrimaryContainer} />
          <Text className="font-label-sm text-label-sm text-on-primary-container">Map</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 bg-surface-container-lowest"
        contentContainerClassName="gap-stack-sm px-container-margin py-stack-md"
      >
        {requests.map((request) => (
          // Fixed: every conditionally-toggled Tailwind class below (border color, badge
          // background/text, fare text color, and the Accept button's background/shadow/text) used
          // to be interpolated into a template-literal className based on `request.accentPrimary` /
          // `request.badge.tone`. Same NativeWind runtime anti-pattern root-caused on login.tsx's
          // phone/email toggle (a conditionally-shaped className triggers a lazy component "upgrade"
          // + remount that crashes native navigation). Every className below is now static; each
          // state-dependent visual difference moves to a plain `style` prop instead, same fix as
          // @/components/login-method-toggle.tsx's activeSegmentStyle.
          <View
            key={request.id}
            className="overflow-hidden rounded-xl border bg-surface shadow-sm"
            style={{
              borderColor: request.accentPrimary
                ? `${themeColors.primary}33`
                : `${themeColors.outlineVariant}4d`,
            }}
          >
            {request.accentPrimary ? (
              <View className="absolute left-0 top-0 h-full w-1 bg-primary" />
            ) : null}
            <View className="p-4">
              <View className="mb-3 flex-row items-start justify-between">
                <View className="flex-row items-center gap-2">
                  {request.badge ? (
                    <View
                      className="rounded-full px-2 py-0.5"
                      style={{
                        backgroundColor:
                          request.badge.tone === "surge"
                            ? themeColors.errorContainer
                            : themeColors.surfaceContainerHigh,
                      }}
                    >
                      <Text
                        className="font-label-sm text-label-sm"
                        style={{
                          color:
                            request.badge.tone === "surge"
                              ? themeColors.onErrorContainer
                              : themeColors.onSurface,
                        }}
                      >
                        {request.badge.label}
                      </Text>
                    </View>
                  ) : null}
                  <View className="flex-row items-center gap-1">
                    <MaterialIcons name="schedule" size={16} color={themeColors.onSurfaceVariant} />
                    <Text className="font-label-sm text-label-sm text-on-surface-variant">
                      {request.timeAway}
                    </Text>
                  </View>
                </View>
                <Text
                  className="font-fare-display text-fare-display"
                  style={{ color: request.accentPrimary ? themeColors.primary : themeColors.onSurface }}
                >
                  {formatCurrency(request.fare)}
                </Text>
              </View>

              <View className="ml-2 mt-1 border-l-2 border-outline-variant/30 pb-2 pl-6">
                <View className="absolute -left-[9px] top-0 h-4 w-4 items-center justify-center rounded-full bg-primary">
                  <View className="h-1.5 w-1.5 rounded-full bg-surface" />
                </View>
                <Text className="font-body-md text-body-md font-semibold text-on-surface" numberOfLines={1}>
                  {request.pickup.label}
                </Text>
                <Text className="font-label-sm text-label-sm text-on-surface-variant" numberOfLines={1}>
                  {request.pickup.meta}
                </Text>
              </View>
              <View className="ml-2 pt-2">
                <View className="absolute -left-[9px] top-3 h-4 w-4 items-center justify-center rounded-sm bg-on-surface">
                  <View className="h-1.5 w-1.5 rounded-sm bg-surface" />
                </View>
                <Text className="pl-6 font-body-md text-body-md font-semibold text-on-surface" numberOfLines={1}>
                  {request.dropoff.label}
                </Text>
                <Text className="pl-6 font-label-sm text-label-sm text-on-surface-variant" numberOfLines={1}>
                  {request.dropoff.meta}
                </Text>
              </View>

              <View className="mt-4 flex-row gap-2 border-t border-outline-variant/20 pt-3">
                <Pressable
                  onPress={() => router.push("/(driver)/navigate-to-pickup")}
                  className="flex-1 items-center justify-center rounded-lg py-3 active:scale-[0.98]"
                  style={
                    request.accentPrimary
                      ? {
                          backgroundColor: themeColors.primary,
                          shadowColor: "#000000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }
                      : { backgroundColor: themeColors.surfaceContainerHigh }
                  }
                >
                  <Text
                    className="font-label-sm text-label-sm"
                    style={{
                      color: request.accentPrimary ? themeColors.onPrimary : themeColors.onSurface,
                    }}
                  >
                    Accept
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    setRequests((current) => current.filter((row) => row.id !== request.id))
                  }
                  className="items-center justify-center rounded-lg border border-outline-variant/30 bg-surface-container p-3 active:bg-surface-variant"
                >
                  <MaterialIcons name="close" size={20} color={themeColors.onSurfaceVariant} />
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
