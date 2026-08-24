import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { themeColors } from "@/constants/theme-colors";

// Source marker for this screen was "Driver Signup", but its <title> ("Driver Registration -
// Indigo Motion") and on-screen <h1> ("Driver Registration") match the table's "Driver
// Registration" row, so it's placed at that path per your confirmation.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this batch (see
//   onboarding-negotiation.tsx). Icon `size` follows the source's text-size class, or the
//   inherited 16px page default where no size class was present (all icons here except the
//   directions_car header icon, which is explicit text-3xl/30px).
// - `dark:` variants dropped throughout: this UI-shell pass has no dark-mode toggle wired up
//   (rule 5), and most `dark:` values here are identical to the light value anyway.
// - `md:font-headline-lg md:text-headline-lg` on "Join Indigo Motion" dropped: this is a tablet/
//   desktop-breakpoint override with no equivalent on a native phone screen already at "mobile"
//   size; kept the base `-mobile` typography token.
// - `overflow-x-hidden` on the body dropped as inert: RN Views don't scroll horizontally unless
//   explicitly wrapped in a horizontal ScrollView, which nothing here does.
// - `sticky top-0` on the header has no RN equivalent (RN's `position` has no `sticky` value).
//   Substituted by keeping the header as a normal sibling above a <ScrollView> rather than
//   inside it, which reproduces "header stays put, content scrolls beneath it" without any
//   positioning trick.
// - The whole `<main>` has no explicit scroll container in the source, but relies on the browser's
//   natural page scroll (there are 4 inputs + a submit button + a terms paragraph, which can
//   exceed a phone viewport's height); per rule 2 ("a scrollable container -> ScrollView") this is
//   wrapped in a <ScrollView>, since RN Views don't scroll by default the way an HTML body does.
// - `focus:ring-2 focus:ring-primary focus:ring-opacity-50` on each input dropped: Tailwind's
//   `ring` utility compiles to a compound box-shadow with no reliable NativeWind translation; the
//   accompanying `focus:border-primary` (which NativeWind does support as a real TextInput focus
//   variant) already provides the primary focus feedback.
// - The "Log in" / "Terms of Service" / "Privacy Policy" `<a>` links are rendered as nested `Text`
//   inside their parent paragraph `Text` (RN's standard pattern for an inline text link), not
//   Pressable, since Pressable is block-level and would break the inline paragraph flow. No
//   onPress handlers attached, per rule 5 (UI shell only).
// - The terms paragraph's `<br class="hidden sm:block"/>` is hidden by default and only becomes a
//   visible line break at the tablet `sm:` breakpoint and up. Since this is a phone-sized native
//   screen (always below that breakpoint), the source's own mobile behavior is "no line break here"
//   -- so it's correctly omitted, not guessed.

export default function DriverRegisterScreen() {
  return (
    <View className="h-full flex-1 bg-surface">
      <View className="h-16 w-full flex-row items-center justify-between bg-surface px-container-margin">
        <View className="flex-row items-center gap-4">
          <Pressable
            accessibilityLabel="Go back"
            className="h-10 w-10 items-center justify-center rounded-full active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={16} color={themeColors.onSurfaceVariant} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight text-primary">
            Driver Registration
          </Text>
        </View>
      </View>

      <ScrollView
        className="w-full flex-1"
        contentContainerClassName="mx-auto w-full max-w-lg items-center px-container-margin py-stack-lg"
      >
        <View className="mb-stack-lg w-full items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-primary-container shadow-sm">
            <MaterialIcons name="directions-car" size={30} color={themeColors.primary} />
          </View>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
            Join Indigo Motion
          </Text>
          <Text className="mt-2 font-body-md text-body-md text-on-surface-variant">
            Start earning on your own schedule.
          </Text>
        </View>

        <View
          className="w-full gap-stack-md rounded-xl border border-outline-variant bg-surface-container-lowest p-6"
          style={{
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <View className="gap-1">
            <Text className="font-label-sm text-label-sm text-on-surface-variant">FULL NAME</Text>
            <View className="relative">
              <View className="absolute inset-y-0 left-0 z-10 justify-center pl-4" pointerEvents="none">
                <MaterialIcons name="person" size={16} color={themeColors.onSurfaceVariant} />
              </View>
              <TextInput
                className="min-h-[56px] rounded-lg border border-transparent bg-surface-container-low pl-12 pr-4 font-body-md text-body-md text-on-surface focus:border-primary focus:bg-surface-container-lowest"
                placeholder="e.g. Jane Doe"
              />
            </View>
          </View>

          <View className="gap-1">
            <Text className="font-label-sm text-label-sm text-on-surface-variant">EMAIL</Text>
            <View className="relative">
              <View className="absolute inset-y-0 left-0 z-10 justify-center pl-4" pointerEvents="none">
                <MaterialIcons name="mail" size={16} color={themeColors.onSurfaceVariant} />
              </View>
              <TextInput
                className="min-h-[56px] rounded-lg border border-transparent bg-surface-container-low pl-12 pr-4 font-body-md text-body-md text-on-surface focus:border-primary focus:bg-surface-container-lowest"
                placeholder="jane@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View className="gap-1">
            <Text className="font-label-sm text-label-sm text-on-surface-variant">
              PHONE NUMBER
            </Text>
            <View className="relative">
              <View className="absolute inset-y-0 left-0 z-10 justify-center pl-4" pointerEvents="none">
                <MaterialIcons name="call" size={16} color={themeColors.onSurfaceVariant} />
              </View>
              <TextInput
                className="min-h-[56px] rounded-lg border border-transparent bg-surface-container-low pl-12 pr-4 font-body-md text-body-md text-on-surface focus:border-primary focus:bg-surface-container-lowest"
                placeholder="(555) 000-0000"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View className="gap-1">
            <Text className="font-label-sm text-label-sm text-on-surface-variant">PASSWORD</Text>
            <View className="relative">
              <View className="absolute inset-y-0 left-0 z-10 justify-center pl-4" pointerEvents="none">
                <MaterialIcons name="lock" size={16} color={themeColors.onSurfaceVariant} />
              </View>
              <TextInput
                className="min-h-[56px] rounded-lg border border-transparent bg-surface-container-low pl-12 pr-4 font-body-md text-body-md text-on-surface focus:border-primary focus:bg-surface-container-lowest"
                placeholder="••••••••"
                secureTextEntry
              />
            </View>
          </View>

          <Pressable
            className="mt-4 min-h-[56px] w-full flex-row items-center justify-center rounded-lg bg-primary active:scale-[0.98]"
            style={{
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Text className="font-label-sm text-label-sm tracking-wide text-on-primary">
              SIGN UP
            </Text>
          </Pressable>

          <View className="mt-4 items-center">
            <Text className="font-body-md text-body-md text-on-surface-variant">
              Already have an account?{" "}
              <Text className="font-semibold text-primary">Log in</Text>
            </Text>
          </View>
        </View>

        <Text className="mt-8 px-4 text-center font-label-sm text-label-sm text-outline">
          By signing up, you agree to Indigo Motion&apos;s{" "}
          <Text className="underline">Terms of Service</Text> and{" "}
          <Text className="underline">Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </View>
  );
}
