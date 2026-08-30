import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// Fixed (Root Cause B of this batch): the form card (2 password fields + requirements list +
// button) wasn't in a ScrollView, sitting in a plain centered View below the fixed header -- on a
// shorter device, or with the keyboard open over either password field, content could be cut off
// with no way to reach it. Wrapped in a ScrollView. The success/failure content now lives in a
// `<Modal>` rather than the ScrollView (see the "Success/failure presentation" note below).
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this batch. Explicit
//   text-size classes map directly (text-3xl -> 30, text-[16px] -> 16, text-[20px] -> 20,
//   text-4xl -> 36); the lock/lock_clock field icons have no explicit size class and inherit the
//   body's own `text-body-md` (16px), which this screen sets directly (unlike some earlier screens
//   that only set a font-family token on body).
// - `position: fixed` on the header has no RN equivalent; substituted with `absolute` pinned to the
//   screen edges, as on every fixed-header screen in this project; `main`'s existing `pt-24` already
//   compensates for the header's height, so no extra offset was needed.
// - `hover:*` / `transition-*` / `duration-*` dropped throughout: no hover state on touch devices,
//   no RN equivalent for CSS transitions.
// - The two ambient background blobs use `blur-[100px]`/`blur-[120px]` (CSS filter:blur on solid
//   circles); RN Views have no blur-filter support, substituted with plain flat-color circles at
//   the same size/position/opacity, same treatment as the dropped blurred blobs in
//   onboarding-earnings.tsx.
// - `.glass-panel` (translucent background + backdrop-filter: blur) substituted with expo-blur's
//   <BlurView>, same pattern as onboarding-negotiation.tsx/onboarding-earnings.tsx. Its custom
//   `border: 1px solid rgba(226,226,228,0.5)` doesn't match any existing named color token, so it's
//   kept as a literal arbitrary rgba value rather than approximated to the closest token.
// - On both password inputs, the source's focus state is `focus:ring-2 focus:ring-primary
//   focus:border-transparent` -- i.e. the border is meant to disappear on focus and the (dropped)
//   ring becomes the only focus indicator. Since dropping the ring here with no substitute would
//   leave these two fields with zero focus feedback at all (unlike other screens, where the border
//   already provided feedback independent of the ring), this instead reuses this project's
//   established ring -> border-color substitute (`focus:border-primary`) rather than the source's
//   literal `focus:border-transparent`, so the fields still show *some* focus feedback, consistent
//   with every other input field in this project.
// - The success icon's `bg-emerald-50` / `text-emerald-600` are Tailwind's own default palette
//   (available since tailwind.config.js only `extend`s colors, it doesn't replace the default
//   scale), not one of this project's custom design tokens; `text-emerald-600`'s hex (#059669) is
//   hardcoded for the MaterialIcons `color` prop since that can't take a className.
//
// Rule 5 approved presentation state on this screen:
// - The success icon's `animate-ping` pulse ring is dropped; the circle renders static, same
//   treatment as the dropped pulsing-blob animation in onboarding-earnings.tsx.
// - The two password-requirement lines have no live validation in the source (no JS ever toggles
//   them) and are rendered as static text with their default unchecked/outline styling, unchanged.
//
// Success/failure presentation: previously a `useState<"form" | "success">` that replaced the whole
// screen's content on success (see git history), with a loading state (disabled button, spinner +
// "Resetting...") added ahead of that swap to fix the same abrupt-swap issue found on
// verification-status.tsx/counter-offer.tsx/dashboard.tsx. Per explicit correction, the result is now
// presented as a `<Modal>` on top of the still-mounted form instead of a route/content change --
// this also means "Try Again" on failure naturally leaves the user's typed passwords intact, since
// the form underneath was never unmounted. Failure has no source design (there's no source for it at
// all); built to match the success modal's own card style (icon circle, heading, body copy, single
// full-width button) with an error icon/copy instead of the checkmark.
//
// Success-vs-failure is decided locally with a placeholder rule (mismatched passwords fail,
// everything else succeeds) -- see handleResetPassword's TODO for the real API response this should
// be replaced with once backend wiring exists.

export default function DriverResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalState, setModalState] = useState<"none" | "success" | "failure">("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = () => {
    setIsSubmitting(true);
    // TODO: this delay -- and the success/failure decision below -- are placeholders standing in
    // for the real password-reset API call and its response. Remove the setTimeout and the
    // mismatched-passwords check once that exists -- the loading-state UX (disabled button, spinner,
    // "Resetting...") and the success/failure modals should stay and just react to the real request
    // instead.
    setTimeout(() => {
      setIsSubmitting(false);
      setModalState(newPassword && newPassword === confirmPassword ? "success" : "failure");
    }, 900);
  };

  return (
    <View className="relative min-h-screen flex-1 overflow-hidden bg-background">
      <View className="absolute inset-0 z-0" pointerEvents="none">
        <View className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary-container opacity-20" />
        <View className="absolute bottom-0 right-0 h-[500px] w-[500px] translate-x-1/3 translate-y-1/3 rounded-full bg-secondary-container opacity-30" />
      </View>

      <View
        style={{ paddingTop: insets.top }}
        className="absolute left-0 right-0 top-0 z-50 w-full bg-surface"
      >
        <View className="h-16 w-full flex-row items-center px-container-margin">
          <View className="flex-row items-center gap-4">
            <Pressable
              onPress={() => router.back()}
              className="items-center justify-center rounded-full p-2 active:scale-95"
            >
              <MaterialIcons name="arrow-back" size={16} color={themeColors.primary} />
            </Pressable>
            <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
              Reset Password
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="z-10 mx-auto w-full max-w-md flex-1"
        contentContainerClassName="flex-grow items-center justify-center px-container-margin pb-stack-lg"
        contentContainerStyle={{ paddingTop: 96 + insets.top }}
      >
        <View
          className="w-full overflow-hidden rounded-xl border border-[rgba(226,226,228,0.5)] p-stack-md"
          style={{
            shadowColor: "#111827",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.12,
            shadowRadius: 32,
            elevation: 12,
          }}
        >
          <BlurView
            intensity={70}
            tint="light"
            experimentalBlurMethod="dimezisBlurView"
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View className="mb-stack-lg items-center">
            <View className="mb-stack-sm h-16 w-16 items-center justify-center rounded-full bg-surface-container-high">
              <MaterialIcons name="lock-reset" size={30} color={themeColors.primary} />
            </View>
            <Text className="mb-base text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              Create New Password
            </Text>
            <Text className="text-center font-body-md text-body-md text-on-surface-variant">
              Your new password must be different from previous used passwords.
            </Text>
          </View>

          <View className="gap-stack-sm">
            <View className="gap-base">
              <Text className="font-label-sm text-label-sm text-on-surface">New Password</Text>
              <View className="relative">
                <View
                  className="absolute inset-y-0 left-0 z-10 justify-center pl-4"
                  pointerEvents="none"
                >
                  <MaterialIcons name="lock" size={16} color={themeColors.outline} />
                </View>
                <TextInput
                  className="h-14 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-12 pr-12 text-on-surface focus:border-primary"
                  placeholder="Enter new password"
                  placeholderTextColor={themeColors.outline}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <Pressable
                  onPress={() => setShowNewPassword((value) => !value)}
                  hitSlop={8}
                  className="absolute inset-y-0 right-0 z-10 justify-center pr-4"
                >
                  <MaterialIcons
                    name={showNewPassword ? "visibility-off" : "visibility"}
                    size={16}
                    color={themeColors.outline}
                  />
                </Pressable>
              </View>
            </View>

            <View className="mt-2 gap-base">
              <Text className="font-label-sm text-label-sm text-on-surface">
                Confirm Password
              </Text>
              <View className="relative">
                <View
                  className="absolute inset-y-0 left-0 z-10 justify-center pl-4"
                  pointerEvents="none"
                >
                  <MaterialIcons name="lock-clock" size={16} color={themeColors.outline} />
                </View>
                <TextInput
                  className="h-14 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-12 pr-12 text-on-surface focus:border-primary"
                  placeholder="Confirm new password"
                  placeholderTextColor={themeColors.outline}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((value) => !value)}
                  hitSlop={8}
                  className="absolute inset-y-0 right-0 z-10 justify-center pr-4"
                >
                  <MaterialIcons
                    name={showConfirmPassword ? "visibility-off" : "visibility"}
                    size={16}
                    color={themeColors.outline}
                  />
                </Pressable>
              </View>
            </View>

            <View className="mb-stack-sm mt-2 gap-1 px-2">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="check-circle" size={16} color={themeColors.outline} />
                <Text className="font-label-sm text-label-sm text-on-surface-variant">
                  At least 8 characters
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="check-circle" size={16} color={themeColors.outline} />
                <Text className="font-label-sm text-label-sm text-on-surface-variant">
                  Contains a number or symbol
                </Text>
              </View>
            </View>

            {/* Fixed: className used to interpolate `isSubmitting ? "opacity-70" : ""` into a
                template literal -- the same NativeWind runtime anti-pattern root-caused on
                login.tsx's phone/email toggle. className is now static; the isSubmitting-dependent
                opacity is folded into the existing `style` prop instead. */}
            <Pressable
              onPress={handleResetPassword}
              disabled={isSubmitting}
              className="mt-4 h-14 w-full flex-row items-center justify-center gap-2 rounded-lg bg-primary active:scale-[0.98]"
              style={{
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
                elevation: 4,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color={themeColors.onPrimary} />
                  <Text className="font-body-md text-body-md font-semibold text-on-primary">
                    Resetting...
                  </Text>
                </>
              ) : (
                <>
                  <Text className="font-body-md text-body-md font-semibold text-on-primary">
                    Reset Password
                  </Text>
                  <MaterialIcons name="arrow-forward" size={20} color={themeColors.onPrimary} />
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={modalState !== "none"}
        onRequestClose={() => setModalState("none")}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-container-margin">
          {modalState === "success" ? (
            <View
              className="w-full max-w-sm items-center overflow-hidden rounded-xl border border-[rgba(226,226,228,0.5)] p-stack-lg"
              style={{
                shadowColor: "#111827",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.12,
                shadowRadius: 32,
                elevation: 12,
              }}
            >
              <BlurView
                intensity={70}
                tint="light"
                experimentalBlurMethod="dimezisBlurView"
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <View className="mb-stack-md h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                <MaterialIcons name="check-circle" size={36} color="#059669" />
              </View>
              <Text className="mb-stack-sm text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Password Updated
              </Text>
              <Text className="mb-stack-lg text-center font-body-md text-body-md text-on-surface-variant">
                Your password has been reset successfully. You can now log in with your new
                credentials.
              </Text>
              <Pressable
                onPress={() => {
                  setModalState("none");
                  router.push("/(driver-auth)/login");
                }}
                className="h-14 w-full items-center justify-center rounded-lg bg-primary active:scale-[0.98]"
                style={{
                  shadowColor: "#000000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <Text className="font-body-md text-body-md font-semibold text-on-primary">
                  Back to Login
                </Text>
              </Pressable>
            </View>
          ) : modalState === "failure" ? (
            <View
              className="w-full max-w-sm items-center overflow-hidden rounded-xl border border-[rgba(226,226,228,0.5)] p-stack-lg"
              style={{
                shadowColor: "#111827",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.12,
                shadowRadius: 32,
                elevation: 12,
              }}
            >
              <BlurView
                intensity={70}
                tint="light"
                experimentalBlurMethod="dimezisBlurView"
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <View className="mb-stack-md h-20 w-20 items-center justify-center rounded-full bg-error-container">
                <MaterialIcons name="error" size={36} color={themeColors.error} />
              </View>
              <Text className="mb-stack-sm text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Couldn&apos;t Update Password
              </Text>
              <Text className="mb-stack-lg text-center font-body-md text-body-md text-on-surface-variant">
                Something went wrong resetting your password. Please try again.
              </Text>
              <Pressable
                onPress={() => setModalState("none")}
                className="h-14 w-full items-center justify-center rounded-lg bg-primary active:scale-[0.98]"
                style={{
                  shadowColor: "#000000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <Text className="font-body-md text-body-md font-semibold text-on-primary">
                  Try Again
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
