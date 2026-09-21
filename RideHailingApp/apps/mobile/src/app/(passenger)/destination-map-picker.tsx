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
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

const MAP_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAqdU_F51J3ZlJUQTGVPgSP2taNXhiXOeXg-kvwzuIjlijB1rehlvqhR1H9hYw0pGpOzuraKs8yyHrxEr-Ntg743UkJ-Seh64jOWT7dRS_YN5QxFQ2sYXtXwlLKbe2h8YAlQBrkVYfk-Ucptodizf5ZibpT3SDSssgak8e_qpQZKtdJXA_FPB-v6ofSbe7MND6r7zRqxASqiupx4wLfnoOCWZufgffIFw4BLu9uK8qHrNqeOk6sswrh";

import { type Region } from "react-native-maps";
import {
  reverseGeocodeLocation,
} from "@/lib/location/location-service";
import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";
import {
  PassengerMap,
  type PassengerMapRef,
} from "@/components/passenger/passenger-map";

export default function PassengerDestinationMapPickerScreen() {
  const router = useRouter();
  const mapRef = React.useRef<PassengerMapRef>(null);

  const currentLocation = usePassengerRideStore((s) => s.currentLocation);
  const pickup = usePassengerRideStore((s) => s.pickup);
  const existingDest = usePassengerRideStore((s) => s.destination);
  const setDestination = usePassengerRideStore((s) => s.setDestination);
  const setPickup = usePassengerRideStore((s) => s.setPickup);

  // Default to slightly offset from pickup or current location
  const initialLat = existingDest?.latitude ?? (pickup?.latitude ? pickup.latitude + 0.012 : (currentLocation?.latitude ? currentLocation.latitude + 0.012 : 37.788));
  const initialLon = existingDest?.longitude ?? (pickup?.longitude ? pickup.longitude + 0.012 : (currentLocation?.longitude ? currentLocation.longitude + 0.012 : -122.408));

  const [selectedCoord, setSelectedCoord] = useState({
    latitude: initialLat,
    longitude: initialLon,
  });
  const [streetName, setStreetName] = useState(existingDest?.name ?? "Selected Location");
  const [fullAddress, setFullAddress] = useState(
    existingDest?.address ?? "Move map to choose destination",
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

  // Pin drop animation: starts above screen, bounces into place
  const pinY = useSharedValue(-160);
  const pinOpacity = useSharedValue(0);

  useEffect(() => {
    pinOpacity.value = withTiming(1, { duration: 200 });
    pinY.value = withSequence(
      withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) }),
      withTiming(-14, { duration: 110, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 130, easing: Easing.in(Easing.quad) })
    );
  }, []);

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pinY.value }],
    opacity: pinOpacity.value,
  }));

  const handleConfirm = () => {
    if (!pickup && currentLocation) {
      setPickup(currentLocation);
    }
    setDestination({
      latitude: selectedCoord.latitude,
      longitude: selectedCoord.longitude,
      name: streetName,
      address: fullAddress,
    });
    router.push("/(passenger)/route-preview" as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Interactive Map */}
      <PassengerMap
        ref={mapRef}
        style={styles.mapBg}
        showUserLocation={true}
        onRegionChangeComplete={handleRegionChangeComplete}
        initialRegion={{
          latitude: initialLat,
          longitude: initialLon,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      />

      {/* Floating header */}
      <View style={styles.floatingHeader}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurface} />
        </Pressable>

        <Pressable
          style={styles.addressBar}
          onPress={() => router.push("/(passenger)/destination-search" as any)}
        >
          <View style={styles.addressBarDot} />
          <View style={styles.addressBarText}>
            <Text style={styles.addressBarLabel}>DESTINATION</Text>
            <Text style={styles.addressBarValue} numberOfLines={1}>
              {isGeocoding ? "Locating..." : streetName}
            </Text>
          </View>
          <MaterialIcons name="search" size={22} color={themeColors.secondary} />
        </Pressable>
      </View>

      {/* Central animated drop pin */}
      <View style={styles.pinAnchor} pointerEvents="none">
        <Animated.View style={[styles.pinWrapper, pinStyle]}>
          {/* Pin head */}
          <View style={styles.pinHead}>
            <MaterialIcons name="location-on" size={28} color={themeColors.surface} />
          </View>
          {/* Pin stem */}
          <View style={styles.pinStem}>
            {/* Shadow underneath stem */}
            <View style={styles.pinShadow} />
          </View>
        </Animated.View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Drag handle */}
        <View style={styles.dragHandleRow}>
          <View style={styles.dragHandle} />
        </View>

        <View style={styles.sheetContent}>
          {/* Location row */}
          <View style={styles.locationRow}>
            <MaterialIcons
              name="location-on"
              size={24}
              color={themeColors.primary}
              style={styles.locationIcon}
            />
            <View style={styles.locationTextBlock}>
              <Text style={styles.locationStreet} numberOfLines={1}>
                {streetName}
              </Text>
              <Text style={styles.locationCity} numberOfLines={1}>
                {fullAddress}
              </Text>
            </View>
          </View>

          {/* Confirm Destination button */}
          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [styles.btnConfirm, pressed && styles.pressed]}
          >
            <Text style={styles.btnConfirmText}>CONFIRM DESTINATION</Text>
            <MaterialIcons name="arrow-forward" size={18} color={themeColors.onPrimary} />
          </Pressable>
        </View>

        {/* Safe area spacer */}
        <View style={styles.safeArea} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: themeColors.surfaceVariant,
    overflow: "hidden",
  },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  // ── Floating Header ──
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
    gap: 16,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: themeColors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.3)",
    flexShrink: 0,
  },
  backBtnPressed: {
    backgroundColor: themeColors.surfaceContainerLow,
  },
  addressBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.surface,
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.3)",
  },
  addressBarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.onSurface,
    flexShrink: 0,
  },
  addressBarText: {
    flex: 1,
    overflow: "hidden",
  },
  addressBarLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: themeColors.onSurfaceVariant,
    lineHeight: 14,
  },
  addressBarValue: {
    fontSize: 14,
    color: themeColors.onSurface,
    fontWeight: "500",
    lineHeight: 20,
  },
  // ── Center Pin ──
  pinAnchor: {
    position: "absolute",
    top: "50%",
    left: "50%",
    zIndex: 10,
    transform: [{ translateX: -24 }, { translateY: -72 }],
    alignItems: "center",
    width: 48,
  },
  pinWrapper: {
    alignItems: "center",
  },
  pinHead: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: themeColors.onSurface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 4,
    borderColor: themeColors.surface,
  },
  pinStem: {
    width: 6,
    height: 24,
    backgroundColor: themeColors.onSurface,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    marginTop: -8,
    zIndex: 0,
    alignItems: "center",
  },
  pinShadow: {
    position: "absolute",
    bottom: -6,
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.2)",
    transform: [{ scaleX: 2 }],
  },
  // ── Bottom Sheet ──
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 10,
  },
  dragHandleRow: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(199,196,216,0.5)",
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 24,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  locationIcon: {
    marginTop: 4,
    flexShrink: 0,
  },
  locationTextBlock: {
    flex: 1,
  },
  locationStreet: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "600",
    color: themeColors.onSurface,
    letterSpacing: -0.28,
  },
  locationCity: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
    marginTop: 4,
  },
  btnConfirm: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnConfirmText: {
    color: themeColors.onPrimary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
  },
  safeArea: {
    height: 24,
    backgroundColor: themeColors.surface,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
