import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { registrationDraft } from "@/utils/registration-draft";

// The header's <h1> originally read "Driver Registration" -- the same copy-pasted-header pattern
// already found (and fixed) on forgot-password.tsx, inconsistent with this screen's own <title>
// ("Driver Phone Verification") and content. Now corrected to "Verify Phone" per explicit
// instruction.
//
// Fixed: the phone number shown was hardcoded ("+1 (555) 123-4567"); now reads from
// `registrationDraft.phone`, set by register.tsx right before it navigates directly into this
// screen (see that file/registration-draft.ts for why a module-level object rather than a route
// param). Falls back to a neutral "your phone" if empty (e.g. reached via a deep link that skipped
// register.tsx) rather than showing a fake number.
//
// Flow reorder: phone verification moved to immediately after account creation, instead of after
// all the document/vehicle screens -- register.tsx now pushes here directly, and "Verify" now
// pushes register-personal-info.tsx (the first of those screens) instead of
// (driver)/verification-status, which used to be this screen's destination back when it was last
// in the sequence. Added a "Step 1 of 10" indicator (this screen previously had none). Every screen
// in the flow has its own unique, sequential step number -- no two screens share a step (License
// Details/Upload and Vehicle Type/Model/Color used to; that sharing was fixed as a step-numbering
// bug). Total is now 10 (was 9) since register-vehicle-photos.tsx was added as the new last screen
// -- see register-identity-document.tsx's header comment for the full new order and step numbers.
//
// Fixed: there was a large gap between the header and "Verify your phone" -- this container used
// `justify-center`, vertically centering all its content in the remaining screen space, which
// pushes everything down substantially on a normal-height phone with this little content. Changed
// to top-anchored (`pt-stack-lg`, no `justify-center`), matching forgot-password.tsx's layout for
// the same kind of single-purpose auth-action screen.
//
// Fixed: "Resend" was already wired correctly (`setTimeLeft(30)` on press, disabled while the
// countdown is running) -- no change needed there, kept as-is.
//
// Fixed: the keyboard didn't dismiss after the 6th digit -- `Keyboard.dismiss()` is now called
// once all `OTP_LENGTH` digits are filled.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this batch. The back-arrow
//   icon has no explicit size class, so it inherits the page's default 16px (body sets only
//   font-body-md, a font-family token, not a size).
// - `docked full-width top-0 flat no shadows` on the header are inert non-Tailwind words (same
//   artifact as elsewhere in this project) -- dropped silently, zero effect either way.
// - `dark:` variants dropped: no dark-mode toggle in this UI shell.
// - `hover:*` / `transition-colors` / `duration-*` dropped throughout: no hover state on touch
//   devices, no RN equivalent for CSS transitions.
// - `focus:ring-2 focus:ring-primary` on the OTP inputs dropped (compound box-shadow, no reliable
//   NativeWind translation); `focus:border-primary` (supported) already provides focus feedback.
// - The `<br/>` between "We sent a 6-digit code to" and the phone number is NOT behind a responsive
//   `hidden`/`sm:block` class here (unlike the similar-looking case in register.tsx), so it's an
//   unconditional line break at every size -- rendered as a literal "\n" in the Text content.
// - The `.otp-input` CSS hiding number-input spin buttons is dead code in the source itself: these
//   inputs use `type="text"`, not `type="number"`, so that CSS never had any effect to begin with;
//   not translated since there's nothing to translate.
//
// Rule 5 approved presentation state on this screen:
// - OTP auto-advance/auto-back and the 6 digit values: local `useState<string[]>` plus a ref per
//   input (RN has no `document.querySelectorAll`/DOM focus() the source script used, so this uses
//   `useRef<TextInput | null>[]` and each ref's own `.focus()`).
// - The 30s resend countdown/enable-disable: local `useState<number>` + `useEffect`/`setTimeout`.
//   Tapping "Resend Code" once enabled restarts the countdown at 30 -- the source's timer clearly
//   implies this as the resend action's visible effect, so it's included as the natural completion
//   of the approved countdown state, not an added feature.

const OTP_LENGTH = 6;

export default function DriverVerifyPhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [timeLeft, setTimeLeft] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft]);

  const handleChangeDigit = (index: number, value: string) => {
    const digit = value.slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      if (next.every((d) => d)) {
        Keyboard.dismiss();
      }
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const seconds = timeLeft < 10 ? `0${timeLeft}` : `${timeLeft}`;
  const phoneDisplay = registrationDraft.phone.trim()
    ? `+1 ${registrationDraft.phone.trim()}`
    : "your phone";

  return (
    <View className="min-h-screen flex-1 bg-surface">
      <View style={{ paddingTop: insets.top }} className="bg-surface">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          <Pressable
            onPress={() => router.back()}
            className="-ml-2 items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={16} color={themeColors.primary} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Verify Phone
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="gap-2 px-container-margin pb-stack-sm pt-stack-md">
        <View className="flex-row items-center justify-between">
          <Text className="font-label-sm text-label-sm text-on-surface-variant">Step 1 of 10</Text>
          <Text className="font-label-sm text-label-sm font-bold text-primary">Phone Verification</Text>
        </View>
        <View className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <View className="h-full rounded-full bg-primary" style={{ width: "10%" }} />
        </View>
      </View>

      <View className="mx-auto w-full max-w-md flex-grow items-center px-container-margin py-stack-md pt-stack-lg">
        <View className="mb-stack-lg items-center">
          <Text className="mb-stack-sm text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Verify your phone
          </Text>
          <Text className="text-center font-body-md text-on-surface-variant">
            {"We sent a 6-digit code to \n"}
            <Text className="font-bold text-on-surface">{phoneDisplay}</Text>
          </Text>
        </View>

        <View className="mb-stack-lg w-full max-w-[320px] flex-row justify-between gap-2">
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              autoFocus={index === 0}
              className="h-14 w-12 rounded-lg border border-outline-variant bg-surface-container-low text-center font-fare-display text-fare-display focus:border-primary"
              value={digit}
              onChangeText={(value) => handleChangeDigit(index, value)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              keyboardType="numeric"
              maxLength={1}
            />
          ))}
        </View>

        <Pressable
          onPress={() => router.push("/(driver-auth)/register-personal-info")}
          className="mb-stack-md w-full items-center justify-center rounded-xl bg-primary py-4 shadow-lg active:scale-95"
        >
          <Text className="font-label-sm text-label-sm text-on-primary">Verify</Text>
        </Pressable>

        <View className="flex-row items-center justify-center">
          <Text className="font-label-sm text-label-sm text-on-surface-variant">
            Didn&apos;t receive the code?
          </Text>
          {/* Fixed: className used to interpolate the countdown state into a template literal --
              the same NativeWind runtime anti-pattern root-caused on login.tsx's phone/email
              toggle. className is now static; the color/underline difference moves to a plain
              `style` prop instead. */}
          <Pressable
            disabled={timeLeft > 0}
            onPress={() => setTimeLeft(30)}
            className="ml-1"
          >
            <Text
              className="font-label-sm text-label-sm font-bold"
              style={{
                color: timeLeft > 0 ? themeColors.outlineVariant : themeColors.primary,
                textDecorationLine: timeLeft > 0 ? "none" : "underline",
              }}
            >
              {timeLeft > 0 ? `Resend in 00:${seconds}` : "Resend Code"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
