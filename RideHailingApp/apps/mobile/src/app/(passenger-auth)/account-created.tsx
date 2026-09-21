import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeInUp,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { useAuthStore } from "@/store/auth-store";
import { passengerRegistrationDraft } from "@/store/passenger/passenger-auth-store";

export default function PassengerAccountCreatedScreen() {
  const router = useRouter();

  // Pulse animation for the check circle
  const scale = useSharedValue(0.95);
  const shadowRadius = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    shadowRadius.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 700 }),
        withTiming(0, { duration: 700 })
      ),
      -1,
      false
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleLetsGo = async () => {
    const tokens = passengerRegistrationDraft.pendingTokens;
    if (tokens) {
      await useAuthStore.getState().login({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        role: "passenger",
      });
      passengerRegistrationDraft.pendingTokens = null;
    }
    router.replace("/(passenger)/home");
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9ff" />

      {/* Decorative blobs */}
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      <View style={styles.centered}>
        {/* Card */}
        <Animated.View entering={FadeInUp.duration(600).easing(Easing.out(Easing.exp))} style={styles.card}>
          {/* Animated check circle */}
          <Animated.View style={[styles.iconWrapper, iconStyle]}>
            <MaterialIcons name="check-circle" size={48} color={themeColors.primary} />
          </Animated.View>

          {/* Typography */}
          <Animated.Text
            entering={FadeInUp.delay(100).duration(600)}
            style={styles.title}
          >
            Account Created!
          </Animated.Text>

          <Animated.Text
            entering={FadeInUp.delay(200).duration(600)}
            style={styles.body}
          >
            Your account is ready. Let's get you where you need to go.
          </Animated.Text>

          {/* CTA */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(600)}
            style={styles.btnWrapper}
          >
            <Pressable
              onPress={handleLetsGo}
              style={({ pressed }) => [styles.btnLetsGo, pressed && styles.pressed]}
            >
              <Text style={styles.btnText}>LET'S GO</Text>
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
    backgroundColor: "#f9f9ff",
    overflow: "hidden",
  },
  blobTL: {
    position: "absolute",
    top: -128,
    left: -128,
    width: 384,
    height: 384,
    borderRadius: 192,
    backgroundColor: themeColors.primaryContainer,
    opacity: 0.2,
  },
  blobBR: {
    position: "absolute",
    bottom: 40,
    right: -40,
    width: 288,
    height: 288,
    borderRadius: 144,
    backgroundColor: themeColors.secondaryContainer,
    opacity: 0.2,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
    zIndex: 10,
  },
  card: {
    width: "100%",
    maxWidth: 448,
    backgroundColor: themeColors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 48,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: themeColors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "600",
    color: themeColors.onSurface,
    letterSpacing: -0.28,
    textAlign: "center",
    marginBottom: 12,
    width: "100%",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
    textAlign: "center",
    maxWidth: 280,
    marginBottom: 32,
  },
  btnWrapper: {
    width: "100%",
    marginTop: 8,
  },
  btnLetsGo: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
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
