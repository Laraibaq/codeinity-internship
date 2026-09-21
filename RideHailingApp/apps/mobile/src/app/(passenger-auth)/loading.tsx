import React, { useEffect } from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { themeColors } from "@/constants/theme-colors";

export default function PassengerLoadingScreen() {
  const rotation = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(10);
  const pulseOpacity = useSharedValue(0.1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
    contentOpacity.value = withTiming(1, { duration: 600 });
    contentY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) });
    pulseOpacity.value = withRepeat(
      withTiming(0.25, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9ff" />

      <Animated.View style={[styles.content, contentStyle]}>
        {/* Spinner + pulse */}
        <View style={styles.spinnerOuter}>
          <Animated.View style={[styles.pulseBlob, pulseStyle]} />
          <Animated.View style={[styles.spinner, spinnerStyle]} />
        </View>

        {/* Text - staggered fade with animation-delay workaround */}
        <Animated.View
          style={[styles.textBlock, contentStyle]}
        >
          <Text style={styles.title}>Loading Authentication State</Text>
          <Text style={styles.subtitle}>Verifying your details...</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f9f9ff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  content: {
    alignItems: "center",
    gap: 24,
    width: "100%",
  },
  spinnerOuter: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseBlob: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: themeColors.primaryContainer,
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: themeColors.surfaceContainer,
    borderTopColor: themeColors.primary,
  },
  textBlock: {
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "600",
    color: themeColors.primary,
    letterSpacing: -0.28,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
    textAlign: "center",
  },
});
