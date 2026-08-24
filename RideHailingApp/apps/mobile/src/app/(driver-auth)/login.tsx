import { Pressable, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { themeColors } from "@/constants/theme-colors";

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

export default function DriverLoginScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-surface px-container-margin">
      <View
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg"
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
          <View className="h-[56px] flex-row items-center rounded-lg bg-surface-container-low px-gutter">
            <MaterialIcons
              name="call"
              size={16}
              color={themeColors.onSurfaceVariant}
              style={{ marginRight: 8 }}
            />
            <TextInput
              className="h-full flex-1 bg-transparent font-body-md text-body-md text-on-surface"
              placeholder="Phone Number"
              keyboardType="phone-pad"
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
            <Text className="font-label-sm text-label-sm text-primary">Forgot Password?</Text>
          </View>

          <Pressable
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
            <Text className="ml-base font-label-sm text-label-sm text-primary">
              Create Account
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
