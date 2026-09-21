import React from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

const ILLUSTRATION_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuArE02RZSh8eMyblPwpvjABD8hEA21Ez-yOMU7FJbenzyGbGPn1Xn4xOrC7OkbAdglfvfhXoVCawYU59OS8fnbtfFQY18gb212wZu6FLbpIkm5SiuVRv9NHxUQmoqyTutCL8N19jcXgrzcUIX8JeVuxrqWVtgzfG4FswlRYqM0sct_0JNoJYLIY-GoCT89MS4AIeJPN-FOp3UAXZX4xO2epgdGfjF-cf96z0Ipxe_yaKfV18zX6Fpk4";

export default function PassengerOnboarding02Screen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={themeColors.surface} />

      {/* Header Actions */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityLabel="Back"
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurfaceVariant} />
        </Pressable>
        <Pressable onPress={() => router.push("/(passenger-auth)/login")}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      {/* Illustration Area */}
      <View style={styles.illustrationArea}>
        {/* Decorative blobs */}
        <View style={styles.blobPrimary} />
        <View style={styles.blobSecondary} />

        {/* Circular image */}
        <View style={styles.circleImageWrapper}>
          <Image
            source={{ uri: ILLUSTRATION_URI }}
            style={styles.circleImage}
            resizeMode="cover"
          />

          {/* Security badge - top right */}
          <View style={styles.badgeTopRight}>
            <MaterialIcons name="security" size={20} color={themeColors.primary} />
          </View>

          {/* Support badge - bottom left */}
          <View style={styles.badgeBottomLeft}>
            <MaterialIcons name="support-agent" size={20} color={themeColors.tertiaryContainer} />
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.headline}>Travel with Peace of Mind</Text>
        <Text style={styles.body}>
          Share your trip details with loved ones and access 24/7 support.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Progress Dots */}
        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        {/* Next Button */}
        <Pressable
          onPress={() => router.push("/(passenger-auth)/onboarding-03" as any)}
          style={({ pressed }) => [styles.btnNext, pressed && styles.pressed]}
        >
          <Text style={styles.btnNextText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: themeColors.surface,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
    height: 64,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  skip: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.primary,
  },
  pressed: {
    opacity: 0.8,
  },
  illustrationArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginTop: 12,
    marginBottom: 24,
  },
  blobPrimary: {
    position: "absolute",
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: themeColors.primaryContainer,
    opacity: 0.2,
  },
  blobSecondary: {
    position: "absolute",
    bottom: -40,
    right: 30,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: themeColors.secondaryContainer,
    opacity: 0.2,
  },
  circleImageWrapper: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: "hidden",
    backgroundColor: themeColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.3)",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 6,
  },
  circleImage: {
    width: "100%",
    height: "100%",
  },
  badgeTopRight: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: themeColors.surfaceContainerLowest,
    borderRadius: 99,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeBottomLeft: {
    position: "absolute",
    bottom: 32,
    left: 0,
    backgroundColor: themeColors.surfaceContainerLowest,
    borderRadius: 99,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  headline: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "600",
    color: themeColors.onSurface,
    letterSpacing: -0.28,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
    textAlign: "center",
    maxWidth: 320,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.outlineVariant,
  },
  dotActive: {
    width: 24,
    backgroundColor: themeColors.primary,
  },
  btnNext: {
    width: "100%",
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  btnNextText: {
    color: themeColors.onPrimary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
});
