import { useState } from "react";
import { ActivityIndicator, LayoutAnimation, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { themeColors } from "@/constants/theme-colors";
import { formatCurrency } from "@/utils/currency";

const STEP = 0.5;

// Source: "Counter Offer" (form state) + "Counter Offer Sent" (awaiting-response state). Presented
// as a transparentModal (see (driver)/_layout.tsx), opened from dashboard.tsx's inline request
// cards' "Counter" button -- the caller doesn't need to know anything about this screen, since
// dismissing (`router.back()`) always returns to whichever screen pushed it.
//
// Fixed: this screen used to render as a full pushed-style screen with its own header bar (back
// arrow + "Counter Offer" title) above the bottom-sheet card, on an opaque background. Per explicit
// instruction it's now a pure popup: no header at all, just the bottom-sheet card itself, with the
// caller screen showing through dimmed (via the scrim below) in the space above it -- same visual
// result `select-modal.tsx`'s backdrop achieves, just via a route-level transparentModal instead of
// an in-screen <Modal>, since this needs its own route for router.push/back navigation.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("arrow_back", "remove", "add", "insights", "hourglass_top") verified against the installed
//   glyph map.
// - `animate-spin` (the hourglass's spinning ring) and `pulse-ring` (the ring behind it) have no
//   equivalent without animation code beyond a mechanical conversion; both render in their static
//   resting frame -- the ring is drawn as a plain circle rather than a spinner mid-spin.
// - `hover:*` / `group-hover:*` / `transition-*` / `duration-*` dropped throughout, including the
//   form button's hover sheen sweep -- no hover state on touch devices.
//
// Fare stepper: local `useState<number>` (rule 5's "approved presentation state"), starting at 16.00
// and moving in $0.50 increments, matching the source's vanilla-JS behavior exactly. Every dollar
// amount uses `formatCurrency` per this task's instruction.
//
// `phase` ('form' | 'sent') replaces the earlier instant-dismiss TODO: "Send Counter Offer" now
// transitions to 'sent' instead of calling `router.back()` immediately. The sent state's "Suggested
// Fare" shows the live `fare` value from the stepper (via `formatCurrency`), not the sent source's
// own hardcoded $18.00 -- that hardcoded figure only ever reflected whatever the stepper happened
// to show in that one mockup screenshot; showing the actual amount the driver set is the correct
// behavior a real "what did I just offer" screen needs, not a deviation from the source's intent.
// "Cancel Offer" (sent state) calls `router.back()`, same as the form state's dismissal -- both
// return to whichever screen opened this modal.
//
// Fixed: "Send Counter Offer" used to swap `form` -> `sent` instantly with zero feedback. It now
// shows a brief loading state (disabled button, spinner + "Sending...") before transitioning --
// see handleSendCounterOffer's TODO for the real API call this delay stands in for -- and the
// transition itself cross-fades via `LayoutAnimation.easeInEaseOut` instead of popping instantly.
//
export default function CounterOfferScreen() {
  const router = useRouter();
  const [fare, setFare] = useState(16);
  const [phase, setPhase] = useState<"form" | "sent">("form");
  const [isSending, setIsSending] = useState(false);

  const handleSendCounterOffer = () => {
    setIsSending(true);
    // TODO: this delay is a placeholder standing in for the real counter-offer submission API
    // call. Remove the setTimeout once that exists -- the loading-state UX below (disabled
    // button, spinner, "Sending...") should stay and just react to the real request instead.
    setTimeout(() => {
      setIsSending(false);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setPhase("sent");
    }, 900);
  };

  return (
    <View className="h-full flex-1 items-center">
      <View className="absolute inset-0 bg-black/40" pointerEvents="none" />

      {phase === "form" ? (
        <View className="relative mx-auto w-full max-w-md flex-1 justify-end pb-8">
          <View className="relative z-10 flex-col rounded-t-3xl border-t border-outline-variant bg-surface px-container-margin pb-stack-md pt-4 shadow-lg">
            <View className="mx-auto mb-stack-md h-1 w-10 rounded-full bg-outline-variant" />

            <View className="mb-stack-lg items-center">
              <Text className="mb-base font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Counter Offer
              </Text>
              <Text className="font-body-md text-body-md text-on-surface-variant">
                Suggest a fare that works for you
              </Text>
            </View>

            <View className="mb-stack-lg items-center">
              <View className="w-full flex-row items-center justify-center gap-stack-md rounded-3xl border border-outline-variant/30 bg-surface-container p-stack-sm shadow-sm">
                <Pressable
                  onPress={() => setFare((value) => Math.max(0, value - STEP))}
                  className="h-14 w-14 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest shadow-sm active:scale-95"
                >
                  <MaterialIcons name="remove" size={32} color={themeColors.primary} />
                </Pressable>
                {/* Source splits this into a separate "$" glyph + numeric input; formatCurrency
                    owns the whole locale-aware string (symbol placement varies by locale), so both
                    collapse into one Text rather than reproducing that split. */}
                <Text className="font-display-lg text-display-lg tabular-nums text-on-surface">
                  {formatCurrency(fare)}
                </Text>
                <Pressable
                  onPress={() => setFare((value) => value + STEP)}
                  className="h-14 w-14 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest shadow-sm active:scale-95"
                >
                  <MaterialIcons name="add" size={32} color={themeColors.primary} />
                </Pressable>
              </View>

              <View className="mt-stack-sm flex-row items-center gap-2 rounded-full border border-primary-fixed/50 bg-inverse-on-surface px-4 py-2">
                <MaterialIcons name="insights" size={18} color={themeColors.primary} />
                <Text className="font-label-sm text-label-sm text-on-surface-variant">
                  Market Range:{" "}
                  <Text className="text-primary">
                    {formatCurrency(14)} - {formatCurrency(18)}
                  </Text>
                </Text>
              </View>
            </View>

            {/* Fixed: className used to interpolate `isSending ? "opacity-70" : ""` into a template
                literal -- the same NativeWind runtime anti-pattern root-caused on login.tsx's
                phone/email toggle (a conditionally-shaped className triggers a lazy component
                "upgrade" + remount that crashes native navigation). className is now static; the
                isSending-dependent opacity moves to a plain `style` prop instead, same fix as
                @/components/login-method-toggle.tsx's activeSegmentStyle. */}
            <Pressable
              onPress={handleSendCounterOffer}
              disabled={isSending}
              className="mt-auto h-14 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary shadow-lg active:scale-[0.98]"
              style={isSending ? { opacity: 0.7 } : undefined}
            >
              {isSending ? (
                <>
                  <ActivityIndicator size="small" color={themeColors.onPrimary} />
                  <Text className="font-label-sm text-label-sm text-on-primary">Sending...</Text>
                </>
              ) : (
                <Text className="font-label-sm text-label-sm text-on-primary">
                  Send Counter Offer
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="relative mx-auto w-full max-w-md flex-1 items-center justify-end px-container-margin pb-8">
          <View className="relative z-20 w-full max-w-[400px] items-center rounded-3xl border border-outline-variant bg-surface p-stack-md shadow-lg">
            <View className="relative mb-stack-sm h-20 w-20 items-center justify-center">
              <View className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <View
                className="absolute inset-2 rounded-full border-4 border-primary"
                style={{ borderTopColor: "transparent" }}
              />
              <MaterialIcons name="hourglass-top" size={32} color={themeColors.primary} />
            </View>
            <Text className="mb-2 text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              Offer Sent
            </Text>
            <Text className="mb-stack-md text-center font-body-md text-body-md text-on-surface-variant">
              Awaiting passenger response...
            </Text>
            <View className="mb-stack-md w-full items-center rounded-xl border border-outline-variant/50 bg-surface-container-low p-stack-sm">
              <Text className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Suggested Fare
              </Text>
              <Text className="font-fare-display text-fare-display text-primary">
                {formatCurrency(fare)}
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              className="w-full items-center justify-center rounded-xl border border-outline-variant bg-surface px-6 py-4 shadow-sm active:scale-[0.98]"
            >
              <Text className="font-label-sm text-label-sm text-on-surface">Cancel Offer</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
