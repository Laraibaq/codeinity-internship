import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { formatCurrency } from "@/utils/currency";

type HistoryTab = "completed" | "cancelled";

// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("menu", "notifications", "local_taxi", "chevron_right") verified against the installed glyph
//   map.
// - The desktop nav drawer (`hidden md:flex`) is dropped: always below the `md:` breakpoint on a
//   native phone screen, same treatment as every screen in this project with a mobile/desktop
//   split. The header's `md:text-left`/`md:font-headline-lg` overrides are dropped for the same
//   reason -- kept the mobile `-mobile` token and centered text.
// - This screen's own bottom-nav-bar markup from the source is NOT reproduced here -- provided
//   once, globally, by the shared `(tabs)/_layout.tsx` Tabs navigator (this batch's Part 1).
// - Every hardcoded "$" dollar amount ($142.50, $24.50, $48.00, $18.50, $12.00) uses
//   `formatCurrency` from Part 0 instead of a hardcoded "$" string.
// - Each ride item's pickup/dropoff "timeline" (a vertical connector line with a ringed circle for
//   pickup and a filled square for dropoff) is reproduced as absolutely-positioned Views, no CSS
//   involved -- a direct structural translation, not a substitution.
// - `hover:*` / `group-hover:*` / `transition-*` / `duration-*` / `cursor-pointer` dropped
//   throughout: no hover state on touch devices.
//
// Rule 5 approved presentation state / left inert (not guessed):
// - The Completed/Cancelled tab toggle: the source shows two tab buttons but only ever provides
//   Completed's list content (no separate Cancelled dataset, no script toggling between them). A
//   local `useState<HistoryTab>` drives which tab LOOKS active (same category of exception as the
//   gender/color/vehicle-type pickers elsewhere in this project), but tapping "Cancelled" does not
//   swap the list content, since no cancelled-rides content was ever specified -- inventing a
//   cancelled-rides list would be adding content the source never gave, not translating it. Worth
//   confirming this is the right call once real ride data exists.
// - Each ride row now pushes to ride-details.tsx, passing that row's fare/pickup/dropoff/dateTime
//   as params so that screen reflects whichever trip was tapped (previously inert with a TODO --
//   "no ride-detail screen ... built yet" -- that screen now exists). "Load More History" is still
//   inert: no pagination/infinite-load logic has been built yet.
// - The header's menu icon -> settings.tsx (push), same as account.tsx/earnings.tsx, per explicit
//   confirmation. The notifications bell stays inert -- no destination specified anywhere.

const rides = [
  {
    id: "1",
    dateTime: "Oct 24, 2:30 PM",
    rideType: "UberX",
    pickup: "123 Market St",
    dropoff: "456 Mission St",
    fare: 24.5,
    dimmed: false,
  },
  {
    id: "2",
    dateTime: "Oct 24, 1:15 PM",
    rideType: "Comfort",
    pickup: "SFO Terminal 2",
    dropoff: "Union Square",
    fare: 48.0,
    dimmed: false,
  },
  {
    id: "3",
    dateTime: "Oct 24, 11:30 AM",
    rideType: "UberX",
    pickup: "Golden Gate Park",
    dropoff: "Painted Ladies",
    fare: 18.5,
    dimmed: false,
  },
  {
    id: "4",
    dateTime: "Oct 24, 9:00 AM",
    rideType: "UberX",
    pickup: "Embarcadero",
    dropoff: "Pier 39",
    fare: 12.0,
    dimmed: true,
  },
];

export default function DriverHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<HistoryTab>("completed");

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="w-full bg-surface shadow-sm">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin py-base">
          <Pressable
            onPress={() => router.push("/(driver)/settings")}
            className="-ml-2 items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="settings" size={24} color={themeColors.primary} />
          </Pressable>
          <Text className="flex-1 text-center font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            History
          </Text>
          <Pressable
            onPress={() => router.push("/(driver)/notifications")}
            className="-mr-2 items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="notifications" size={24} color={themeColors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-surface-container-lowest"
        contentContainerClassName="px-container-margin py-stack-md"
      >
        <View className="mx-auto w-full max-w-2xl">
          <View className="mb-stack-md flex-row rounded-lg bg-surface-container-high p-1">
            <Pressable
              onPress={() => setTab("completed")}
              className={`flex-1 items-center rounded-md px-4 py-2 ${
                tab === "completed" ? "bg-surface shadow-sm" : ""
              }`}
            >
              <Text
                className={`font-label-sm text-label-sm ${
                  tab === "completed" ? "font-bold text-on-surface" : "text-secondary"
                }`}
              >
                Completed
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTab("cancelled")}
              className={`flex-1 items-center rounded-md px-4 py-2 ${
                tab === "cancelled" ? "bg-surface shadow-sm" : ""
              }`}
            >
              <Text
                className={`font-label-sm text-label-sm ${
                  tab === "cancelled" ? "font-bold text-on-surface" : "text-secondary"
                }`}
              >
                Cancelled
              </Text>
            </Pressable>
          </View>

          <View className="mb-stack-md rounded-xl border border-outline-variant bg-surface p-stack-md shadow-sm">
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="mb-1 font-label-sm text-label-sm text-secondary">
                  Today&apos;s Earnings
                </Text>
                <Text className="font-fare-display text-fare-display text-on-surface">
                  {formatCurrency(142.5)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="mb-1 font-label-sm text-label-sm text-secondary">
                  Completed Trips
                </Text>
                <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                  6
                </Text>
              </View>
            </View>
          </View>

          <View className="gap-gutter">
            {rides.map((ride) => (
              <Pressable
                key={ride.id}
                onPress={() =>
                  router.push({
                    pathname: "/(driver)/ride-details",
                    params: {
                      fare: String(ride.fare),
                      pickup: ride.pickup,
                      dropoff: ride.dropoff,
                      dateTime: ride.dateTime,
                    },
                  })
                }
                className={`flex-row items-center justify-between rounded-xl border border-outline-variant bg-surface p-4 shadow-sm ${
                  ride.dimmed ? "opacity-70" : ""
                }`}
              >
                <View className="flex-1 flex-row items-start gap-4">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-low">
                    <MaterialIcons name="local-taxi" size={20} color={themeColors.primary} />
                  </View>
                  <View className="flex-1">
                    <View className="mb-1 flex-row items-center gap-2">
                      <Text className="text-[14px] font-bold text-on-surface">
                        {ride.dateTime}
                      </Text>
                      <View className="rounded-full bg-primary-container px-2 py-0.5">
                        <Text className="font-label-sm text-[10px] text-on-primary-container">
                          {ride.rideType}
                        </Text>
                      </View>
                    </View>
                    <View className="relative mt-2 gap-1 pl-3">
                      <View className="absolute bottom-2 left-1 top-2 w-0.5 bg-outline-variant" />
                      <View className="flex-row items-center gap-2">
                        <View className="absolute -left-[9px] h-2 w-2 rounded-full border-2 border-primary bg-surface" />
                        <Text
                          className="text-[13px] text-on-surface-variant"
                          numberOfLines={1}
                        >
                          {ride.pickup}
                        </Text>
                      </View>
                      <View className="mt-1 flex-row items-center gap-2">
                        <View className="absolute -left-[9px] h-2 w-2 rounded-sm bg-on-surface" />
                        <Text
                          className="text-[13px] text-on-surface-variant"
                          numberOfLines={1}
                        >
                          {ride.dropoff}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View className="items-end justify-center gap-2">
                  <Text className="text-[18px] font-fare-display text-on-surface">
                    {formatCurrency(ride.fare)}
                  </Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={themeColors.outlineVariant}
                  />
                </View>
              </Pressable>
            ))}
          </View>

          <View className="mt-8 items-center">
            <Pressable className="rounded-full border border-outline px-6 py-2">
              <Text className="font-label-sm text-label-sm text-on-surface">
                Load More History
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
