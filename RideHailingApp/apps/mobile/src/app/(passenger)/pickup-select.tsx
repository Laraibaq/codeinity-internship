import React, { useEffect, useState } from "react";
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
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { PAKISTAN_CENTER } from "@/constants/default-region";

const MAP_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDtr3B9I8-JbBrIiai9YP2XPakd512iQGL1szQVVfRHzflX5UuI3muzQojH0Au08bpcg2qGRgikGbJ120cgY52u-mKRcf_ImqNcjRPvYIrnt8PQt-zdZAIqVKg8JbJz6KaZf471IOHQiKHeF1jTdaaBInmy0AMTBj1r_vEC3x8jaesKHdoovqB7irXvDoxPnKNZbQ_eswDFXYtt3FU_D8klgfBKpelONSEuWbku-d4d-StOvjqIdX2q";

import { type Region } from "react-native-maps";
import { PermissionStatus } from "expo-location";
import {
  checkForegroundLocationPermission,
  getCurrentCoordinates,
  reverseGeocodeLocation,
} from "@/lib/location/location-service";
import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";
import {
  PassengerMap,
  type PassengerMapRef,
} from "@/components/passenger/passenger-map";

export default function PassengerPickupSelectScreen() {
  const router = useRouter();
  const mapRef = React.useRef<PassengerMapRef>(null);

  const currentLocation = usePassengerRideStore((s) => s.currentLocation);
  const existingPickup = usePassengerRideStore((s) => s.pickup);
  const destination = usePassengerRideStore((s) => s.destination);
  const setPickup = usePassengerRideStore((s) => s.setPickup);
  const setCurrentLocation = usePassengerRideStore((s) => s.setCurrentLocation);

  const initialLat = existingPickup?.latitude ?? currentLocation?.latitude ?? PAKISTAN_CENTER.latitude;
  const initialLon = existingPickup?.longitude ?? currentLocation?.longitude ?? PAKISTAN_CENTER.longitude;

  const [selectedCoord, setSelectedCoord] = useState({
    latitude: initialLat,
    longitude: initialLon,
  });
  const [streetName, setStreetName] = useState(existingPickup?.name ?? "Locating...");
  const [fullAddress, setFullAddress] = useState(
    existingPickup?.address ?? "Drag map to select pickup spot",
  );
  const [isGeocoding, setIsGeocoding] = useState(false);

  const reverseGeocodeTimer = React.useRef<any>(null);

  const handleRegionChangeComplete = (region: Region) => {
    setSelectedCoord({
      latitude: region.latitude,
      longitude: region.longitude,
    });

    if (reverseGeocodeTimer.current) {
      clearTimeout(reverseGeocodeTimer.current);
    }

    reverseGeocodeTimer.current = setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const rev = await reverseGeocodeLocation(region.latitude, region.longitude);
        setStreetName(rev.name);
        setFullAddress(rev.address);
      } catch {
        // ignore
      } finally {
        setIsGeocoding(false);
      }
    }, 450);
  };

  const handleCenterOnMyLocation = async () => {
    try {
      const perm = await checkForegroundLocationPermission();
      if (perm !== PermissionStatus.GRANTED) {
        router.push("/(passenger-auth)/location-permission" as any);
        return;
      }
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
        setSelectedCoord({ latitude: coords.latitude, longitude: coords.longitude });
        setStreetName(rev.name);
        setFullAddress(rev.address);
        mapRef.current?.centerOn(coords.latitude, coords.longitude, 0.015, 0.015);
      }
    } catch {
      // ignore
    }
  };

  // Pin pulse animation
  const pulseScale = useSharedValue(0.8);
  const pulseOpacity = useSharedValue(0.5);
  const pinY = useSharedValue(0);

  useEffect(() => {
    // Outer pulse ring
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(2.5, { duration: 2000, easing: Easing.out(Easing.quad) }),
        withTiming(0.8, { duration: 0 })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2000, easing: Easing.out(Easing.quad) }),
        withTiming(0.5, { duration: 0 })
      ),
      -1,
      false
    );
    // Pin gentle float
    pinY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pinY.value }],
  }));

  const handleConfirm = () => {
    setPickup({
      latitude: selectedCoord.latitude,
      longitude: selectedCoord.longitude,
      name: streetName,
      address: fullAddress,
    });

    if (destination) {
      router.push("/(passenger)/route-preview" as any);
    } else {
      router.push("/(passenger)/destination-search" as any);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Interactive Map Canvas ── */}
      <PassengerMap
        ref={mapRef}
        style={styles.mapBg}
        showUserLocation={true}
        onRegionChangeComplete={handleRegionChangeComplete}
        initialRegion={{
          latitude: initialLat,
          longitude: initialLon,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
      />

      {/* ── Floating Header ── */}
      <View style={styles.floatingHeader}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurface} />
        </Pressable>

        {/* Address pill */}
        <Pressable
          style={styles.addressPill}
          onPress={() => router.push("/(passenger)/destination-search" as any)}
        >
          <View style={styles.addressDot} />
          <Text style={styles.addressPillText} numberOfLines={1}>
            {isGeocoding ? "Updating address..." : fullAddress}
          </Text>
          <MaterialIcons name="search" size={20} color={themeColors.outline} />
        </Pressable>
      </View>

      {/* ── Central Map Pin (Picker) ── */}
      <View style={styles.pinContainer} pointerEvents="none">
        {/* Info bubble */}
        <Animated.View style={[styles.pinBubble, pinStyle]}>
          <Text style={styles.pinBubbleText}>Set Pickup</Text>
        </Animated.View>

        {/* Pin circle + pulse ring */}
        <View style={styles.pinCore}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          <View style={styles.pinCircleOuter}>
            <View style={styles.pinCircleInner} />
          </View>
        </View>

        {/* Pin stem */}
        <View style={styles.pinStem} />
      </View>

      {/* ── My Location FAB ── */}
      <Pressable
        style={styles.locationFAB}
        accessibilityLabel="My location"
        onPress={handleCenterOnMyLocation}
      >
        <MaterialIcons name="my-location" size={22} color={themeColors.onSurface} />
      </Pressable>

      {/* ── Bottom Confirmation Card ── */}
      <View style={styles.bottomCard}>
        {/* Address row */}
        <View style={styles.addressRow}>
          <View style={styles.addressIconBox}>
            <MaterialIcons name="location-on" size={22} color={themeColors.primary} />
          </View>
          <View style={styles.addressTextBlock}>
            <Text style={styles.addressStreet} numberOfLines={1}>
              {streetName}
            </Text>
            <Text style={styles.addressCity} numberOfLines={1}>
              {fullAddress}
            </Text>
          </View>
        </View>

        {/* Info hint */}
        <View style={styles.hintRow}>
          <MaterialIcons name="info" size={16} color={themeColors.primary} />
          <Text style={styles.hintText}>
            Drag the map to refine your precise location before confirming.
          </Text>
        </View>

        {/* Confirm Pickup */}
        <Pressable
          onPress={handleConfirm}
          style={({ pressed }) => [styles.btnConfirm, pressed && styles.pressed]}
        >
          <Text style={styles.btnConfirmText}>Confirm Pickup</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: themeColors.surfaceContainerLow,
    overflow: "hidden",
  },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
  },
  // ── Floating Header ──
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: themeColors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    flexShrink: 0,
  },
  backBtnPressed: {
    backgroundColor: themeColors.surfaceContainerLow,
  },
  addressPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.surfaceContainerLowest,
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  addressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.primary,
    flexShrink: 0,
  },
  addressPillText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
  },
  // ── Central Pin ──
  pinContainer: {
    position: "absolute",
    top: "45%",
    left: "50%",
    zIndex: 10,
    transform: [{ translateX: -24 }, { translateY: -64 }],
    alignItems: "center",
    width: 48,
  },
  pinBubble: {
    backgroundColor: themeColors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 6,
    marginBottom: 8,
  },
  pinBubbleText: {
    fontSize: 12,
    fontWeight: "600",
    color: themeColors.onSurface,
    letterSpacing: 0.6,
  },
  pinCore: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: themeColors.primary,
  },
  pinCircleOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: themeColors.surfaceContainerHighest,
    zIndex: 2,
  },
  pinCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: themeColors.primary,
  },
  pinStem: {
    width: 2,
    height: 12,
    backgroundColor: themeColors.surfaceContainerLowest,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    opacity: 0.7,
  },
  // ── FAB ──
  locationFAB: {
    position: "absolute",
    right: 20,
    bottom: 240,
    zIndex: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: themeColors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  // ── Bottom Card ──
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: themeColors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 40,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: themeColors.surfaceContainerHighest,
    zIndex: 30,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 12,
  },
  addressIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 4,
  },
  addressTextBlock: {
    flex: 1,
  },
  addressStreet: {
    fontSize: 16,
    fontWeight: "700",
    color: themeColors.onSurface,
    lineHeight: 24,
  },
  addressCity: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.onSurfaceVariant,
    lineHeight: 16,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.surfaceContainerLow,
    borderRadius: 8,
    padding: 12,
    gap: 12,
    marginBottom: 24,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.onSurfaceVariant,
    lineHeight: 16,
  },
  btnConfirm: {
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
    elevation: 3,
  },
  btnConfirmText: {
    color: themeColors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
