import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { LoginMethodToggle } from "@/components/login-method-toggle";

// Fixed: this screen had no header/back arrow at all, unlike every other (driver-auth) screen --
// added the same h-16 back-arrow + title header pattern used throughout this project, wired to
// `router.back()`. "Create Account" is now a real link -> register.tsx (push), same treatment as
// register.tsx's own "Log in" link (RN supports `onPress` directly on a nested Text, so it doesn't
// need to become a block-level Pressable that would break the inline paragraph flow).
//
// Fixed (global safe-area audit): the header carries top-safe-area padding via
// `useSafeAreaInsets()` -- see _layout.tsx's header comment for why this became necessary (the root
// Stack's native header, which used to reserve this space automatically, is now hidden everywhere).
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this batch (see
//   onboarding-negotiation.tsx). Icon `size` follows the inherited ancestor font-size where the
//   source <span> has no explicit size class: 16px for the call/lock input icons (page default),
//   12px for the arrow_forward icon inside the Login button (inherits the button's text-label-sm) --
//   same "unintentionally small icon" case as welcome.tsx's Get Started button; flagging rather
//   than silently enlarging it.
// - The two inputs use a CSS floating-label pattern: an absolutely-positioned <label> sits over the
//   input like a placeholder at rest (input itself has `placeholder=" "`, i.e. empty), then
//   `.input-group:focus-within label { transform: translateY(-1.5rem) scale(0.85) }` animates the
//   label up and shrinks it on focus. There's no static-NativeWind way to express a focus-driven
//   transform animation, and reproducing the interaction itself is out of scope for a static,
//   dummy-data UI shell (rule 5). Since the pattern's *resting* state (unfocused, empty) is visually
//   identical to a plain placeholder, this is substituted with a plain TextInput `placeholder` prop
//   carrying the label text -- the resting-state screenshot matches exactly; only the "float up on
//   focus" animation itself is not reproduced. The related `focus-within:border-primary
//   focus-within:ring-1 focus-within:ring-primary` focus-feedback classes are dropped for the same
//   reason.
// - `md:font-headline-lg md:text-headline-lg` / `md:px-0` dropped: tablet/desktop-breakpoint
//   overrides with no equivalent on a native phone screen already at "mobile" size.
// - `hover:text-primary-fixed-variant` / `hover:bg-on-primary-fixed-variant` dropped throughout: no
//   hover state on touch devices.
// - Arbitrary `shadow-[...]` box-shadow values substituted with RN shadow*/elevation style props
//   carrying the same offset/blur-radius/color/opacity, as elsewhere in this batch.
//
// Phone/Email toggle: no source design exists for this (the source only ever shows a phone field).
// Built as a segmented control reusing this project's own established pattern for one --
// history.tsx's Completed/Cancelled tab pill. Switching to "Email" swaps the first field's icon
// ("call" -> "email"), placeholder, and keyboardType ("phone-pad" -> "email-address"); the Password
// field below is unaffected either way. Extracted into `@/components/login-method-toggle` so
// forgot-password.tsx can reuse the exact same component/logic rather than duplicating it -- see
// that file for the full root-cause writeup of a native-only crash this toggle originally caused
// (a NativeWind runtime "upgrade" triggered by a conditionally-interpolated className) and how the
// fix (a static className + a plain `style` prop for the active/inactive difference) avoids it.
//
// "Forgot Password?" now pushes forgot-password.tsx (was inert).
//
// "Login" now uses `router.replace` (not `push`) to dashboard.tsx, so a logged-in driver can't
// swipe-back into the login screen. TODO: this always-go-to-dashboard behavior is a placeholder --
// real behavior should call the login API first, then route based on the driver's actual
// verification status (approved -> dashboard, pending -> verification-status, rejected ->
// verification-status in its rejected state) instead of assuming approved every time. Going straight
// to dashboard is the right shortcut for now since that's the common case during testing, but this
// needs to be revisited once real auth exists.
//
// Vertical centering: removed. Content now flows naturally from the top of the screen, directly
// below the header, rather than being centered or pushed down -- no more flexGrow/justifyContent on
// the ScrollView's content container. Horizontal centering of the card is preserved via `mx-auto`
// (previously implicit via the container's `items-center`, which is gone now too).
export default function DriverLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("phone");

  return (
    <View className="flex-1 bg-surface">
      <View style={{ paddingTop: insets.top }} className="bg-surface">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={16} color={themeColors.primary} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Login
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-container-margin pb-stack-lg"
      >
        <View
          className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg"
          style={{
            shadowColor: "#111827",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.12,
            shadowRadius: 32,
            elevation: 12,
          }}
        >
          <View className="absolute left-0 top-0 h-1 w-full bg-primary-container" />

          <View className="mb-stack-lg items-center">
            <Text className="mb-stack-sm text-center font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
              Driver Login
            </Text>
            <Text className="font-body-md text-body-md text-on-surface-variant">
              Welcome back. Enter your details to hit the road.
            </Text>
          </View>

          <View className="gap-stack-md">
            <LoginMethodToggle value={loginMethod} onChange={setLoginMethod} />

            <View className="h-[56px] flex-row items-center rounded-lg bg-surface-container-low px-gutter">
              <MaterialIcons
                name={loginMethod === "phone" ? "call" : "email"}
                size={16}
                color={themeColors.onSurfaceVariant}
                style={{ marginRight: 8 }}
              />
              <TextInput
                className="h-full flex-1 bg-transparent font-body-md text-body-md text-on-surface"
                placeholder={loginMethod === "phone" ? "Phone Number" : "Email Address"}
                keyboardType={loginMethod === "phone" ? "phone-pad" : "email-address"}
              />
            </View>

            <View className="h-[56px] flex-row items-center rounded-lg bg-surface-container-low px-gutter">
              <MaterialIcons
                name="lock"
                size={16}
                color={themeColors.onSurfaceVariant}
                style={{ marginRight: 8 }}
              />
              <TextInput
                className="h-full flex-1 bg-transparent font-body-md text-body-md text-on-surface"
                placeholder="Password"
                secureTextEntry
              />
            </View>

            <View className="mt-stack-sm flex-row justify-end">
              <Text
                onPress={() => router.push("/(driver-auth)/forgot-password")}
                className="font-label-sm text-label-sm text-primary"
              >
                Forgot Password?
              </Text>
            </View>

            <Pressable
              onPress={() => router.replace("/(driver)/(tabs)/dashboard")}
              className="mt-stack-lg h-[56px] w-full flex-row items-center justify-center rounded-lg bg-primary active:scale-[0.98]"
              style={{
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <Text className="font-label-sm text-label-sm text-on-primary">Login</Text>
              <MaterialIcons
                name="arrow-forward"
                size={12}
                color={themeColors.onPrimary}
                style={{ marginLeft: 8 }}
              />
            </Pressable>
          </View>

          <View className="mt-stack-lg items-center">
            <Text className="font-body-md text-body-md text-on-surface-variant">
              Don&apos;t have an account?{" "}
              <Text
                onPress={() => router.push("/(driver-auth)/register")}
                className="ml-base font-label-sm text-label-sm text-primary"
              >
                Create Account
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
