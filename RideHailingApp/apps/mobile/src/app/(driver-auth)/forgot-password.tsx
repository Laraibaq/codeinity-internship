import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { themeColors } from "@/constants/theme-colors";
import { LoginMethodToggle, type LoginMethod } from "@/components/login-method-toggle";
import { passwordResetDraft } from "@/utils/password-reset-draft";
import { normalizePhone } from "@/utils/phone";

// Restored to the screen's original structure/copy (see git history: commit 2c423f6, "August") after
// several turns of layout changes had accumulated on top of it. The only two carryovers kept from
// those turns: the header text fix ("Forgot Password" instead of "Driver Registration" -- the
// original was a copy-pasted leftover from the registration screen, a real bug independently
// confirmed and fixed per explicit instruction, not stylistic drift) and the global safe-area
// padding wrapper (`useSafeAreaInsets()`, applied identically across every (driver-auth) screen --
// see _layout.tsx's header comment for why every screen needs it). Everything else -- the body copy,
// the input/button layout -- matches the original again.
//
// Rule 4 flag (original, unmodified): the header's <h1> issue is described above; kept here for
// context since it's the reason the header text differs from a byte-for-byte restore.
//
// Rule 3 substitutions used on this screen (original, unmodified):
// - Icon-ligature -> MaterialIcons substitution as on every screen in this batch (see
//   onboarding-negotiation.tsx). The back-arrow icon has no explicit size class, so it inherits the
//   page's default 16px, consistent with the other screens in this batch.
// - `docked full-width top-0 flat no shadows` on the header are not real Tailwind utilities (same
//   inert-word artifact as elsewhere in this batch) -- dropped silently, zero effect either way.
// - `sm:text-sm` on the "+1" prefix dropped: a tablet-breakpoint override with no equivalent on a
//   native phone screen already at "mobile" size; the base (unsized, 16px-inherited) state applies.
// - `focus:ring-primary` on the phone input dropped: Tailwind's `ring` utility compiles to a
//   compound box-shadow with no reliable NativeWind translation; `focus:border-primary` (which
//   NativeWind does support) already provides focus feedback.
// - `hover:bg-primary-container hover:text-on-primary-container` and their `transition-colors
//   duration-200` companion dropped from the submit button: no hover state on touch devices.
//
// The ONE addition kept on top of the restored original: the Phone/Email toggle, using the exact
// same shared `LoginMethodToggle` component/logic login.tsx uses (not reinvented) -- added because
// driver accounts now have both a phone and an email on file. This unavoidably requires two small
// deviations from the byte-for-byte original: the body copy now says "phone number or email" instead
// of just "phone number" (the toggle would be misleading otherwise), and an email input row exists
// alongside the original phone row, styled to match it. The entered value is carried forward as
// route params to reset-password-verify.tsx for display there.
//
// Vertical centering: removed. Content now flows naturally from the top of the screen, directly
// below the header, rather than being centered or pushed down -- no more flexGrow/justifyContent on
// the ScrollView's content container. Horizontal centering of the content wrapper still comes from
// its own `mx-auto`, unaffected by this change.

export default function DriverForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [method, setMethod] = useState<LoginMethod>("phone");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // "Send Code" now calls the real POST /auth/password-reset/request -- the backend replies the
  // same way whether or not an account exists for this identifier (see that endpoint's own
  // comment), so this always proceeds to the code-entry screen rather than branching on a
  // found/not-found response that would leak account existence.
  const handleSendCode = async () => {
    const identifier = method === "phone" ? normalizePhone(value) : value.trim();
    if (!identifier) {
      setFormError(method === "phone" ? "Enter a phone number." : "Enter an email address.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await apiClient.post("/auth/password-reset/request", { identifier });
      passwordResetDraft.identifier = identifier;
      router.push({
        pathname: "/(driver-auth)/reset-password-verify",
        params: { method, value },
      });
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Couldn't send a code. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="bg-surface">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={16} color={themeColors.primary} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Forgot Password
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-container-margin pb-stack-lg"
      >
        <View className="mx-auto w-full max-w-md">
          <View className="mb-stack-lg">
            <Text className="mb-base font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              Reset Password
            </Text>
            <Text className="font-body-md text-body-md text-on-surface-variant">
              Enter the phone number or email associated with your driver account. We&apos;ll
              send you a code to reset your password.
            </Text>
          </View>

          <View className="gap-stack-md">
            <LoginMethodToggle
              value={method}
              onChange={(next) => {
                setMethod(next);
                setValue("");
              }}
            />

            {method === "phone" ? (
              <View className="relative">
                <Text className="mb-base font-label-sm text-label-sm text-on-surface-variant">
                  Phone Number
                </Text>
                <View className="flex-row">
                  <View className="items-center justify-center rounded-l-lg border border-r-0 border-outline-variant bg-surface-container-low px-4">
                    <Text className="text-on-surface-variant">+1</Text>
                  </View>
                  <TextInput
                    className="min-w-0 flex-1 rounded-r-lg border border-outline-variant bg-surface px-4 py-4 font-body-md text-body-md text-on-surface focus:border-primary"
                    placeholder="(555) 000-0000"
                    placeholderTextColor={themeColors.outline}
                    keyboardType="phone-pad"
                    value={value}
                    onChangeText={setValue}
                  />
                </View>
              </View>
            ) : (
              <View className="relative">
                <Text className="mb-base font-label-sm text-label-sm text-on-surface-variant">
                  Email Address
                </Text>
                <TextInput
                  className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-4 font-body-md text-body-md text-on-surface focus:border-primary"
                  placeholder="you@example.com"
                  placeholderTextColor={themeColors.outline}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={setValue}
                />
              </View>
            )}

            {formError ? (
              <Text className="text-center font-label-sm text-label-sm text-error">
                {formError}
              </Text>
            ) : null}

            <Pressable
              onPress={handleSendCode}
              disabled={submitting}
              className="w-full items-center justify-center rounded-lg bg-primary px-6 py-4 shadow-md active:scale-95 disabled:opacity-70"
            >
              {submitting ? (
                <ActivityIndicator color={themeColors.onPrimary} />
              ) : (
                <Text className="font-label-sm text-label-sm uppercase text-on-primary">
                  Send Code
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
