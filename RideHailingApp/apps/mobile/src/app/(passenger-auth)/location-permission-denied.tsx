import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  StatusBar,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

const DENIED_IMAGE_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAGjn3ohubNwO5QmiO6K6mUNGGN311Dd_Hjfo2z0xDKGRS1QvP0tmEl9z7-eknsjbhN-8aRarLBYxQD0gh0Aeg1F-j6fBPr7FZcXidKUrZpNt4QjGnPkOgQWDK9-_3NnFHLF9ewh3HMt_RtSMJoTyt8ksy0afGi_NMn8aLK6HOSDp2JLXtrD8CLmkHsaX7j7d1KOx9Fu2bTEF3QC-68fkn6DYuZdfxEIY0hCBZNycywbExV01F0gg-K";

import { useRouter } from "expo-router";
import { PermissionStatus } from "expo-location";
import {
  checkForegroundLocationPermission,
  getCurrentCoordinates,
  reverseGeocodeLocation,
} from "@/lib/location/location-service";
import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";

export default function PassengerLocationDeniedScreen() {
  const router = useRouter();
  const setCurrentLocation = usePassengerRideStore((s) => s.setCurrentLocation);
  const setPickup = usePassengerRideStore((s) => s.setPickup);

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  const handleTryAgain = async () => {
    const status = await checkForegroundLocationPermission();
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
      Linking.openSettings();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9ff" />

      <View style={styles.card}>
        {/* Illustration */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: DENIED_IMAGE_URI }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* Text */}
        <Text style={styles.title}>Location is Required</Text>
        <Text style={styles.body}>
          To book a ride, please enable location access in your device settings.
        </Text>

        {/* Open Settings */}
        <Pressable
          onPress={handleOpenSettings}
          style={({ pressed }) => [styles.btnSettings, pressed && styles.pressed]}
        >
          <MaterialIcons name="settings" size={18} color={themeColors.onPrimary} />
          <Text style={styles.btnSettingsText}>Open Settings</Text>
        </Pressable>

        {/* Try Again */}
        <Pressable
          onPress={handleTryAgain}
          style={({ pressed }) => [styles.btnRetry, pressed && styles.pressed]}
        >
          <MaterialIcons name="refresh" size={18} color={themeColors.primary} />
          <Text style={styles.btnRetryText}>Check Again</Text>
        </Pressable>
      </View>
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
    paddingVertical: 32,
  },
  card: {
    width: "100%",
    maxWidth: 448,
    backgroundColor: themeColors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    textAlign: "center" as any,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.3)",
  },
  imageWrapper: {
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: themeColors.surfaceContainerLow,
    overflow: "hidden",
    marginBottom: 24,
  },
  image: {
    width: "100%",
    height: "100%",
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
    maxWidth: 280,
    marginBottom: 32,
  },
  btnSettings: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.primary,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnSettingsText: {
    color: themeColors.onPrimary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  btnRetry: {
    width: "100%",
    height: 48,
    backgroundColor: "transparent",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: themeColors.primary,
  },
  btnRetryText: {
    color: themeColors.primary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
