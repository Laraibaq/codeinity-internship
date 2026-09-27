import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  StatusBar,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeInDown,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

const ILLUSTRATION_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCUvQ6lPNk2FMvJdMEDBRwJa7twHLG_bgGgqm-3vM3AzjHAJxpcPFuxKj1TZa0-7ksGOVcoqDjkaMz9QGWAAHekUk5D9OZkZkoB4coJHTgTNOn0Sqa1WZyrTdlxP6AQ9Y50okwp1FkvlYGqIcyvLBFMeHBd_-d_JmOxKM8a8NWQBDwdTABWV6LzH9zw4m_ON2dE6ozcJaVgU_c3ZkgDAgWRfoXioJQug2Sh7tetcVV2uRXlqYDhwtZR";

export default function PassengerOnboarding03Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Float animation
  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={themeColors.surfaceContainerLow} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top + 8, 20),
            height: Math.max(insets.top + 56, 64),
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurface} />
        </Pressable>
        <Pressable
          onPress={() => router.push("/(passenger-auth)/login")}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          style={({ pressed }) => pressed && styles.pressed}
          accessibilityRole="button"
          accessibilityLabel="Skip"
        >
          <Text style={styles.skip}>SKIP</Text>
        </Pressable>
      </View>

      {/* Visual Area (upper ~50%) */}
      <View style={[styles.visualArea, { paddingTop: Math.max(insets.top + 56, 64) }]}>
        {/* Floating card with illustration */}
        <Animated.View style={[styles.floatWrapper, floatStyle]}>
          <View style={styles.imageCard}>
            <Image
              source={{ uri: ILLUSTRATION_URI }}
              style={styles.image}
              resizeMode="cover"
            />
            {/* Verified badge */}
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified-user" size={20} color={themeColors.primary} />
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Content Area (lower ~50%) */}
      <View
        style={[
          styles.contentArea,
          { paddingBottom: Math.max(insets.bottom + 16, 32) },
        ]}
      >
        {/* Text */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.textBlock}>
          <Text style={styles.headline}>Reliable Rides, Fast</Text>
          <Animated.Text
            entering={FadeInDown.delay(200).duration(600)}
            style={styles.body}
          >
            Connect with thousands of verified drivers in minutes.
          </Animated.Text>
        </Animated.View>

        {/* Bottom actions */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          style={styles.actions}
        >
          {/* Progress Dots */}
          <View style={styles.dotsRow}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>

          {/* Get Started */}
          <Pressable
            onPress={() => router.push("/(passenger-auth)/login")}
            style={({ pressed }) => [styles.btnGetStarted, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.btnText}>GET STARTED</Text>
            <MaterialIcons name="arrow-forward" size={18} color={themeColors.onPrimary} />
          </Pressable>
        </Animated.View>
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(249,249,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnPressed: {
    backgroundColor: themeColors.surfaceVariant,
  },
  skip: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: themeColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  visualArea: {
    height: "55%",
    backgroundColor: themeColors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 72,
    overflow: "hidden",
  },
  floatWrapper: {
    alignItems: "center",
    justifyContent: "center",
    maxHeight: 320,
    paddingHorizontal: 32,
    width: "100%",
  },
  imageCard: {
    width: 280,
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.3)",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 6,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  verifiedBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: themeColors.surface,
    borderRadius: 99,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentArea: {
    flex: 1,
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: "space-between",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 4,
    zIndex: 20,
  },
  textBlock: {
    gap: 12,
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
    maxWidth: 300,
    alignSelf: "center",
  },
  actions: {
    gap: 24,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.outlineVariant,
  },
  dotActive: {
    width: 32,
    backgroundColor: themeColors.primary,
  },
  btnGetStarted: {
    width: "100%",
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "rgba(79,70,229,1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  btnText: {
    color: themeColors.onPrimary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
