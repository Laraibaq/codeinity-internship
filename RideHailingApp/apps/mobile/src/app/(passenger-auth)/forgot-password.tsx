import React, { useState } from "react";
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
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { passengerAuthApi } from "@/lib/api/passenger/auth";
import { getApiErrorMessage } from "@/lib/api-client";
import { normalizePhone } from "@/utils/phone";
import { passengerPasswordResetDraft } from "@/store/passenger/passenger-auth-store";

export default function PassengerForgotPasswordScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSend = async () => {
    setErrorMessage(null);
    const raw = phone.trim();
    if (!raw) {
      setErrorMessage("Please enter your phone number or email.");
      return;
    }

    const identifier = raw.includes("@") ? raw : normalizePhone(raw, "1");
    if (!raw.includes("@") && !/^\+?[1-9]\d{7,14}$/.test(identifier)) {
      setErrorMessage("Please enter a valid phone number.");
      return;
    }

    setSubmitting(true);
    try {
      await passengerAuthApi.requestPasswordReset(identifier);
      passengerPasswordResetDraft.identifier = identifier;
      passengerPasswordResetDraft.resetToken = undefined;
      router.push({
        pathname: "/(passenger-auth)/otp-verify" as any,
        params: { purpose: "password-reset", identifier },
      });
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Couldn't send reset code. Please try again.")
      );
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

      {/* Decorative ambient blobs */}
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      {/* Back button */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurface} />
        </Pressable>
      </View>

      {/* Main */}
      <View style={styles.main}>
        <View style={styles.card}>
          {/* Top gradient line */}
          <View style={styles.gradientLine} />

          {/* Icon + title */}
          <View style={styles.iconSection}>
            <View style={styles.iconBox}>
              <MaterialIcons name="lock-reset" size={32} color={themeColors.primary} />
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your phone number to receive a reset code.
            </Text>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={18} color="#ba1a1a" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Phone field */}
          <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
            <MaterialIcons
              name="phone-iphone"
              size={20}
              color={focused ? themeColors.primary : themeColors.outline}
              style={styles.inputIcon}
            />
            <TextInput
              value={phone}
              onChangeText={(text) => {
                setErrorMessage(null);
                setPhone(text);
              }}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={themeColors.outline}
              keyboardType="phone-pad"
              autoCapitalize="none"
              style={styles.input}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </View>

          {/* Send button */}
          <Pressable
            onPress={handleSend}
            disabled={submitting}
            style={({ pressed }) => [
              styles.btnSend,
              pressed && styles.pressed,
              submitting && { opacity: 0.6 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={themeColors.onPrimary} />
            ) : (
              <Text style={styles.btnSendText}>Send Code</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f9f9ff",
    overflow: "hidden",
  },
  blobTL: {
    position: "absolute",
    top: "-10%",
    left: "-10%",
    width: "60%",
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: themeColors.primaryContainer,
    opacity: 0.1,
  },
  blobBR: {
    position: "absolute",
    bottom: "-10%",
    right: "-10%",
    width: "50%",
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: themeColors.secondaryContainer,
    opacity: 0.15,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
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
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  card: {
    width: "100%",
    maxWidth: 448,
    backgroundColor: themeColors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 32,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.3)",
    overflow: "hidden",
  },
  gradientLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: themeColors.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  iconSection: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "rgba(79,70,229,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
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
    maxWidth: 280,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffdad6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#ba1a1a",
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 12,
    backgroundColor: themeColors.surfaceContainer,
    borderWidth: 1.5,
    borderColor: "transparent",
    marginBottom: 24,
  },
  inputRowFocused: {
    borderColor: themeColors.primary,
    backgroundColor: themeColors.surfaceContainerLowest,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: themeColors.onSurface,
    paddingHorizontal: 8,
    height: "100%",
  },
  btnSend: {
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
  btnSendText: {
    color: themeColors.onPrimary,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
