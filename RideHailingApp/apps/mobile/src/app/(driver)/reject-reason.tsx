import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

const REASONS = [
  { value: "too_far", label: "Pickup is too far" },
  { value: "fare_low", label: "Fare is too low" },
  { value: "personal_break", label: "Need a personal break" },
  { value: "other_app", label: "Busy with another app" },
  { value: "other", label: "Other reason" },
] as const;

// Source: "Reject Trip" (Part 7), inserted into the existing decline flow. dashboard.tsx's inline
// request cards' "Reject" button pushes here (passing that card's `requestId` as a route param)
// instead of removing the card immediately. The source's own h1 reads "Reject Trip" -- kept as this
// screen's on-screen title even though the route is named reject-reason.tsx.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("arrow_back", "check_circle") verified against the installed glyph map.
// - The source's radio-input + sibling-selector CSS (`input:checked + div`) has no RN equivalent;
//   substituted with a local `useState<string | null>` driving each row's selected styling directly,
//   same category of substitution as every other single-select picker in this project.
// - `hover:*` / `transition-*` / `duration-*` dropped throughout: no hover state on touch devices.
// - The sticky bottom action's `bg-gradient-to-t from-background ...` fade is purely decorative
//   (the button sits on a plain background either way) -- dropped per this project's policy for
//   non-load-bearing gradients.
//
// "Submit Feedback" gating (rule 5's "approved presentation state", not backend logic): the source
// disables this button until a radio is checked via plain JS -- reproduced with the same
// `useState<string | null>` driving `disabled` directly. This is real, simple UI state (a selection
// gate), not the kind of backend logic rule 5 excludes.
//
// "Submit Feedback" uses `router.dismissTo` back to (driver)/(tabs)/dashboard, carrying the
// `requestId` forward as a `rejectedRequestId` param -- dashboard.tsx watches that param (same
// param-as-signal mechanism it already uses for `status`) and removes the matching card from its
// request list once this screen reports back. Back arrow is a plain `router.back()`: returns to the
// dashboard without rejecting anything.
export default function RejectReasonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="bg-surface shadow-sm">
        <View className="h-16 w-full flex-row items-center gap-gutter px-container-margin py-base">
        <Pressable
          onPress={() => router.back()}
          className="items-center justify-center rounded-full p-2 active:scale-95"
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
        </Pressable>
        <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
          Reject Trip
        </Text>
        </View>
      </View>

      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-container-margin py-stack-md"
        >
          <Text className="mb-stack-md font-body-md text-body-md text-on-surface-variant">
            Please let us know why you cannot accept this trip. Your feedback helps us improve
            routing and fare estimates.
          </Text>

          {/* Fixed: this row's className, and the submit button's below, used to interpolate their
              selected/disabled state into template literals -- the same NativeWind runtime
              anti-pattern root-caused on login.tsx's phone/email toggle. Both classNames are now
              static; the state-dependent colors/opacity move to a plain `style` prop instead. */}
          <View className="gap-stack-sm">
            {REASONS.map((reason) => {
              const isSelected = selected === reason.value;
              return (
                <Pressable
                  key={reason.value}
                  onPress={() => setSelected(reason.value)}
                  className="flex-row items-center justify-between rounded-xl border p-4"
                  style={{
                    borderColor: isSelected ? themeColors.primary : themeColors.outlineVariant,
                    backgroundColor: isSelected
                      ? themeColors.surfaceContainerLow
                      : themeColors.surfaceContainerLowest,
                  }}
                >
                  <Text className="font-body-md text-body-md font-semibold text-on-surface">
                    {reason.label}
                  </Text>
                  {isSelected ? (
                    <MaterialIcons name="check-circle" size={24} color={themeColors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="px-container-margin pb-stack-md pt-stack-sm">
          <Pressable
            disabled={!selected}
            onPress={() =>
              router.dismissTo({
                pathname: "/(driver)/(tabs)/dashboard",
                params: requestId ? { rejectedRequestId: requestId } : {},
              })
            }
            className="h-14 w-full items-center justify-center rounded-xl bg-primary shadow-sm active:scale-[0.98]"
            style={selected ? undefined : { opacity: 0.5 }}
          >
            <Text className="font-label-sm text-label-sm text-on-primary">Submit Feedback</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
