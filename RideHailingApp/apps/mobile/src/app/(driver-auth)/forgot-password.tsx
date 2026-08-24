import { Pressable, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { themeColors } from "@/constants/theme-colors";

// Rule 4 flag (not a class substitution, an authoring mistake in the source): the header's <h1>
// reads "Driver Registration" even though this screen's own <h2> says "Reset Password", its page
// <title> is "Driver Forgot Password", and its content (phone number -> Send Code) is clearly a
// forgot-password flow, not registration. This looks like a copy-pasted header left over from the
// registration screen. Left exactly as-is per rule 4 rather than "fixing" it to say something else
// -- please confirm what the header should actually say.
//
// Rule 3 substitutions used on this screen:
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

export default function DriverForgotPasswordScreen() {
  return (
    <View className="h-full w-full flex-1 bg-background">
      <View className="h-16 w-full flex-row items-center justify-between bg-surface px-container-margin">
        <Pressable className="items-center justify-center rounded-full p-2 active:scale-95">
          <MaterialIcons name="arrow-back" size={16} color={themeColors.primary} />
        </Pressable>
        <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
          Driver Registration
        </Text>
        <View className="w-10" />
      </View>

      <View className="mx-auto w-full max-w-md flex-grow px-container-margin py-stack-md pt-stack-lg">
        <View className="mb-stack-lg">
          <Text className="mb-base font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Reset Password
          </Text>
          <Text className="font-body-md text-body-md text-on-surface-variant">
            Enter the phone number associated with your driver account. We&apos;ll send you a
            code to reset your password.
          </Text>
        </View>

        <View className="flex-grow gap-stack-md">
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
              />
            </View>
          </View>

          <View className="flex-1" />

          <Pressable className="w-full items-center justify-center rounded-lg bg-primary px-6 py-4 shadow-md active:scale-95">
            <Text className="font-label-sm text-label-sm uppercase text-on-primary">
              Send Code
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
