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
import { normalizePhone } from "@/utils/phone";
import { passengerAuthApi } from "@/lib/api/passenger/auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-client";
import { passengerRegistrationDraft } from "@/store/passenger/passenger-auth-store";

interface Field {
  key: keyof typeof initialValues;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  keyboardType?: "default" | "phone-pad" | "email-address";
  secureTextEntry?: boolean;
  autoComplete?: "name" | "tel" | "email" | "password" | "new-password";
}

const initialValues = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const FIELDS: Field[] = [
  { key: "fullName", label: "Full Name", icon: "person", autoComplete: "name" },
  { key: "phone", label: "Phone Number", icon: "phone", keyboardType: "phone-pad", autoComplete: "tel" },
  { key: "email", label: "Email", icon: "mail", keyboardType: "email-address", autoComplete: "email" },
  { key: "password", label: "Password", icon: "lock", secureTextEntry: true, autoComplete: "new-password" },
  { key: "confirmPassword", label: "Confirm Password", icon: "lock", secureTextEntry: true, autoComplete: "new-password" },
];

export default function PassengerRegisterScreen() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [focused, setFocused] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSecure = (field: Field) => {
    if (!field.secureTextEntry) return false;
    if (field.key === "password") return !showPassword;
    if (field.key === "confirmPassword") return !showConfirm;
    return true;
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    const name = values.fullName.trim();
    if (!name) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    const normalizedPhone = normalizePhone(values.phone, "1");
    if (!/^\+?[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setErrorMessage("Please enter a valid phone number.");
      return;
    }

    const email = values.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (values.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (values.password !== values.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await passengerAuthApi.register({
        name,
        phone: normalizedPhone,
        email: email || undefined,
        password: values.password,
      });

      passengerRegistrationDraft.name = name;
      passengerRegistrationDraft.phone = normalizedPhone;
      passengerRegistrationDraft.email = email || undefined;
      passengerRegistrationDraft.password = values.password;
      passengerRegistrationDraft.pendingTokens = null;

      // Trigger OTP send
      passengerAuthApi.requestOtp(normalizedPhone).catch(() => {
        // Otp-verify screen will also offer resend if needed
      });

      router.push("/(passenger-auth)/otp-verify");
    } catch (error) {
      if (getApiErrorStatus(error) === 409) {
        setErrorMessage("This phone number or email is already registered.");
      } else {
        setErrorMessage(
          getApiErrorMessage(error, "Couldn't create your account. Please try again.")
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

      {/* Decorative bg blobs */}
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Ryde</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Heading */}
          <View style={styles.heading}>
            <Text style={styles.title}>Sign Up</Text>
            <Text style={styles.subtitle}>Join the community and start your journey.</Text>
          </View>

          {/* Error message banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={18} color="#ba1a1a" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Fields */}
          {FIELDS.map((field) => {
            const isFocused = focused === field.key;
            const secure = isSecure(field);

            return (
              <View key={field.key} style={styles.fieldWrap}>
                <View style={[styles.inputRow, isFocused && styles.inputRowFocused]}>
                  <MaterialIcons
                    name={field.icon}
                    size={22}
                    color={isFocused ? themeColors.primary : themeColors.outline}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    value={values[field.key]}
                    onChangeText={(text) => {
                      setErrorMessage(null);
                      setValues((v) => ({ ...v, [field.key]: text }));
                    }}
                    placeholder={field.label}
                    placeholderTextColor={themeColors.outline}
                    keyboardType={field.keyboardType ?? "default"}
                    secureTextEntry={secure}
                    autoComplete={field.autoComplete as any}
                    autoCapitalize="none"
                    style={styles.input}
                    onFocus={() => setFocused(field.key)}
                    onBlur={() => setFocused(null)}
                  />
                  {field.secureTextEntry && (
                    <Pressable
                      onPress={() => {
                        if (field.key === "password") setShowPassword((v) => !v);
                        else setShowConfirm((v) => !v);
                      }}
                      style={styles.eyeBtn}
                    >
                      <MaterialIcons
                        name={
                          field.key === "password"
                            ? showPassword ? "visibility" : "visibility-off"
                            : showConfirm ? "visibility" : "visibility-off"
                        }
                        size={20}
                        color={themeColors.outline}
                      />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.btnSubmit,
              pressed && styles.pressed,
              submitting && styles.btnDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={themeColors.onPrimary} size="small" />
            ) : (
              <Text style={styles.btnSubmitText}>Sign Up</Text>
            )}
          </Pressable>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Pressable onPress={() => router.push("/(passenger-auth)/login")}>
              <Text style={styles.loginLink}>Log in</Text>
            </Pressable>
          </View>
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
  blobTL: {
    position: "absolute",
    top: "-10%",
    left: "-10%",
    width: "40%",
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: themeColors.primaryContainer,
    opacity: 0.2,
  },
  blobBR: {
    position: "absolute",
    bottom: "-10%",
    right: "-10%",
    width: "40%",
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: themeColors.secondaryContainer,
    opacity: 0.3,
  },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  brandRow: {
    marginBottom: 32,
  },
  brand: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
    color: themeColors.primary,
    letterSpacing: -0.5,
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
  heading: {
    marginBottom: 24,
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
  fieldWrap: {
    marginBottom: 16,
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
  fieldIcon: {
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
  btnSubmit: {
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
  },
  btnSubmitText: {
    color: themeColors.onPrimary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: themeColors.onSurfaceVariant,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
    color: themeColors.primary,
  },
});
