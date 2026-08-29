import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// Fixed (Root Cause B of this batch): the bottom content section (headline/paragraph/button) was a
// fixed-height (`flex-shrink-0`) View, not scrollable -- since the panel above it enforces a
// `min-h-[50%]` floor it can't shrink past, a short device could force this section to overflow the
// screen's `overflow-hidden` container with no way to reach the cut-off content. Wrapped in a
// ScrollView so it's reachable either way.
//
// Rule 3 substitutions used on this screen (in addition to the icon-ligature -> MaterialIcons
// substitution used throughout this batch, see onboarding-negotiation.tsx for that note):
// - Every icon here uses Google's default "outlined" (FILL 0) Material Symbols style, except the
//   wallet icon below which is explicitly FILL 1 (filled). @expo/vector-icons' MaterialIcons is a
//   solid/filled glyph set with no outlined variant, so it can't distinguish FILL 0 vs FILL 1 --
//   every icon across this whole batch will render visually heavier/more filled than the source's
//   thin-stroke outlined default. Flagging prominently since it affects every screen, not just this
//   one method.
// - The outer `<div class="... md:h-[850px] md:rounded-[2rem] md:shadow-2xl md:border ...">` is a
//   "phone frame" wrapper for previewing this mockup at desktop browser widths; its `md:` classes
//   target a breakpoint that doesn't apply to a native app already rendering at phone size. Per
//   rule 4 this looks like a design-tool preview artifact, not intentional UI -- kept the wrapping
//   View for structural fidelity but dropped only the non-applicable `md:*` utilities. Flagging for
//   review rather than silently deciding it doesn't matter.
// - `selection:bg-primary-container selection:text-on-primary-container` (CSS ::selection styling)
//   dropped: text-selection highlight color isn't a themeable concept in RN.
// - `bg-gradient-to-br from-... via-... to-...` substituted with expo-linear-gradient's
//   <LinearGradient> (3-stop, diagonal via start/end points).
// - The two decorative blur blobs (`blur-3xl`, `mix-blend-multiply`, `animate-pulse`) have no RN
//   equivalent: no CSS filter:blur() on Views, no mix-blend-mode, and no static NativeWind form of a
//   pulsing keyframe animation (out of scope per rule 5). Substituted with plain flat-color circles
//   at the same size/position/opacity, un-blurred and static (resting-state).
// - `bg-surface/80 backdrop-blur-xl` (frosted glass card) substituted with expo-blur's <BlurView>,
//   as on the negotiation onboarding screen.
// - `hover:scale-105` / `hover:bg-primary-container` and their `transition-*` / `duration-*` /
//   `ease-out` companions dropped: no hover state on touch devices, no RN CSS-transition equivalent.

export default function DriverOnboardingEarningsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="h-full flex-1 items-center justify-center bg-surface">
      <View className="relative h-full w-full max-w-md flex-1 overflow-hidden bg-surface">
        {/* Skip header — same absolute-pinned pattern as onboarding-negotiation */}
        <View
          style={{ paddingTop: insets.top }}
          className="absolute left-0 right-0 top-0 z-50 w-full bg-surface"
        >
          <View className="h-16 w-full flex-row items-center justify-end px-container-margin">
            <Pressable
              onPress={() => router.push("/(driver-auth)/register")}
              className="items-center justify-center rounded-full p-2 active:scale-95"
            >
              <Text className="font-label-sm text-label-sm text-primary">Skip</Text>
            </Pressable>
          </View>
        </View>

        <View className="relative min-h-[50%] w-full flex-1 items-center justify-center overflow-hidden bg-surface-container-low p-container-margin">
          <LinearGradient
            colors={[
              themeColors.surfaceContainerLow,
              themeColors.surfaceContainerHigh,
              themeColors.surfaceVariant,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute inset-0 opacity-80"
            pointerEvents="none"
          />
          <View className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary-fixed opacity-40" />
          <View className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-secondary-fixed opacity-40" />

          <View
            className="relative z-10 w-full max-w-[320px] overflow-hidden rounded-2xl border border-surface-container-highest p-6"
            style={{
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.15,
              shadowRadius: 25,
              elevation: 15,
            }}
          >
            <BlurView
              intensity={60}
              tint="light"
              experimentalBlurMethod="dimezisBlurView"
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View className="mb-8 flex-row items-center justify-between">
              <MaterialIcons name="account-balance-wallet" size={30} color={themeColors.primary} />
              <Text className="rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
                Available
              </Text>
            </View>
            <Text className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Total Earnings
            </Text>
            <Text className="mb-8 font-fare-display text-fare-display tracking-tight text-on-surface">
              $1,248<Text className="text-xl text-on-surface-variant">.50</Text>
            </Text>

            <View className="mb-4 h-20 flex-row items-end justify-between gap-2">
              <View className="h-[30%] w-1/5 rounded-t-sm bg-primary-fixed" />
              <View className="h-[50%] w-1/5 rounded-t-sm bg-primary-fixed" />
              <View className="h-[80%] w-1/5 rounded-t-sm bg-primary-fixed" />
              <View className="h-[40%] w-1/5 rounded-t-sm bg-primary-fixed" />
              <View className="relative h-full w-1/5 rounded-t-sm bg-primary">
                <View className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-inverse-surface px-2 py-1">
                  <Text className="font-label-sm text-[10px] text-inverse-on-surface">Today</Text>
                </View>
              </View>
            </View>
            <View className="flex-row justify-between">
              <Text className="font-label-sm text-[10px] text-on-surface-variant">M</Text>
              <Text className="font-label-sm text-[10px] text-on-surface-variant">T</Text>
              <Text className="font-label-sm text-[10px] text-on-surface-variant">W</Text>
              <Text className="font-label-sm text-[10px] text-on-surface-variant">T</Text>
              <Text className="font-label-sm text-[10px] font-bold text-primary">F</Text>
            </View>
          </View>
        </View>

        <ScrollView
          className="relative z-20 -mt-6 flex-shrink-0 rounded-t-[2rem] bg-surface"
          contentContainerClassName="flex-grow gap-6 px-container-margin pb-8 pt-10"
        >
          <View className="mb-2 flex-row items-center justify-center gap-2">
            <View className="h-2 w-2 rounded-full bg-outline-variant" />
            <View className="h-2 w-8 rounded-full bg-primary" />
          </View>

          <View className="items-center gap-4">
            <Text className="text-center font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight text-on-surface">
              {"Fast & Transparent\nPayments"}
            </Text>
            <Text className="px-4 text-center font-body-md text-body-md text-on-surface-variant">
              Track your earnings in real-time and withdraw funds whenever you need. No hidden
              fees, just clear metrics.
            </Text>
          </View>

          <View className="mt-8">
            <Pressable
              onPress={() => router.push("/(driver-auth)/register")}
              className="h-[56px] w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary active:scale-95"
              style={{
                shadowColor: themeColors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <Text className="font-label-sm text-label-sm text-on-primary">Get Started</Text>
              <MaterialIcons name="arrow-forward" size={20} color={themeColors.onPrimary} />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
