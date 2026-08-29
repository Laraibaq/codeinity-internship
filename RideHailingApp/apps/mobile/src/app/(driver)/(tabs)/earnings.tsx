import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { formatCurrency } from "@/utils/currency";

// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("menu", "notifications", "arrow_forward", "payments", "schedule", "check_circle") verified
//   against the installed glyph map.
// - The desktop nav drawer (`hidden md:flex`) and the desktop-only "Earnings" header
//   (`hidden md:block`) are dropped: this is a native phone screen, always below the `md:`
//   breakpoint, same treatment as every other screen in this project with a mobile/desktop split.
// - `grid grid-cols-1 md:grid-cols-12` (Balance / Weekly Chart / Summary Stats) resolves to a
//   single stacked column on mobile -- same substitution used throughout this project for this
//   grid pattern. The three sections stack in source DOM order: Balance card, Weekly Chart,
//   Summary Stats.
// - This screen's own bottom-nav-bar markup from the source is NOT reproduced here -- it's now
//   provided once, globally, by the shared `(tabs)/_layout.tsx` Tabs navigator (this batch's Part
//   1), which renders identically across all 4 tab screens instead of being duplicated in each
//   screen's own JSX.
// - The Balance card's `-right-20 -top-20 ... bg-primary/5 rounded-full blur-3xl` decoration has no
//   RN blur-filter equivalent; flattened to a plain low-opacity circle (already barely visible at
//   5% opacity in the source), same policy as other dropped decorative blurs in this project.
// - The Friday bar's `$245.50` tooltip only ever appears on `group-hover`, which has no touch
//   equivalent -- rendered in its resting (hidden) state, same "hover-only reveal renders hidden"
//   policy used for register-profile-photo.tsx's edit overlay. The bar itself (tallest, primary-
//   colored) is still shown at its literal height.
// - Every hardcoded "$" dollar amount ($1,248.50, $245.50, $84.50) uses `formatCurrency` from Part
//   0 instead of a hardcoded "$" string, per this task's instruction.
// - `hover:*` / `group-hover:*` / `transition-*` / `duration-*` dropped throughout (no hover state
//   on touch devices), except where already noted above.
//
// - The header's hamburger/menu button -> settings.tsx (push), same as account.tsx's, per explicit
//   confirmation that this shared header chrome should behave identically across all three screens.
//
// One item intentionally left unwired (not guessed):
// - The notifications bell: no destination specified anywhere in this task.
// - "Withdraw" is also left inert with a TODO: per this project's cash-only MVP1 policy (see
//   src/utils/currency.ts), a real payout/withdrawal flow is the same category of "payment method"
//   concern this task explicitly deferred to MVP3 for account.tsx's "Earnings Settings" -- extending
//   that same policy here rather than wiring a payout action prematurely.

const weeklyBars = [
  { day: "Mon", heightPct: 30, active: false },
  { day: "Tue", heightPct: 45, active: false },
  { day: "Wed", heightPct: 60, active: false },
  { day: "Thu", heightPct: 50, active: false },
  { day: "Fri", heightPct: 90, active: true },
  { day: "Sat", heightPct: 20, active: false },
  { day: "Sun", heightPct: 10, active: false },
];

export default function DriverEarningsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="z-40 w-full bg-surface shadow-sm">
        <View className="w-full flex-row items-center justify-between px-container-margin py-base">
          <Pressable
            onPress={() => router.push("/(driver)/settings")}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="menu" size={24} color={themeColors.primary} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Driver Portal
          </Text>
          {/* TODO: no destination specified for the notifications bell. */}
          <Pressable className="items-center justify-center rounded-full p-2 active:scale-95">
            <MaterialIcons name="notifications" size={24} color={themeColors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-4xl gap-gutter px-container-margin pb-32 pt-stack-md"
      >
        <View className="relative gap-stack-md overflow-hidden rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm">
          <View
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary opacity-5"
            pointerEvents="none"
          />
          <View className="z-10">
            <Text className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Available to Withdraw
            </Text>
            <Text className="font-display-lg text-display-lg text-on-surface">
              {formatCurrency(1248.5)}
            </Text>
          </View>
          {/* TODO: payout/withdrawal flow deferred to MVP3 per cash-only policy -- no backend
              wiring yet (see src/utils/currency.ts header comment). */}
          <Pressable className="z-10 w-full items-center rounded-full bg-primary px-8 py-3 shadow-sm active:scale-95">
            <Text className="font-body-md text-body-md font-semibold text-on-primary">
              Withdraw
            </Text>
          </Pressable>
        </View>

        <View className="h-[400px] gap-stack-md rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              Weekly Earnings
            </Text>
            {/* TODO: no destination specified for "View Details". */}
            <Pressable className="flex-row items-center gap-1">
              <Text className="font-label-sm text-label-sm text-primary">View Details</Text>
              <MaterialIcons name="arrow-forward" size={14} color={themeColors.primary} />
            </Pressable>
          </View>

          <View className="relative flex-1 flex-row items-end justify-between gap-2 border-b border-outline-variant/20 pb-8 pt-8">
            {weeklyBars.map((bar) => (
              <View key={bar.day} className="h-full flex-1 items-center justify-end gap-2 pb-8">
                <View
                  className={`w-full max-w-[40px] rounded-t-lg ${
                    bar.active ? "bg-primary shadow-md" : "bg-surface-container-highest"
                  }`}
                  style={{ height: `${bar.heightPct}%` }}
                />
                <Text
                  className={`absolute bottom-0 font-label-sm text-label-sm ${
                    bar.active ? "font-bold text-primary" : "text-on-surface-variant"
                  }`}
                >
                  {bar.day}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="h-[400px] gap-gutter">
          <View className="flex-1 justify-center gap-2 rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm">
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                <MaterialIcons name="payments" size={16} color="#047857" />
              </View>
              <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Today&apos;s Earnings
              </Text>
            </View>
            <Text className="font-fare-display text-fare-display text-on-surface">
              {formatCurrency(84.5)}
            </Text>
          </View>

          <View className="flex-1 justify-center gap-2 rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm">
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                <MaterialIcons name="schedule" size={16} color="#1d4ed8" />
              </View>
              <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Online Time
              </Text>
            </View>
            <Text className="font-fare-display text-fare-display text-on-surface">5h 22m</Text>
          </View>

          <View className="flex-1 justify-center gap-2 rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm">
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-purple-50">
                <MaterialIcons name="check-circle" size={16} color="#7e22ce" />
              </View>
              <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Completed Rides
              </Text>
            </View>
            <Text className="font-fare-display text-fare-display text-on-surface">12</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
