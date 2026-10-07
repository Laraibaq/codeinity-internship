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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

const ILLUSTRATION_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDdKL7YY68UuhfHX2sEGkozVK821KkyNM_8GzoxgIhjt_xHyAZe5diuUFx-lreObWuiZf4KWjmC1cB_gAKRCjI7E2BlzMFqF_qZfY2WUeswSzqpU3_4bqsJbxGjcwNO9BpPpSxpvV1Xk-k9TsqEYqoKj3L-MfpHwyIhfOmIEYO-YX6Coeqxohbr4jlvGQPSYe2PEVqruX3kduPKKy1jRBUUnMA9edw75EKnb2xh96VD7EAe02uSQcZx";

export default function PassengerOnboarding01Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9ff" />

      {/* Top Bar - Skip */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 8, 20) }]}>
        <Pressable
          onPress={() => router.push("/(passenger-auth)/login")}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          style={({ pressed }) => pressed && styles.pressed}
          accessibilityRole="button"
          accessibilityLabel="Skip"
        >
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <View style={styles.main}>
        {/* Illustration Box */}
        <View style={styles.illustrationBox}>
          {/* Subtle radial gradient overlay */}
          <View style={styles.radialOverlay} />

          {/* Fare Negotiation UI (foreground) */}
          <View style={styles.fareContainer}>
            <View style={styles.fareCard}>
              <Text style={styles.fareLabel}>Your offer</Text>
              <Text style={styles.farePrice}>$12.50</Text>
            </View>

            <View style={styles.arrowRow}>
              <MaterialIcons name="arrow-upward" size={18} color={themeColors.onSurfaceVariant} />
              <MaterialIcons name="arrow-downward" size={18} color={themeColors.onSurfaceVariant} />
            </View>

            <View style={[styles.fareCard, styles.fareCardDim]}>
              <Text style={styles.fareLabel}>Driver ask</Text>
              <Text style={styles.farePriceSecondary}>$15.00</Text>
            </View>
          </View>

          {/* Background illustration image */}
          <Image
            source={{ uri: ILLUSTRATION_URI }}
            style={styles.bgImage}
            resizeMode="cover"
          />
        </View>

        {/* Text Content */}
        <View style={styles.textBlock}>
          <Text style={styles.headline}>Fair Fares for Everyone</Text>
          <Text style={styles.body}>
            Suggest a price that works for you and find drivers willing to accept.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}>
        {/* Progress Dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Next Button */}
        <Pressable
          onPress={() => router.push("/(passenger-auth)/onboarding-02" as any)}
          style={({ pressed }) => [styles.btnNext, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Next"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
    backgroundColor: "#f9f9ff",
    justifyContent: "space-between",
  },
  topBar: {
    paddingHorizontal: 20,
    alignItems: "flex-end",
    zIndex: 10,
  },
  skip: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.onSurfaceVariant,
    paddingVertical: 8,
  },
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  illustrationBox: {
    width: "100%",
    maxWidth: 340,
    aspectRatio: 1.1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: themeColors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.3)",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
  },
  radialOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(53,37,205,0.04)",
  },
  bgImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    opacity: 0.2,
  },
  fareContainer: {
    alignItems: "center",
    gap: 12,
    zIndex: 10,
  },
  fareCard: {
    width: 192,
    height: 64,
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.5)",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  fareCardDim: {
    opacity: 0.5,
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.onSurface,
    lineHeight: 24,
  },
  farePrice: {
    fontSize: 24,
    fontWeight: "700",
    color: themeColors.primary,
    lineHeight: 32,
    letterSpacing: 0.48,
  },
  farePriceSecondary: {
    fontSize: 24,
    fontWeight: "700",
    color: themeColors.onSurfaceVariant,
    lineHeight: 32,
    letterSpacing: 0.48,
  },
  arrowRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  textBlock: {
    alignItems: "center",
    gap: 16,
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
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: themeColors.surface,
    borderTopWidth: 1,
    borderTopColor: "rgba(199,196,216,0.2)",
    alignItems: "center",
    gap: 24,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.surfaceVariant,
  },
  dotActive: {
    width: 32,
    backgroundColor: themeColors.primary,
  },
  btnNext: {
    width: "100%",
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  btnNextText: {
    color: themeColors.onPrimary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
