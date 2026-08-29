import { Image, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { themeColors } from "@/constants/theme-colors";
import { formatCurrency } from "@/utils/currency";

// Source: "New Ride Request". Presented as a modal (see (driver)/_layout.tsx Part 2) so it overlays
// the dashboard as a card-style popup rather than a full navigational screen.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("star", "flag", "timer", "payments") verified against the installed glyph map.
// - The desktop-only header (`hidden md:flex`, "Dashboard" title) is dropped entirely, same
//   treatment as every other screen in this project with a mobile/desktop split -- it never renders
//   below the `md:` breakpoint.
// - `animate-slide-up` (card entrance) has no equivalent without introducing animation code beyond a
//   mechanical conversion; the native-stack "transparentModal" transition (see below) already
//   provides a slide-up, so this isn't a fidelity loss.
// - The 15s countdown bar (`animation: countdown 15s linear forwards`) is a decorative timer with no
//   backend request-expiry logic behind it yet (rule 5, UI shell only); rendered at its resting
//   (full) width rather than faking a live countdown with no real deadline to count down to.
// - `hover:*` / `transition-*` / `duration-*` dropped throughout: no hover state on touch devices.
//
// Fixed: this screen used to render its own dimmed/blurred map behind the card (a source-mockup
// image, `expo-blur`'s <BlurView>, a dark tint overlay, and a pulsing pickup-marker chip) so that,
// combined with the "modal" presentation's opaque background, it read as a separate dimmed screen
// sitting on top of the dashboard. Per explicit instruction, that entire background layer is removed
// and the screen's presentation in (driver)/_layout.tsx changed from "modal" to "transparentModal" --
// the real dashboard now shows through, undimmed, with only the request card itself appearing to
// float on top of it. There is no longer a map/pickup-marker illustration on this screen at all
// (there was never a real map here to begin with, just a static mockup image standing in for one).
//
// Navigation:
// - Tapping the passenger/route card (not the action buttons) -> ride-request-detail.tsx via
//   `replace`, so this modal doesn't sit in the back-stack underneath the detail screen.
// - ACCEPT -> navigate-to-pickup.tsx directly, skipping the detail screen. passenger-accepted.tsx (a
//   brief celebratory hand-off screen this used to go through first) has been deleted -- its content
//   is now folded into navigate-to-pickup.tsx's bottom sheet's collapsed "peek" state instead of
//   being its own screen.
// - COUNTER -> counter-offer.tsx (modal, shared with the detail screen's Counter button).
// - REJECT -> reject-reason.tsx (push), per that screen's batch -- previously dismissed this modal
//   directly via `router.back()`; reject-reason.tsx's own "Submit Feedback" now does that dismiss
//   (via `dismissTo`, since the stack is now this modal + reject-reason on top of dashboard.tsx)
//   after collecting a reason first.
export default function RideRequestNotificationScreen() {
  const router = useRouter();

  return (
    <View className="flex-1">
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
              onPress={() => router.push("/(driver)/navigate-to-pickup")}
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
