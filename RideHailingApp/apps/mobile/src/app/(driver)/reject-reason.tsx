import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

const REASONS = [
  { value: "too_far", label: "Pickup is too far" },
  { value: "fare_low", label: "Fare is too low" },
  { value: "personal_break", label: "Need a personal break" },
  { value: "other_app", label: "Busy with another app" },
  { value: "other", label: "Other reason" },
] as const;

// Source: "Reject Trip" (Part 7), inserted into the existing decline flow. Both
// ride-request-detail.tsx's "Decline" and ride-request-notification.tsx's "Reject" now push here
// instead of calling `router.back()` directly. The source's own h1 reads "Reject Trip" -- kept as
// this screen's on-screen title even though the route is named reject-reason.tsx.
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
// "Submit Feedback" uses `router.dismissTo` back to (driver)/(tabs)/dashboard, same reasoning as
// ride-completed.tsx's existing usage: this screen can be reached after either ride-request-detail
// (itself reached via a `replace`d notification) or directly from the notification modal, so the
// stack above dashboard.tsx can be 1-2 screens deep depending on the path -- `dismissTo` clears
// whichever it is in one call, the same way it already does for the accept-side flow. Back arrow is
// a plain `router.back()`: returns to whichever screen pushed this one, without rejecting anything.
export default function RejectReasonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

          <View className="gap-stack-sm">
            {REASONS.map((reason) => {
              const isSelected = selected === reason.value;
              return (
                <Pressable
                  key={reason.value}
                  onPress={() => setSelected(reason.value)}
                  className={`flex-row items-center justify-between rounded-xl border p-4 ${
                    isSelected
                      ? "border-primary bg-surface-container-low"
                      : "border-outline-variant bg-surface-container-lowest"
                  }`}
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
              router.dismissTo({ pathname: "/(driver)/(tabs)/dashboard", params: { status: "online" } })
            }
            className={`h-14 w-full items-center justify-center rounded-xl bg-primary shadow-sm active:scale-[0.98] ${
              selected ? "" : "opacity-50"
            }`}
          >
            <Text className="font-label-sm text-label-sm text-on-primary">Submit Feedback</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
