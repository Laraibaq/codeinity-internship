import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// The missing step between forgot-password.tsx ("Send Code") and reset-password.tsx ("Create New
// Password") -- there was previously no screen to actually enter the code. No source design exists
// for this screen; it duplicates verify-phone.tsx's OTP-box mechanic (6-digit auto-advance/auto-back,
// 30s resend countdown, Keyboard.dismiss() after the 6th digit -- see that file for the original
// rationale, e.g. why this uses `useRef<TextInput | null>[]` rather than DOM focus()) with
// password-reset-specific copy and destination instead of registration's, since the two screens
// otherwise serve different flows.
//
// `method`/`value` arrive as route params from forgot-password.tsx (a single hop, so a plain param
// is simpler here than the module-level draft object register.tsx/verify-phone.tsx use for their
// much longer ~9-screen gap) and are shown in the "We sent a code to..." line: the phone number is
// shown in full (matching verify-phone.tsx's own unmasked convention), the email is lightly masked
// (first 2 characters + "**" + domain) since unlike a phone number typed on the previous screen, a
// full email is more identifying to leave in plaintext on a code-entry screen.
//
// "Verify" pushes reset-password.tsx, same as verify-phone.tsx's own "Verify" button pushes its
// destination with no loading spinner -- it's a plain navigation, not a local state swap or a
// submission this screen owns.

const OTP_LENGTH = 6;

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain || local.length <= 2) return email;
  return `${local.slice(0, 2)}${"*".repeat(Math.max(local.length - 2, 2))}@${domain}`;
}

export default function ResetPasswordVerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ method?: string; value?: string }>();
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
  const method = params.method === "email" ? "email" : "phone";
  const rawValue = params.value?.trim() ?? "";
  const destinationDisplay = rawValue
    ? method === "email"
      ? maskEmail(rawValue)
      : `+1 ${rawValue}`
    : method === "email"
      ? "your email"
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
            Reset Password
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="mx-auto w-full max-w-md flex-grow items-center px-container-margin py-stack-md pt-stack-lg">
        <View className="mb-stack-lg items-center">
          <Text className="mb-stack-sm text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Enter verification code
          </Text>
          <Text className="text-center font-body-md text-on-surface-variant">
            {"Enter the code we sent to reset your password to \n"}
            <Text className="font-bold text-on-surface">{destinationDisplay}</Text>
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
          onPress={() => router.push("/(driver-auth)/reset-password")}
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
          <Pressable disabled={timeLeft > 0} onPress={() => setTimeLeft(30)} className="ml-1">
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
