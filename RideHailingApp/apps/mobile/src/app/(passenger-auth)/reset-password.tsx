import React, { useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { passengerAuthApi } from "@/lib/api/passenger/auth";
import { getApiErrorMessage } from "@/lib/api-client";
import { passengerPasswordResetDraft } from "@/store/passenger/passenger-auth-store";

export default function PassengerResetPasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<"new" | "confirm" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetToken = passengerPasswordResetDraft.resetToken;

  const handleReset = async () => {
    setErrorMessage(null);

    if (!resetToken) {
      setErrorMessage("Reset session expired. Please request a new code.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await passengerAuthApi.confirmPasswordReset({
        resetToken,
        password: newPassword,
      });
      passengerPasswordResetDraft.resetToken = undefined;
      passengerPasswordResetDraft.identifier = "";
      router.replace("/(passenger-auth)/login");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Couldn't update password. Please try again.")
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

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.brand}>Ryde</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Create a new strong password for your account.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={18} color="#ba1a1a" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* New Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>NEW PASSWORD</Text>
            <View style={[styles.inputRow, focusedField === "new" && styles.inputRowFocused]}>
              <MaterialIcons
                name="lock"
                size={22}
                color={themeColors.outline}
                style={styles.inputIcon}
              />
              <TextInput
                value={newPassword}
                onChangeText={(text) => {
                  setErrorMessage(null);
                  setNewPassword(text);
                }}
                placeholder="••••••••"
                placeholderTextColor={themeColors.outline}
                secureTextEntry={!showNew}
                style={styles.input}
                onFocus={() => setFocusedField("new")}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable
                onPress={() => setShowNew((v) => !v)}
                style={styles.eyeBtn}
              >
                <MaterialIcons
                  name={showNew ? "visibility" : "visibility-off"}
                  size={20}
                  color={themeColors.outline}
                />
              </Pressable>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <View style={[styles.inputRow, focusedField === "confirm" && styles.inputRowFocused]}>
              <MaterialIcons
                name="lock"
                size={22}
                color={themeColors.outline}
                style={styles.inputIcon}
              />
              <TextInput
                value={confirmPassword}
                onChangeText={(text) => {
                  setErrorMessage(null);
                  setConfirmPassword(text);
                }}
                placeholder="••••••••"
                placeholderTextColor={themeColors.outline}
                secureTextEntry={!showConfirm}
                style={styles.input}
                onFocus={() => setFocusedField("confirm")}
                onBlur={() => setFocusedField(null)}
              />
              <Pressable
                onPress={() => setShowConfirm((v) => !v)}
                style={styles.eyeBtn}
              >
                <MaterialIcons
                  name={showConfirm ? "visibility" : "visibility-off"}
                  size={20}
                  color={themeColors.outline}
                />
              </Pressable>
            </View>
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleReset}
            disabled={submitting}
            style={({ pressed }) => [
              styles.btnReset,
              pressed && styles.pressed,
              submitting && { opacity: 0.6 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={themeColors.onPrimary} />
            ) : (
              <Text style={styles.btnResetText}>RESET PASSWORD</Text>
            )}
          </Pressable>

          {/* Back to Login */}
          <Pressable
            onPress={() => router.replace("/(passenger-auth)/login")}
            style={styles.backRow}
          >
            <MaterialIcons name="arrow-back" size={16} color={themeColors.primary} />
            <Text style={styles.backText}>Back to Login</Text>
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
  },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 48,
  },
  headerBlock: {
    alignItems: "center",
    marginBottom: 32,
  },
  brand: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
    color: themeColors.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "600",
    color: themeColors.onSurface,
    letterSpacing: -0.28,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
    textAlign: "center",
    maxWidth: 280,
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
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: themeColors.onSurfaceVariant,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 12,
    backgroundColor: themeColors.surfaceContainer,
    borderWidth: 1.5,
    borderColor: "transparent",
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
  eyeBtn: {
    padding: 12,
    marginRight: 4,
  },
  btnReset: {
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
    marginTop: 8,
    marginBottom: 24,
  },
  btnResetText: {
    color: themeColors.onPrimary,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.primary,
  },
});
