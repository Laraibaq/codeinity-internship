import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { passengerAuthApi } from "@/lib/api/passenger/auth";
import { getApiErrorMessage } from "@/lib/api-client";
import {
  passengerRegistrationDraft,
  passengerPasswordResetDraft,
  usePassengerAuthStore,
} from "@/store/passenger/passenger-auth-store";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 55;
const MAX_ATTEMPTS = 3;
const ERROR_COLOR = "#ba1a1a";
const ERROR_CONTAINER = "#ffdad6";
const ON_ERROR_CONTAINER = "#93000a";

export default function PassengerOtpVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ purpose?: string; identifier?: string }>();
  const isPasswordReset = params.purpose === "password-reset" || !!passengerPasswordResetDraft.identifier;

  const targetIdentifier = isPasswordReset
    ? passengerPasswordResetDraft.identifier || params.identifier || ""
    : passengerRegistrationDraft.phone || params.identifier || "";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [timeLeft, setTimeLeft] = useState(RESEND_SECONDS);
  const [resendVisible, setResendVisible] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Shake animation
  const shakeX = useSharedValue(0);

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-6, { duration: 60, easing: Easing.linear }),
      withTiming(6, { duration: 60, easing: Easing.linear }),
      withTiming(-6, { duration: 60, easing: Easing.linear }),
      withTiming(6, { duration: 60, easing: Easing.linear }),
      withTiming(-6, { duration: 60, easing: Easing.linear }),
      withTiming(0, { duration: 60, easing: Easing.linear })
    );
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setResendVisible(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleChangeText = (text: string, index: number) => {
    const char = text.slice(-1);
    if (!/^\d?$/.test(char)) return;

    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setErrorVisible(false);
    setErrorMessage(null);

    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length < OTP_LENGTH) {
      setErrorVisible(true);
      setErrorMessage("Enter the full 6-digit code.");
      triggerShake();
      return;
    }

    setVerifying(true);
    setErrorVisible(false);
    setErrorMessage(null);

    try {
      if (isPasswordReset) {
        const res = await passengerAuthApi.verifyPasswordReset({
          identifier: targetIdentifier,
          code,
        });
        passengerPasswordResetDraft.resetToken = res.resetToken;
        router.push("/(passenger-auth)/reset-password" as any);
      } else {
        await passengerAuthApi.verifyOtp({
          phone: targetIdentifier,
          code,
        });

        // Automatically log in with registration credentials to acquire real tokens
        if (passengerRegistrationDraft.password) {
          try {
            const loginRes = await passengerAuthApi.login({
              identifier: targetIdentifier,
              password: passengerRegistrationDraft.password,
            });
            passengerRegistrationDraft.pendingTokens = {
              accessToken: loginRes.accessToken,
              refreshToken: loginRes.refreshToken,
            };
            usePassengerAuthStore.getState().setProfile({
              id: "",
              fullName: passengerRegistrationDraft.name,
              email: passengerRegistrationDraft.email || "",
              phoneNumber: targetIdentifier,
            });
          } catch {
            // Fallback: will require login on welcome screen
          }
        }

        router.push("/(passenger-auth)/account-created" as any);
      }
    } catch (error) {
      setErrorVisible(true);
      const remaining = Math.max(0, attemptsLeft - 1);
      setAttemptsLeft(remaining);
      setErrorMessage(getApiErrorMessage(error, "Invalid or expired code. Please try again."));
      triggerShake();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setDigits(Array(OTP_LENGTH).fill(""));
    setTimeLeft(RESEND_SECONDS);
    setResendVisible(false);
    setErrorVisible(false);
    setErrorMessage(null);
    setAttemptsLeft(MAX_ATTEMPTS);
    inputRefs.current[0]?.focus();

    try {
      if (isPasswordReset) {
        await passengerAuthApi.requestPasswordReset(targetIdentifier);
      } else {
        await passengerAuthApi.requestOtp(targetIdentifier);
      }
    } catch (error) {
      setErrorVisible(true);
      setErrorMessage(getApiErrorMessage(error, "Failed to resend code. Please try again."));
    }
  };

  const formatTime = (secs: number) => `0:${secs.toString().padStart(2, "0")}`;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9ff" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityLabel="Go Back"
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurface} />
        </Pressable>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main */}
      <View style={styles.main}>
        {/* Error Icon Section (replaces phone icon when error) */}
        {errorVisible ? (
          <View style={styles.errorIconSection}>
            <View style={styles.errorIconCircle}>
              <MaterialIcons name="error" size={36} color={ON_ERROR_CONTAINER} />
            </View>
            <Text style={styles.title}>Invalid OTP</Text>
            <Text style={styles.subtitle}>
              We sent a code to{" "}
              <Text style={styles.phoneNumber}>{targetIdentifier || "+1 (555) 000-0000"}</Text>.
            </Text>
          </View>
        ) : (
          <View style={styles.iconSection}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="phonelink-lock" size={36} color={themeColors.onPrimaryContainer} />
            </View>
            <Text style={styles.title}>
              {isPasswordReset ? "Reset Verification" : "Verify Your Phone"}
            </Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{"\n"}
              <Text style={styles.phoneNumber}>{targetIdentifier || "+1 (555) 000-0000"}</Text>
            </Text>
          </View>
        )}

        {/* OTP Inputs (shakeable row) */}
        <Animated.View style={[styles.otpSection, shakeStyle]}>
          <View style={styles.otpRow}>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                value={digits[i]}
                onChangeText={(text) => handleChangeText(text, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => setFocusedIndex(null)}
                keyboardType="number-pad"
                maxLength={1}
                style={[
                  styles.otpInput,
                  focusedIndex === i && !errorVisible && styles.otpInputFocused,
                  digits[i] && !errorVisible && styles.otpInputFilled,
                  errorVisible && styles.otpInputError,
                ]}
                selectTextOnFocus
                accessibilityLabel={`Digit ${i + 1}`}
                autoFocus={i === 0}
              />
            ))}
          </View>

          {/* Error message */}
          {errorVisible && (
            <View style={styles.errorRow}>
              <MaterialIcons name="info" size={16} color={ERROR_COLOR} />
              <Text style={styles.errorText}>
                {errorMessage ||
                  (attemptsLeft > 0
                    ? `Invalid code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining.`
                    : "Invalid code. Please resend a new code.")}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Timer / Resend */}
        <View style={styles.timerSection}>
          <Text style={styles.timerLabel}>Didn't receive it?</Text>
          {!resendVisible ? (
            <Text style={styles.timerCountdown}>
              Resend code in{" "}
              <Text style={styles.timerBold}>{formatTime(timeLeft)}</Text>
            </Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text style={styles.resendBtn}>Resend</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Verify Button */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleVerify}
          disabled={verifying}
          style={({ pressed }) => [
            styles.btnVerify,
            pressed && styles.pressed,
            verifying && { opacity: 0.6 },
          ]}
        >
          {verifying ? (
            <ActivityIndicator size="small" color={themeColors.onPrimary} />
          ) : (
            <Text style={styles.btnVerifyText}>Verify Code</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f9f9ff",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: themeColors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  backBtnPressed: {
    backgroundColor: themeColors.surfaceContainerLow,
  },
  headerSpacer: {
    flex: 1,
  },
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: themeColors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  errorIconSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  errorIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ERROR_CONTAINER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "600",
    color: themeColors.onSurface,
    letterSpacing: -0.28,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
    textAlign: "center",
  },
  phoneNumber: {
    fontWeight: "600",
    color: themeColors.onSurface,
  },
  otpSection: {
    width: "100%",
    maxWidth: 384,
    alignItems: "center",
    marginBottom: 32,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  otpInput: {
    width: 44,
    height: 56,
    borderRadius: 12,
    backgroundColor: themeColors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: themeColors.outlineVariant,
    fontSize: 22,
    fontWeight: "700",
    color: themeColors.onSurface,
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  otpInputFocused: {
    borderColor: themeColors.primary,
    borderWidth: 2,
  },
  otpInputFilled: {
    borderColor: themeColors.primary,
  },
  otpInputError: {
    borderColor: ERROR_COLOR,
    color: ERROR_COLOR,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: ERROR_COLOR,
  },
  timerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timerLabel: {
    fontSize: 14,
    color: themeColors.onSurfaceVariant,
  },
  timerCountdown: {
    fontSize: 14,
    color: themeColors.onSurfaceVariant,
  },
  timerBold: {
    fontWeight: "600",
    color: themeColors.primary,
  },
  resendBtn: {
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.primary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 448,
    alignSelf: "center",
  },
  btnVerify: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(53,37,205,1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  btnVerifyText: {
    color: themeColors.onPrimary,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
