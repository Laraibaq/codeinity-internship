import { Image, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";

import { themeColors } from "@/constants/theme-colors";
import { formatCurrency } from "@/utils/currency";

// Source: "New Ride Request". Presented as a modal (see (driver)/_layout.tsx Part 2) so it overlays
// the dashboard as a card-style popup rather than a full navigational screen, matching the source's
// bottom-sheet-over-a-dimmed-map look.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("star", "flag", "timer", "payments") verified against the installed glyph map.
// - The desktop-only header (`hidden md:flex`, "Dashboard" title) is dropped entirely, same
//   treatment as every other screen in this project with a mobile/desktop split -- it never renders
//   below the `md:` breakpoint.
// - `backdrop-blur-[2px]` scrim over the map uses `expo-blur`'s <BlurView>, same substitution used
//   on dashboard.tsx's offline map layer.
// - `radarPulse` (pickup marker ping) and `animate-slide-up` (card entrance) have no equivalent
//   without introducing animation code beyond a mechanical conversion; both render in their static
//   resting frame, per rule 3's "closest RN pattern" fallback.
// - The 15s countdown bar (`animation: countdown 15s linear forwards`) is a decorative timer with no
//   backend request-expiry logic behind it yet (rule 5, UI shell only); rendered at its resting
//   (full) width rather than faking a live countdown with no real deadline to count down to.
// - `hover:*` / `transition-*` / `duration-*` dropped throughout: no hover state on touch devices.
//
// Navigation:
// - Tapping the passenger/route card (not the action buttons) -> ride-request-detail.tsx via
//   `replace`, so this modal doesn't sit in the back-stack underneath the detail screen.
// - ACCEPT -> passenger-accepted.tsx (a brief celebratory hand-off screen, per that screen's
//   comparison against navigate-to-pickup.tsx), skipping the detail screen. That screen's own
//   "Start Navigation" button is what continues on to navigate-to-pickup.tsx -- this used to go
//   there directly; that's now one hop later.
// - COUNTER -> counter-offer.tsx (modal, shared with the detail screen's Counter button).
// - REJECT -> reject-reason.tsx (push), per that screen's batch -- previously dismissed this modal
//   directly via `router.back()`; reject-reason.tsx's own "Submit Feedback" now does that dismiss
//   (via `dismissTo`, since the stack is now this modal + reject-reason on top of dashboard.tsx)
//   after collecting a reason first.
export default function RideRequestNotificationScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <View className="absolute inset-0 overflow-hidden bg-surface-container-low">
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCZErDrO9goontsbJAeRinD7Efh2_aa3aDvq_CfCGVH71QJLx5MZOPu3TuKfpyBlgGbJKb5A1Wf2sQz6VjypH6G4YYwK-vpBQc07tH3CzcV5qU42eKOCSHDi-PKfWTWIa-WaLPydUKxWDMhVsiOzgxnvM-r2RxlOnYI8q7hdaJatLxmWilBWip2pcpRYnaRLON6itoqithDGo8AsRpd1CJCSdDk4Sx3AkLQkYaO1rfU2E52kciSbidY",
          }}
          resizeMode="cover"
          className="h-full w-full"
        />
        <BlurView
          intensity={15}
          tint="dark"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View className="absolute inset-0 bg-inverse-surface/30" />

        <View className="absolute left-[45%] top-[40%] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <View className="h-4 w-4 rounded-full border-2 border-surface bg-primary shadow-md" />
          <View className="absolute -top-10 flex-row items-center gap-1 self-center rounded-full border border-outline-variant bg-surface px-3 py-1 shadow-lg">
            <View className="h-2 w-2 rounded-full bg-primary" />
            <Text className="font-label-sm text-label-sm text-on-surface">2 min away</Text>
          </View>
        </View>
      </View>

      <View className="flex-1 justify-end p-4">
        <View className="w-full max-w-[400px] self-center overflow-hidden rounded-t-3xl border border-outline-variant bg-surface shadow-lg">
          <View className="items-center pb-1 pt-3">
            <View className="h-1 w-10 rounded-full bg-outline-variant" />
          </View>

          <Pressable onPress={() => router.replace("/(driver)/ride-request-detail")}>
            <View className="relative flex-row items-start justify-between overflow-hidden border-b border-surface-container-high bg-surface-bright p-gutter pt-4">
              <View className="z-10 flex-row items-center gap-4">
                <View className="h-14 w-14 overflow-hidden rounded-full border-2 border-surface bg-surface-container shadow-sm">
                  <Image
                    source={{
                      uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsLH9WBpm19lTkdRkfo2Q_AsBUnKOJIaU3n7cCBTtM__VrJPvexbXS9VVMZcGuY7_evsxSGX3AoeoZJgUHBvn9QH0uv7t-7VT3hkAn20EkxjJ37i4KdAoe0Nher_pnYOOIc9egQDVWz7Clj6HSZiHSu5LEwgiMOSHTu4DVjPtlNTFcEZTfP47cPQteBjU0M8kRzvrS0n5dbhvnZAifCaCDOsI50wy6EmZ7sx0AwUZru2MxKryVPi7F",
                    }}
                    resizeMode="cover"
                    className="h-full w-full"
                  />
                </View>
                <View className="justify-center">
                  <Text className="text-[22px] font-headline-lg-mobile text-headline-lg-mobile leading-tight text-on-surface">
                    Sarah J.
                  </Text>
                  <View className="mt-1 w-fit flex-row items-center gap-1 rounded-full bg-surface-container-low px-2 py-0.5">
                    <MaterialIcons name="star" size={14} color={themeColors.primary} />
                    <Text className="font-label-sm text-label-sm text-on-surface-variant">4.9</Text>
                  </View>
                </View>
              </View>
              <View className="z-10 items-end">
                <Text className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Offer
                </Text>
                <Text className="font-fare-display text-fare-display text-primary">
                  {formatCurrency(15)}
                </Text>
              </View>
            </View>

            <View className="gap-4 bg-surface p-gutter">
              <View className="relative flex-col gap-stack-md py-2 pl-10 pr-2">
                <View className="absolute bottom-4 left-[19px] top-4 w-[2px] bg-surface-container-high" />
                <View className="relative">
                  <View className="absolute -left-[35px] top-0 z-10 h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-surface-container-lowest">
                    <View className="h-2 w-2 rounded-full bg-primary" />
                  </View>
                  <Text className="mb-0.5 font-label-sm text-label-sm text-on-surface-variant">
                    Pickup • 2 min (0.8 mi)
                  </Text>
                  <Text
                    className="font-body-md text-body-md font-semibold text-on-surface"
                    numberOfLines={1}
                  >
                    1450 Market Street, San Francisco
                  </Text>
                </View>
                <View className="relative">
                  <View className="absolute -left-[35px] top-0 z-10 h-6 w-6 items-center justify-center rounded-full bg-on-surface">
                    <MaterialIcons name="flag" size={14} color={themeColors.surface} />
                  </View>
                  <Text className="mb-0.5 font-label-sm text-label-sm text-on-surface-variant">
                    Dropoff • 12 min (3.2 mi)
                  </Text>
                  <Text
                    className="font-body-md text-body-md font-semibold text-on-surface"
                    numberOfLines={1}
                  >
                    Pier 39, Fisherman&apos;s Wharf
                  </Text>
                </View>
              </View>

              <View className="mt-2 flex-row gap-2">
                <View className="flex-1 items-center justify-center gap-1 rounded-lg border border-surface-variant bg-surface-container-low p-3">
                  <MaterialIcons name="timer" size={20} color={themeColors.secondary} />
                  <Text className="font-label-sm text-label-sm text-on-surface-variant">
                    14 min total
                  </Text>
                </View>
                <View className="flex-1 items-center justify-center gap-1 rounded-lg border border-surface-variant bg-surface-container-low p-3">
                  <MaterialIcons name="payments" size={20} color={themeColors.secondary} />
                  <Text className="font-label-sm text-label-sm text-on-surface-variant">
                    ~$1.07/min
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>

          <View className="mt-auto gap-3 border-t border-surface-variant bg-surface p-gutter pb-stack-md pt-2">
            <Pressable
              onPress={() => router.push("/(driver)/passenger-accepted")}
              className="h-14 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary shadow-md active:scale-[0.98]"
            >
              <Text className="font-label-sm text-[16px] text-label-sm text-on-primary">
                ACCEPT
              </Text>
            </Pressable>
            <View className="w-full flex-row gap-3">
              <Pressable
                onPress={() => router.push("/(driver)/counter-offer")}
                className="h-12 flex-1 items-center justify-center rounded-lg border border-outline-variant bg-surface-container active:scale-[0.98]"
              >
                <Text className="font-label-sm text-label-sm text-on-surface">COUNTER</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/(driver)/reject-reason")}
                className="h-12 flex-1 items-center justify-center rounded-lg border border-transparent bg-transparent active:scale-[0.98]"
              >
                <Text className="font-label-sm text-label-sm text-secondary">REJECT</Text>
              </Pressable>
            </View>
            <View className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-container-highest">
              <View className="h-full w-full rounded-full bg-primary" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
