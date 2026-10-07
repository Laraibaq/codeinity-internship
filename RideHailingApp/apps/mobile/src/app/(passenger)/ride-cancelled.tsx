import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  StatusBar,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

const MAP_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBWhweS_gwEVSSbs3_yQKhP1jFWf08amiqiLSG4Pch4wSzUCslnCH6XEEFVyuYC5Ku5cvxNN7sib-K_fwFWv0PC2ru_i8ixYD5Hul4sj6rz2dCz1F3xkyTmk6IJuk5bV_chbCIXbUs72D4ZBwEJr7d5qaNLc7DuvCzSaU2Gxh5sRJQahwwptvtdfiQzH7PM7F50GcFe80S1W2MbnaWXnAwPSONCeFt8D51yF9hE2WLzeicoPoGuaQcD";

export default function PassengerRideCancelledScreen() {
  const router = useRouter();

  // Card fade-in-up
  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(20);

  // Icon scale-in (delayed)
  const iconScale = useSharedValue(0.8);
  const iconOpacity = useSharedValue(0);

  // Text items fade-in-up (staggered)
  const text1Opacity = useSharedValue(0);
  const text1Y = useSharedValue(20);
  const text2Opacity = useSharedValue(0);
  const text2Y = useSharedValue(20);
  const btnOpacity = useSharedValue(0);
  const btnY = useSharedValue(20);

  useEffect(() => {
    const dur = { duration: 500, easing: Easing.out(Easing.quad) };

    // Card
    cardOpacity.value = withTiming(1, dur);
    cardY.value = withTiming(0, dur);

    // Icon
    iconOpacity.value = withDelay(100, withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) }));
    iconScale.value = withDelay(100, withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) }));

    // Staggered text
    text1Opacity.value = withDelay(200, withTiming(1, dur));
    text1Y.value = withDelay(200, withTiming(0, dur));

    text2Opacity.value = withDelay(300, withTiming(1, dur));
    text2Y.value = withDelay(300, withTiming(0, dur));

    btnOpacity.value = withDelay(400, withTiming(1, dur));
    btnY.value = withDelay(400, withTiming(0, dur));
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const text1Style = useAnimatedStyle(() => ({
    opacity: text1Opacity.value,
    transform: [{ translateY: text1Y.value }],
  }));

  const text2Style = useAnimatedStyle(() => ({
    opacity: text2Opacity.value,
    transform: [{ translateY: text2Y.value }],
  }));

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ translateY: btnY.value }],
  }));

  const handleReturnHome = () => {
    router.replace("/(passenger)/home" as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map — very subtle */}
      <Image source={{ uri: MAP_URI }} style={styles.mapBg} resizeMode="cover" />
      <View style={styles.mapTint} />

      {/* Centered card */}
      <View style={styles.centerWrapper}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Cancel icon */}
          <Animated.View style={[styles.iconCircle, iconStyle]}>
            <MaterialIcons name="cancel" size={40} color="#ba1a1a" />
          </Animated.View>

          {/* Title */}
          <Animated.Text style={[styles.title, text1Style]}>
            Request Cancelled
          </Animated.Text>

          {/* Body */}
          <Animated.Text style={[styles.body, text2Style]}>
            Your ride has been successfully cancelled. No charges will be
            applied.
          </Animated.Text>

          {/* CTA */}
          <Animated.View style={[styles.btnWrapper, btnStyle]}>
            <Pressable
              onPress={handleReturnHome}
              style={({ pressed }) => [styles.btnHome, pressed && styles.pressed]}
            >
              <Text style={styles.btnHomeText}>Return to Home</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: themeColors.surface,
    overflow: "hidden",
  },
  mapBg: {
    ...StyleSheet.absoluteFill,
    opacity: 0.3,
  },
  mapTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(249,249,255,0.1)",
  },
  centerWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 384,
    backgroundColor: themeColors.surfaceContainerLowest,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: "center",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 10,
    borderWidth: 1,
    borderColor: themeColors.outlineVariant,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ffdad6",
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
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 40,
  },
  btnWrapper: {
    width: "100%",
  },
  btnHome: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  btnHomeText: {
    color: themeColors.onPrimary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
