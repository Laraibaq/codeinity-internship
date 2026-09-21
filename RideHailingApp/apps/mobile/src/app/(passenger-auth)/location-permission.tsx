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
  withSequence,
  withTiming,
  Easing,
  FadeInUp,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

import { PermissionStatus } from "expo-location";
import {
  requestForegroundLocationPermission,
  getCurrentCoordinates,
  reverseGeocodeLocation,
} from "@/lib/location/location-service";
import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";

const MAP_IMAGE_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDuF_BuZpib8r-bjuZgLRlujH51i6xoWGzS4Gz3La3IqNf_cU2-iQqG6cY5IBKWhbV6HdTSNHAgr6L8zA1lVKEr8T_g78EUYrhotfGmRlZlNfAy53CTIFW4omOqjiQhRp8nnYDKJNnnTkbOFNpsG4E7C2frXBy08uKFnOu27fqZQ1IuJYutjfX10QxTXEyT8mO_QFNQyTlY9YEeV7G37wmA-rYEX_rSMFxUgzUGuLtp1SYYaveaW6Hw";

export default function PassengerLocationPermissionScreen() {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = React.useState(false);
  const setCurrentLocation = usePassengerRideStore((s) => s.setCurrentLocation);
  const setPickup = usePassengerRideStore((s) => s.setPickup);

  // Pin pulse animation
  const pinScale = useSharedValue(1);
  useEffect(() => {
    pinScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pinScale.value }],
  }));

  const handleAllow = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      const status = await requestForegroundLocationPermission();
      if (status === PermissionStatus.GRANTED) {
        const coords = await getCurrentCoordinates();
        if (coords) {
          const rev = await reverseGeocodeLocation(coords.latitude, coords.longitude);
          const point = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            name: rev.name,
            address: rev.address,
          };
          setCurrentLocation(point);
          setPickup(point);
        }
        router.replace("/(passenger)/home" as any);
      } else {
        router.push("/(passenger-auth)/location-permission-denied" as any);
      }
    } catch {
      router.push("/(passenger-auth)/location-permission-denied" as any);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleNotNow = () => {
    router.push("/(passenger-auth)/location-permission-denied" as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map Background */}
      <Image
        source={{ uri: MAP_IMAGE_URI }}
        style={styles.mapBg}
        resizeMode="cover"
      />
      <View style={styles.mapOverlay} />

      {/* Pulsing Pin */}
      <View style={styles.pinContainer}>
        <Animated.View style={[styles.pinWrapper, pinStyle]}>
          <View style={styles.pinCircle}>
            <MaterialIcons name="my-location" size={24} color={themeColors.onPrimary} />
          </View>
          {/* Ripple rings */}
          <View style={styles.ripple1} />
          <View style={styles.ripple2} />
        </Animated.View>
      </View>

      {/* Bottom Sheet Card */}
      <Animated.View entering={FadeInUp.duration(500)} style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.dragHandle} />

        {/* Location icon */}
        <View style={styles.locationIconBox}>
          <MaterialIcons name="location-on" size={32} color={themeColors.primary} />
        </View>

        <Text style={styles.title}>Enable Location</Text>
        <Text style={styles.body}>
          Ryde needs your location to find nearby drivers and set pickup points.
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleAllow}
            style={({ pressed }) => [styles.btnAllow, pressed && styles.pressed]}
          >
            <Text style={styles.btnAllowText}>Allow Access</Text>
          </Pressable>

          <Pressable
            onPress={handleNotNow}
            style={({ pressed }) => [styles.btnNotNow, pressed && styles.pressed]}
          >
            <Text style={styles.btnNotNowText}>Not Now</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f9f9ff",
    overflow: "hidden",
  },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(249,249,255,0.15)",
  },
  pinContainer: {
    position: "absolute",
    top: "35%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  pinWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  pinCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: themeColors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 2,
  },
  ripple1: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: themeColors.primary,
    opacity: 0.3,
  },
  ripple2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: themeColors.primary,
    opacity: 0.1,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: themeColors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
    alignItems: "center",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
    borderWidth: 1,
    borderColor: themeColors.outlineVariant,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: themeColors.outlineVariant,
    marginBottom: 16,
  },
  locationIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: themeColors.surfaceContainerLow,
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
    marginBottom: 8,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
    textAlign: "center",
    maxWidth: 300,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  btnAllow: {
    width: "100%",
    height: 48,
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  btnAllowText: {
    color: themeColors.onPrimary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  btnNotNow: {
    width: "100%",
    height: 48,
    backgroundColor: "#f9f9ff",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: themeColors.outlineVariant,
  },
  btnNotNowText: {
    color: themeColors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
