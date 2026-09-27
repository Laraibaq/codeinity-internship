import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { themeColors } from "@/constants/theme-colors";
import { passengerAuthApi } from "@/lib/api/passenger/auth";
import { useAuthStore } from "@/store/auth-store";
import { normalizePhone } from "@/utils/phone";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-client";

const ERROR_COLOR = "#ba1a1a";
const ERROR_CONTAINER = "#ffdad6";
const ON_ERROR_CONTAINER = "#93000a";

// "Remember me" only remembers the identifier field (phone/email) for next launch -- it does not
// change token lifetime or storage. The app already keeps you signed in across restarts via the
// refresh token api-client.ts stores in SecureStore regardless of this toggle; what this actually
// saves the user is retyping their phone number on a device they trust, on their next *deliberate*
// login (e.g. after a manual sign-out). Stored in SecureStore, same as the auth tokens, rather than
// a less-protected store, since a phone number is still identifying information.
const REMEMBERED_IDENTIFIER_KEY = "passengerRememberedIdentifier";

export default function PassengerLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(REMEMBERED_IDENTIFIER_KEY)
      .then((saved) => {
        if (saved) setPhone(saved);
      })
      .catch(() => {
        // No stored value, or SecureStore unavailable on this device -- just start with an empty field.
      });
  }, []);

  const handleLogin = async () => {
    setHasError(false);
    setErrorMessage(null);

    const raw = phone.trim();
    if (!raw) {
      setHasError(true);
      setErrorMessage("Please enter your phone number.");
      return;
    }

    if (!password) {
      setHasError(true);
      setErrorMessage("Please enter your password.");
      return;
    }

    const identifier = raw.includes("@") ? raw : normalizePhone(raw, "1");

    setSubmitting(true);
    try {
      const data = await passengerAuthApi.login({ identifier, password });

      if (data.role !== "passenger") {
        setHasError(true);
        setErrorMessage("This account is registered as a driver. Please use the driver login.");
        return;
      }

      if (rememberMe) {
        await SecureStore.setItemAsync(REMEMBERED_IDENTIFIER_KEY, raw).catch(() => undefined);
      } else {
        await SecureStore.deleteItemAsync(REMEMBERED_IDENTIFIER_KEY).catch(() => undefined);
      }

      await useAuthStore.getState().login(data);
      router.replace("/(passenger)/home");
    } catch (error) {
      setHasError(true);
      const status = getApiErrorStatus(error);
      if (status === 401) {
        setErrorMessage("Invalid phone number or password. Please try again.");
      } else {
        setErrorMessage(
          getApiErrorMessage(error, "Invalid phone number or password. Please try again.")
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9ff" />

      {/* Radial ambient gradient */}
      <View style={styles.radialBg} />

      {/* Top header */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top + 8, 20),
            height: Math.max(insets.top + 56, 64),
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.topBrand}>Ryde</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Error Banner */}
        {hasError && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error" size={20} color={ERROR_COLOR} style={styles.errorBannerIcon} />
            <Text style={styles.errorBannerText}>
              {errorMessage || "Invalid phone number or password. Please try again."}
            </Text>
          </View>
        )}

        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{hasError ? "Login Error" : "Login"}</Text>
          <Text style={styles.subtitle}>Welcome back to Ryde. Let's get you moving.</Text>
        </View>

        {/* Phone Number Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View
            style={[
              styles.inputRow,
              phoneFocused && !hasError && styles.inputRowFocused,
              hasError && styles.inputRowError,
            ]}
          >
            <Text style={styles.phonePrefix}>+1</Text>
            <TextInput
              value={phone}
              onChangeText={(text) => {
                setHasError(false);
                setErrorMessage(null);
                setPhone(text);
              }}
              placeholder="000-000-0000"
              placeholderTextColor={themeColors.outline}
              keyboardType="phone-pad"
              style={styles.input}
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
              aria-invalid={hasError}
            />
            {hasError && (
              <MaterialIcons name="error" size={22} color={ERROR_COLOR} style={styles.trailingIcon} />
            )}
          </View>
          {hasError && (
            <Text style={styles.fieldError}>{errorMessage || "Please check your phone number."}</Text>
          )}
        </View>

        {/* Password Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.passwordLabelRow}>
            <Text style={styles.label}>Password</Text>
            <Pressable onPress={() => router.push("/(passenger-auth)/forgot-password")}>
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </Pressable>
          </View>
          <View
            style={[
              styles.inputRow,
              passwordFocused && !hasError && styles.inputRowFocused,
              hasError && styles.inputRowError,
            ]}
          >
            <TextInput
              value={password}
              onChangeText={(text) => {
                setHasError(false);
                setErrorMessage(null);
                setPassword(text);
              }}
              placeholder="Enter your password"
              placeholderTextColor={themeColors.outline}
              secureTextEntry={!showPassword}
              style={styles.input}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              aria-invalid={hasError}
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              style={styles.visibilityBtn}
            >
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={22}
                color={themeColors.onSurfaceVariant}
              />
            </Pressable>
          </View>
        </View>

        {/* Remember Me */}
        <Pressable
          onPress={() => setRememberMe((v) => !v)}
          style={styles.rememberRow}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberMe }}
          accessibilityLabel="Remember me"
        >
          <MaterialIcons
            name={rememberMe ? "check-box" : "check-box-outline-blank"}
            size={20}
            color={rememberMe ? themeColors.primary : themeColors.outline}
          />
          <Text style={styles.rememberText}>Remember me</Text>
        </Pressable>

        {/* Continue Button */}
        <Pressable
          onPress={handleLogin}
          disabled={submitting}
          style={({ pressed }) => [
            styles.btnContinue,
            pressed && styles.pressed,
            submitting && { opacity: 0.6 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={themeColors.onPrimary} />
          ) : (
            <>
              <Text style={styles.btnContinueText}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={20} color={themeColors.onPrimary} />
            </>
          )}
        </Pressable>

        {/* Sign Up Link */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <Pressable onPress={() => router.push("/(passenger-auth)/register")}>
            <Text style={styles.signupLink}>Sign up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f9f9ff",
    overflow: "hidden",
  },
  radialBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "rgba(77,68,227,0.03)",
    pointerEvents: "none",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  topBrand: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: themeColors.primary,
    letterSpacing: -0.28,
  },
  spacer: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 448,
    alignSelf: "center",
    width: "100%",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: ERROR_CONTAINER,
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  errorBannerIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: ON_ERROR_CONTAINER,
  },
  titleBlock: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "600",
    color: themeColors.onSurface,
    letterSpacing: -0.28,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
  },
  fieldGroup: {
    marginBottom: 24,
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.onSurfaceVariant,
    lineHeight: 16,
  },
  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.primary,
    lineHeight: 16,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  rememberText: {
    fontSize: 14,
    color: themeColors.onSurfaceVariant,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    height: 56,
  },
  inputRowFocused: {
    borderColor: themeColors.primary,
    backgroundColor: "#f9f9ff",
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  inputRowError: {
    borderColor: ERROR_COLOR,
    backgroundColor: "#f9f9ff",
    shadowColor: ERROR_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  phonePrefix: {
    fontSize: 16,
    color: themeColors.onSurfaceVariant,
    paddingLeft: 16,
    paddingRight: 4,
    lineHeight: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: themeColors.onSurface,
    paddingHorizontal: 8,
    height: "100%",
    paddingLeft: 4,
  },
  trailingIcon: {
    paddingRight: 14,
  },
  visibilityBtn: {
    paddingHorizontal: 14,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldError: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: ERROR_COLOR,
    lineHeight: 16,
    marginTop: 4,
  },
  btnContinue: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  btnContinueText: {
    color: themeColors.onPrimary,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  signupText: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
  },
  signupLink: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: themeColors.primary,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
