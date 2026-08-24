import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";

import { themeColors } from "@/constants/theme-colors";

// Rule 3 substitutions used on this screen:
// - Google "Material Symbols Outlined" ligature icons substituted with @expo/vector-icons'
//   MaterialIcons (name case converted underscore -> hyphen), as on every screen in this batch.
//   Icon `size` follows the source <span>'s text-size class, or the inherited ancestor font-size
//   where no explicit size class was present (the header back-arrow inherits the page's default
//   16px body text size, since neither the button nor body set an explicit font-size utility).
// - `docked full-width` on the header, and other stray non-Tailwind words seen elsewhere in this
//   batch (e.g. "flat no shadows"), are not real Tailwind utilities and compile to no CSS in the
//   source HTML either -- dropped silently as inert, not a visual substitution.
// - Web `position: fixed` (header/footer) has no RN equivalent (RN's `position` only supports
//   absolute/relative); substituted with `absolute` pinned to the screen edges, which is the
//   standard translation since the screen root is already the fixed element's positioning context.
// - The `.hero-pattern` custom CSS class is a repeating radial-gradient dot texture; RN Views have
//   no background-image/gradient-pattern support. Substituted with the pattern's flat base color
//   (`surface-container-low`, exactly matching #f0f3ff) at the same opacity; the dot texture itself
//   is omitted.
// - `.float-anim` (a CSS @keyframes float translateY loop) has no static NativeWind equivalent and
//   is out of scope for this UI-shell pass (rule 5); the three floating cards are rendered in their
//   resting (translateY: 0) position with the animation dropped.
// - The `.glass-panel` frosted-glass background (backdrop-filter: blur + translucent white) has no
//   NativeWind/RN equivalent, substituted with expo-blur's <BlurView>. BlurView isn't a NativeWind-
//   registered component, so its fill/positioning is set via `style` rather than `className`, and its
//   `intensity` (0-100) doesn't map 1:1 to a CSS blur-radius in px -- picked a moderate value to
//   approximate the source's blur(12px).

export default function DriverOnboardingNegotiationScreen() {
  const router = useRouter();

  return (
    <View className="relative flex-1 overflow-hidden bg-background">
      <View className="absolute left-0 right-0 top-0 z-50 h-16 w-full flex-row items-center justify-between bg-surface px-container-margin">
        <Pressable className="items-center justify-center rounded-full p-2 active:scale-95">
          <MaterialIcons name="arrow-back" size={16} color={themeColors.primary} />
        </Pressable>
        <Text className="flex-1 text-center font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
          Driver Registration
        </Text>
        <Pressable
          onPress={() => router.push("/(driver-auth)/register")}
          className="items-center justify-center rounded-full p-2 active:scale-95"
        >
          <Text className="font-label-sm text-label-sm text-primary">Skip</Text>
        </Pressable>
      </View>

      <View className="mx-auto w-full max-w-md flex-1 items-center justify-center px-container-margin pb-32 pt-16">
        <View className="relative mb-stack-lg aspect-square w-full items-center justify-center">
          <View className="absolute inset-0 scale-110 rounded-full bg-surface-container-low opacity-30" />
          <View className="absolute inset-4 rounded-full bg-primary-container opacity-10" />
          <View className="absolute inset-8 rounded-full bg-surface-variant opacity-40" />

          <View className="relative z-10 h-full w-full items-center justify-center gap-4">
            <View className="-rotate-3 flex-row items-center gap-gutter rounded-xl border border-outline-variant bg-surface p-4 shadow-lg">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-container">
                <MaterialIcons name="person" size={24} color={themeColors.onPrimaryContainer} />
              </View>
              <View className="flex-col">
                <Text className="font-label-sm text-label-sm text-on-surface-variant">
                  Passenger Offer
                </Text>
                <Text className="font-fare-display text-fare-display text-on-surface">
                  $15.00
                </Text>
              </View>
            </View>

            <View className="z-20 items-center justify-center rounded-full bg-surface-container p-2 shadow-sm">
              <MaterialIcons name="sync-alt" size={32} color={themeColors.primary} />
            </View>

            <View className="rotate-2 flex-row items-center gap-gutter rounded-xl border border-primary bg-surface p-4 shadow-lg">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
                <MaterialIcons name="local-taxi" size={24} color={themeColors.onPrimary} />
              </View>
              <View className="flex-col">
                <Text className="font-label-sm text-label-sm text-primary">
                  Your Counter Offer
                </Text>
                <Text className="font-fare-display text-fare-display text-primary">
                  $18.50
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View
          className="relative mb-stack-lg w-full overflow-hidden rounded-2xl border border-surface-container-highest"
          style={{
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <BlurView
            intensity={50}
            tint="light"
            experimentalBlurMethod="dimezisBlurView"
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View className="items-center p-6">
            <Text className="mb-stack-sm text-center font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">
              Fair Fares for Everyone
            </Text>
            <Text className="text-center font-body-md text-body-md text-on-surface-variant">
              Set your own prices and negotiate directly with passengers to ensure every trip is
              worth your time.
            </Text>
          </View>
        </View>
      </View>

      <View className="absolute bottom-0 left-0 right-0 z-50 w-full items-center gap-stack-sm border-t border-surface-container-high bg-surface px-container-margin py-stack-md pb-8">
        <View className="mb-2 flex-row gap-2">
          <View className="h-2 w-8 rounded-full bg-primary" />
          <View className="h-2 w-2 rounded-full bg-surface-variant" />
        </View>
        <Pressable
          onPress={() => router.push("/(driver-auth)/onboarding-earnings")}
          className="w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4 shadow-md active:scale-95"
        >
          <Text className="font-label-sm text-label-sm text-on-primary">Next</Text>
          <MaterialIcons name="arrow-forward" size={18} color={themeColors.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}
