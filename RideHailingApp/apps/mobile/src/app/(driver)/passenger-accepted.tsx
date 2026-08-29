import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";

import { themeColors } from "@/constants/theme-colors";
import { formatCurrency } from "@/utils/currency";

// Source: "Offer Accepted" (Part 8). Now wired per the comparison below, resolved: Accept on both
// ride-request-notification.tsx and ride-request-detail.tsx pushes here first (replacing their
// previous direct push to navigate-to-pickup.tsx), and this screen's own "Start Navigation" button
// continues on to navigate-to-pickup.tsx.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("check", "payments", "person_pin_circle", "navigation") verified against the installed glyph
//   map.
// - The ambient map's `bg-map-pan` slow pan, the success icon's `animate-ping`/`animate-pulse`
//   rings, and the card's `animate-card-reveal` slide-up-bounce entrance have no equivalent without
//   animation code beyond a mechanical conversion; all render in their static resting frame.
// - The map's darkening scrim (`backdrop-blur-[2px]`) uses `expo-blur`'s <BlurView>, same
//   substitution used elsewhere in this project.
// - The card's top glow (`bg-gradient-to-b from-primary-container/20 to-transparent`) and the
//   button's hover sheen sweep are both purely decorative -- dropped per this project's policy for
//   non-load-bearing gradients and hover-only effects.
// - `hover:*` / `group-hover:*` / `transition-*` / `duration-*` dropped throughout: no hover state
//   on touch devices.
// - Every dollar amount uses `formatCurrency` per this task's instruction.
//
// "Start Navigation" -> navigate-to-pickup.tsx.
//
// Comparison against navigate-to-pickup.tsx, as requested: this reads as (a) a brief celebratory
// screen meant to show for a moment after Accept, before navigate-to-pickup.tsx -- not (b) an
// alternate/earlier version of that screen. Reasons:
// - This screen shows ONLY the fare and the pickup location/distance -- no passenger name, rating,
//   or avatar at all. navigate-to-pickup.tsx shows all three (Sarah, 4.9, avatar) plus chat/call
//   buttons. If this were an earlier draft of the same live-navigation screen, it's odd that it
//   would have LESS passenger information than the "later" version, not more.
// - This screen has no turn-by-turn instruction bar, no live ETA-to-pickup countdown, and no
//   dropoff information at all -- just a static "2.4 mi away" distance. navigate-to-pickup.tsx is
//   built entirely around those live-navigation elements (turn arrows, "4 min away", map route).
// - The tone and copy here are explicitly transitional/celebratory ("Offer Accepted!", a checkmark
//   success icon, "Proceeding to passenger location") rather than task-focused -- it reads as a
//   confirmation splash, not a working screen you'd stay on while driving.
// - The single action, "Start Navigation", implies this screen's job is to hand off INTO navigation
//   -- i.e. into navigate-to-pickup.tsx -- not to BE the navigation screen itself.
//
// Fixed (Root Cause B of this batch): the card was a plain View sized by its own content inside a
// full-screen flex container -- on a shorter device it could exceed the screen with no way to reach
// the cut-off content. Wrapped in a ScrollView (content still bottom-anchored via `justify-end`,
// matching the original look when everything already fits).
export default function PassengerAcceptedScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-end bg-surface md:justify-center">
      <View className="absolute inset-0 z-0 overflow-hidden bg-surface-container">
        <View
          className="absolute h-full w-full opacity-40"
          style={{
            backgroundColor: themeColors.surfaceContainerHigh,
          }}
        />
      </View>
      <BlurView
        intensity={8}
        tint="dark"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View className="absolute inset-0 z-10 bg-on-surface/10" />

      <ScrollView
        className="z-20 w-full flex-1"
        contentContainerClassName="flex-grow items-center justify-end"
      >
        <View className="w-full max-w-[420px] overflow-hidden rounded-t-[32px] border-x border-t border-outline-variant/30 bg-surface shadow-lg md:rounded-2xl md:border">
        <View className="mx-auto mt-4 h-1 w-10 rounded-full bg-outline-variant/50 md:hidden" />

        <View className="gap-stack-lg p-stack-md pt-8 md:pt-stack-md">
          <View className="items-center gap-stack-sm">
            <View className="mb-2 h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg">
              <MaterialIcons name="check" size={36} color={themeColors.onPrimary} />
            </View>
            <View className="gap-1">
              <Text className="text-center font-display-lg text-display-lg tracking-tight text-on-surface">
                Offer Accepted!
              </Text>
              <Text className="text-center font-body-md text-body-md text-secondary">
                Proceeding to passenger location
              </Text>
            </View>
          </View>

          <View className="gap-base">
            <View className="flex-row items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-container-low p-stack-sm">
              <View>
                <Text className="mb-1 font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                  Final Fare
                </Text>
                <Text className="font-fare-display text-fare-display text-primary">
                  {formatCurrency(24.5)}
                </Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-high">
                <MaterialIcons name="payments" size={20} color={themeColors.tertiary} />
              </View>
            </View>

            <View className="gap-stack-sm rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-stack-sm">
              <View className="flex-row items-start gap-stack-sm">
                <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-primary-fixed/30">
                  <MaterialIcons name="person-pin-circle" size={14} color={themeColors.primary} />
                </View>
                <View className="flex-1">
                  <Text
                    className="font-body-md text-body-md font-medium text-on-surface"
                    numberOfLines={1}
                  >
                    Blue Bottle Coffee, 2nd St
                  </Text>
                  <Text className="font-label-sm text-label-sm text-secondary">
                    Pickup • 2.4 mi away
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="pt-base">
            <Pressable
              onPress={() => router.push("/(driver)/navigate-to-pickup")}
              className="min-h-[56px] w-full flex-row items-center justify-center gap-base rounded-xl bg-primary shadow-md active:scale-[0.98]"
            >
              <MaterialIcons name="navigation" size={20} color={themeColors.onPrimary} />
              <Text className="text-[15px] text-on-primary">Start Navigation</Text>
            </Pressable>
          </View>
        </View>
        </View>
      </ScrollView>
    </View>
  );
}
