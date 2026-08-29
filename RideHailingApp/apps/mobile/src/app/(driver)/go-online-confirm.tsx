import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// Source: "Go Online Confirmation" (Part 3). Presented as a modal (see (driver)/_layout.tsx),
// opened from dashboard.tsx's offline-state "Go Online" button instead of that button flipping
// `status` directly.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("menu", "directions_car") verified against the installed glyph map.
// - The blurred map background uses `expo-blur`'s <BlurView>, same substitution pattern used
//   elsewhere in this project for backdrop-blur-over-real-content; since there's no real map image
//   to blur here (this modal has no map context of its own), a plain surface-variant fill stands in
//   for the backdrop the blur would otherwise be softening.
// - `animate-[ping...]` (pulsing ring behind the car icon) has no equivalent without animation code
//   beyond a mechanical conversion; renders in its static resting frame.
// - `hover:*` / `transition-*` / `duration-*` dropped throughout: no hover state on touch devices.
//
// Flagged, kept literal (rule 4): the source's top-left "menu" icon has no sensible destination on
// a confirmation dialog (there's no drawer, and this isn't a tab root) -- same category of mismatch
// as dashboard.tsx's offline-state back arrow. Rendered but left unwired with a TODO rather than
// guessing at a destination.
//
// "Go Online" uses `router.dismissTo` to set dashboard.tsx's `status` param to "online" while
// dismissing this modal in one call -- the same mechanism ride-completed.tsx and
// verification-status.tsx already use. "Cancel" is a plain `router.back()`: dismiss only, no status
// change, so dashboard.tsx stays offline.
export default function GoOnlineConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <View className="absolute inset-0 z-0 bg-surface-variant">
        <BlurView
          intensity={25}
          tint="light"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View className="absolute inset-0 bg-surface/50" />
      </View>

      <View style={{ paddingTop: insets.top }} className="absolute top-0 z-10 w-full">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          {/* TODO: no destination specified for this menu icon; see header note above. */}
          <Pressable className="-ml-2 items-center justify-center rounded-full p-2 active:scale-95">
            <MaterialIcons name="menu" size={24} color={themeColors.onSurface} />
          </Pressable>
        </View>
      </View>

      <View className="z-20 flex-1 items-center justify-center p-container-margin">
        <View className="w-full max-w-[360px] overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-lg">
          <View className="relative h-32 items-center justify-center overflow-hidden bg-surface-container-low">
            <View className="absolute h-16 w-16 items-center justify-center rounded-full bg-primary opacity-20">
              <MaterialIcons name="directions-car" size={32} color={themeColors.onPrimary} />
            </View>
          </View>

          <View className="items-center p-stack-md">
            <Text className="mb-2 text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              Ready to hit the road?
            </Text>
            <Text className="mb-stack-lg text-center font-body-md text-body-md text-on-surface-variant">
              Start Earning
            </Text>

            <View className="w-full gap-stack-sm">
              <Pressable
                onPress={() =>
                  router.dismissTo({
                    pathname: "/(driver)/(tabs)/dashboard",
                    params: { status: "online" },
                  })
                }
                className="h-14 w-full items-center justify-center rounded-full bg-primary active:scale-95"
              >
                <Text className="font-label-sm text-label-sm text-on-primary">Go Online</Text>
              </Pressable>
              <Pressable
                onPress={() => router.back()}
                className="h-14 w-full items-center justify-center rounded-full border border-outline-variant bg-surface active:scale-95"
              >
                <Text className="font-label-sm text-label-sm text-on-surface">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
