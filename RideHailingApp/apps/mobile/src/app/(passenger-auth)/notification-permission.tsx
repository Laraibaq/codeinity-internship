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
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

const BELL_IMAGE_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAa3RsGbLUQ2X3r0i6Vv5D-bxd_-n4Il57FkR-yeAOpLLputAm7v7vFTA-b55OHRcdDneoGwEwiYwsZeHJjayfcfnpETqy4fSDYBiuMOZGh00YWOtEttFtHToLWtZ7Q8B213BwSdnEc7RhD5AmHFsB7zrDirlTKo0z5a9-dNZ3fqHFAgnm6Rp4dtC3t3JTRCtiF3r6w9b5l7m4k0UZKHiq9cRLLXuiydkElrtLw9CSvhLSFs_xHUnl7";

export default function PassengerNotificationPermissionScreen() {
  const router = useRouter();

  // Pulse animation for the outer circle
  const pulseOpacity = useSharedValue(0.2);
  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handleEnable = () => {
    // In production: call expo-notifications requestPermissionsAsync()
    router.push("/(passenger-auth)/account-created" as any);
  };

  const handleLater = () => {
    router.push("/(passenger-auth)/account-created" as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9ff" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeBtn}
          accessibilityLabel="Close"
        >
          <MaterialIcons name="close" size={24} color={themeColors.primary} />
        </Pressable>
        <Text style={styles.brand}>Ryde</Text>
        <View style={styles.spacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationArea}>
          {/* Animated outer ring */}
          <Animated.View style={[styles.outerRing, pulseStyle]} />
          {/* Inner ring */}
          <View style={styles.innerRing} />
          {/* Bell image */}
          <Image
            source={{ uri: BELL_IMAGE_URI }}
            style={styles.bellImage}
            resizeMode="contain"
          />
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={styles.title}>Stay Updated</Text>
          <Text style={styles.body}>
            Get notified when your driver arrives or counters your offer.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleEnable}
            style={({ pressed }) => [styles.btnEnable, pressed && styles.pressed]}
          >
            <Text style={styles.btnEnableText}>Enable Notifications</Text>
          </Pressable>

          <Pressable
            onPress={handleLater}
            style={({ pressed }) => [styles.btnLater, pressed && styles.pressed]}
          >
            <Text style={styles.btnLaterText}>Maybe Later</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f9f9ff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: themeColors.primary,
    letterSpacing: -0.28,
  },
  spacer: {
    width: 36,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 88,
    paddingBottom: 40,
    gap: 24,
  },
  illustrationArea: {
    width: 192,
    height: 192,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  outerRing: {
    position: "absolute",
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: themeColors.primaryContainer,
  },
  innerRing: {
    position: "absolute",
    width: 152,
    height: 152,
    borderRadius: 76,
    backgroundColor: themeColors.primaryContainer,
    opacity: 0.4,
  },
  bellImage: {
    width: 128,
    height: 128,
    zIndex: 10,
  },
  textBlock: {
    alignItems: "center",
    gap: 12,
  },
  title: {
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
  },
  actions: {
    width: "100%",
    gap: 12,
    marginTop: 16,
  },
  btnEnable: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(77,68,227,1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  btnEnableText: {
    color: themeColors.onPrimary,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  btnLater: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.surfaceContainer,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnLaterText: {
    color: themeColors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.95 }],
  },
});
