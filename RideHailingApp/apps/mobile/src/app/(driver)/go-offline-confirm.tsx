import { Image, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";

import { themeColors } from "@/constants/theme-colors";
import { formatCurrency } from "@/utils/currency";

// Source: "Go Offline Confirmation" (Part 4). Presented as a modal (see (driver)/_layout.tsx),
// opened from dashboard.tsx's online-state "Go Offline" button instead of that button flipping
// `status` directly -- the reverse of go-online-confirm.tsx's Part 3 pattern.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("power_settings_new", "location_on", "directions_car", "payments") verified against the
//   installed glyph map.
// - The ambient map background's `backdrop-blur-sm` scrim uses `expo-blur`'s <BlurView>, same
//   substitution pattern used elsewhere in this project for backdrop-blur-over-real-content.
// - `animate-pulse` (map marker ping) has no equivalent without animation code beyond a mechanical
//   conversion; renders in its static resting frame.
// - The mobile bottom-sheet layout is used (the `md:` centered-dialog variant is a desktop-only
//   override, dropped per this project's standing mobile/desktop-split policy).
// - `hover:*` / `transition-*` / `duration-*` dropped throughout: no hover state on touch devices.
//
// Stats placeholders (rule 5, UI shell only): "4" rides is the source's own hardcoded value: no
// trip-count backend exists yet. "$84.50" earned uses `formatCurrency` and happens to already match
// earnings.tsx's "Today's Earnings" figure, so it's consistent with that screen rather than an
// arbitrary new number.
//
// "Go Offline" uses `router.dismissTo` to set dashboard.tsx's `status` param to "offline" while
// dismissing this modal in one call -- the same mechanism go-online-confirm.tsx uses in reverse.
// "Stay Online" is a plain `router.back()`: dismiss only, no status change.
export default function GoOfflineConfirmScreen() {
  const router = useRouter();

  return (
    <View className="relative h-screen w-screen flex-1 overflow-hidden bg-background">
      <Image
        source={{
          uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3mc6H_LRhEJKNWMcm_G0iTVeFc38zbY1iE8x7wXW6Z3LUY_1fkiblvVeNIWk1ARC_qAQZZhwgY75U1FsXEsu-d80ENM57zDAN1vybTkziaV_R4yLToZgTr0Km1gn9eDGBhVbq8MVpxLoc78teNoBmG-C6OUryBom8LTGGpEXQCAWXBIMWpi6SlZtOeVR0-gBzVx-xphgVbIZzEAOefIc2Dd45US3v2N6gzuDaOWmvIr2BoRYHbVt6",
        }}
        resizeMode="cover"
        className="absolute inset-0 z-0 h-full w-full opacity-60"
      />
      <View className="absolute inset-0 z-0" pointerEvents="none">
        <View className="absolute left-[20%] top-[30%] h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <View className="h-4 w-4 rounded-full bg-primary" />
        </View>
        <View className="absolute right-[30%] top-[60%] items-center justify-center">
          <MaterialIcons name="location-on" size={32} color={themeColors.onSurface} />
        </View>
      </View>
      <BlurView
        intensity={15}
        tint="dark"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View className="absolute inset-0 z-10 bg-on-background/40" />

      <View className="absolute bottom-0 left-0 z-20 w-full">
        <View className="relative mx-auto w-full max-w-md flex-col overflow-hidden rounded-t-[32px] border-t border-outline-variant/30 bg-surface p-container-margin shadow-lg">
          <View className="mx-auto mb-stack-md h-1 w-10 rounded-full bg-tertiary-fixed-dim" />

          <View className="mb-stack-lg items-center">
            <View className="mx-auto mb-stack-sm h-16 w-16 items-center justify-center rounded-full bg-surface-container">
              <MaterialIcons name="power-settings-new" size={32} color={themeColors.primary} />
            </View>
            <Text className="mb-2 text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              End your session?
            </Text>
            <Text className="text-center font-body-md text-body-md text-on-surface-variant">
              You&apos;ve had a great run today.
            </Text>
          </View>

          <View className="mb-stack-lg flex-row gap-gutter">
            <View className="flex-1 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
              <MaterialIcons
                name="directions-car"
                size={20}
                color={themeColors.secondary}
                style={{ marginBottom: 4 }}
              />
              <Text className="font-fare-display text-fare-display text-on-surface">4</Text>
              <Text className="mt-1 font-label-sm text-label-sm uppercase text-on-surface-variant">
                Rides
              </Text>
            </View>
            <View className="flex-1 items-center justify-center rounded-xl border border-primary-fixed-dim/30 bg-primary-fixed/20 p-4">
              <MaterialIcons
                name="payments"
                size={20}
                color={themeColors.primary}
                style={{ marginBottom: 4 }}
              />
              <Text className="font-fare-display text-fare-display text-primary">
                {formatCurrency(84.5)}
              </Text>
              <Text className="mt-1 font-label-sm text-label-sm uppercase text-primary">
                Earned
              </Text>
            </View>
          </View>

          <View className="mt-auto gap-stack-sm">
            <Pressable
              onPress={() =>
                router.dismissTo({
                  pathname: "/(driver)/(tabs)/dashboard",
                  params: { status: "offline" },
                })
              }
              className="h-14 w-full items-center justify-center rounded-xl bg-primary shadow-sm active:scale-[0.98]"
            >
              <Text className="font-label-sm text-label-sm text-on-primary">Go Offline</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              className="h-14 w-full items-center justify-center rounded-xl border border-outline-variant bg-surface active:scale-[0.98]"
            >
              <Text className="font-label-sm text-label-sm text-on-surface">Stay Online</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
