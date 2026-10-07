import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Modal,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

const MAP_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAmIy4yW67r3-uoyPBcUuxPj9_btSUzF6ECtahH-UT1fzZkxFu930_pCnALHtGbvJOWN5V_eW5fbBEsvU9XXyGNvW9b8QZeHvYCGb_mYjrtK92C8dpXt_Hk7EuwqBEVkNAyB8SW8YrPVmD1Ukxx5ewZubXJrfvp8zNm8xBYGhO6c0WI36nZx-mjiWNDIRqRlCuyljjsU6Sspt9HEDnWboW84lvIKS9ezjynwE8LVyHS1EXPSUGvnQdQ";
const AVATAR_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBey3XoHCpH8ROeBiuG66ZZr83ta6lUJqwOBzTs1aSXlXK17WEAtzTl3j3EfXNrysvdV1gyO5RAJDF309qzYQbMMwAO_-d3y4fiOM8K1GM4EFKALysz_by23aLJOUW1BNYKSepD9ixiU4DaAAdRGbdtN-zqv9OYf_P-FGpCgKFN-NVjOl1wJALBoqMEO1gk9F5os7neq0PVYOWly0NM_Ddns_Qw66JDUW8RtokgMafzAgfi2dIuema6";

const RECENT_ITEMS = [
  { id: "1", name: "JFK International Airport", subtitle: "Terminal 4 Arrivals" },
  { id: "2", name: "Central Park Boathouse", subtitle: "East 72nd St and Park Drive North" },
  { id: "3", name: "Whole Foods Market", subtitle: "Columbus Circle" },
];

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: "explore" as const, route: "/(passenger)/home" },
  { key: "activity", label: "Activity", icon: "history" as const, route: "/(passenger)/ride-history" },
  { key: "payments", label: "Payments", icon: "account-balance-wallet" as const, route: "/(passenger)/home" },
  { key: "account", label: "Account", icon: "person" as const, route: "/(passenger)/profile" },
];

const BOTTOM_NAV_HEIGHT = 76;

import { PermissionStatus } from "expo-location";
import {
  checkForegroundLocationPermission,
  getCurrentCoordinates,
  reverseGeocodeLocation,
} from "@/lib/location/location-service";
import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";
import { nearbyDriversApi, type NearbyDriver } from "@/lib/api/passenger/nearby-drivers";
import { NearbyDriverMarkers } from "@/components/passenger/nearby-driver-markers";
import {
  PassengerMap,
  type PassengerMapRef,
} from "@/components/passenger/passenger-map";

export default function PassengerHomeScreen() {
  const router = useRouter();
  const mapRef = React.useRef<PassengerMapRef>(null);

  const currentLocation = usePassengerRideStore((s) => s.currentLocation);
  const pickup = usePassengerRideStore((s) => s.pickup);
  const setCurrentLocation = usePassengerRideStore((s) => s.setCurrentLocation);
  const setPickup = usePassengerRideStore((s) => s.setPickup);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Real available drivers around the passenger (coarse positions from GET /drivers/nearby). Drives
  // both the map markers and the "N drivers nearby" pill; nothing is shown until the data arrives.
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const nearbyCenter = pickup ?? currentLocation;
  useEffect(() => {
    if (!nearbyCenter) return;
    let isMounted = true;
    const load = async () => {
      try {
        const res = await nearbyDriversApi.getNearby({
          lat: nearbyCenter.latitude,
          lng: nearbyCenter.longitude,
        });
        if (isMounted) setNearbyDrivers(res.drivers);
      } catch {
        if (isMounted) setNearbyDrivers([]);
      }
    };
    load();
    const t = setInterval(load, 15000);
    return () => {
      isMounted = false;
      clearInterval(t);
    };
  }, [nearbyCenter?.latitude, nearbyCenter?.longitude]);

  // Check location permission on mount and acquire real GPS fix
  const hasInitialized = React.useRef(false);
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    (async () => {
      try {
        const perm = await checkForegroundLocationPermission();
        if (perm === PermissionStatus.GRANTED) {
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
            if (!pickup) {
              setPickup(point);
            }
            mapRef.current?.centerOn(coords.latitude, coords.longitude, 0.015, 0.015);
          }
        }
      } catch {
        // Continue with default view if location unavailable
      }
    })();
  }, [pickup, setCurrentLocation, setPickup]);

  const handleCenterOnMyLocation = async () => {
    try {
      const perm = await checkForegroundLocationPermission();
      if (perm !== PermissionStatus.GRANTED) {
        router.push("/(passenger-auth)/location-permission" as any);
        return;
      }
      const coords = await getCurrentCoordinates();
      if (coords) {
        mapRef.current?.centerOn(coords.latitude, coords.longitude, 0.015, 0.015);
      }
    } catch {
      // ignore
    }
  };

  // Pulse animation for user location dot
  const pulseScale = useSharedValue(0.8);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(2.5, { duration: 1800, easing: Easing.out(Easing.quad) }),
        withTiming(0.8, { duration: 0 })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1800, easing: Easing.out(Easing.quad) }),
        withTiming(0.5, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Real Interactive Map Canvas */}
      <PassengerMap
        ref={mapRef}
        style={styles.mapBg}
        pickup={
          pickup
            ? {
                latitude: pickup.latitude,
                longitude: pickup.longitude,
                title: pickup.name || "Pickup",
              }
            : null
        }
        showUserLocation={true}
        initialRegion={
          currentLocation
            ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }
            : undefined
        }
      >
        <NearbyDriverMarkers drivers={nearbyDrivers} />
      </PassengerMap>

      {/* Top Header (absolute) */}
      <View style={styles.header}>
        <Pressable style={styles.menuBtn} accessibilityLabel="Open menu">
          <MaterialIcons name="menu" size={24} color={themeColors.onSurfaceVariant} />
        </Pressable>

        <Text style={styles.brand}>Ryde</Text>

        <Pressable
          style={styles.avatarBtn}
          accessibilityLabel="Profile"
          onPress={() => router.push("/(passenger)/profile" as any)}
        >
          <Image source={{ uri: AVATAR_URI }} style={styles.avatarImg} resizeMode="cover" />
        </Pressable>
      </View>

      {/* Floating Search Bar */}
      <Pressable
        onPress={() => router.push("/(passenger)/destination-search" as any)}
        style={styles.searchBar}
      >
        <View style={styles.searchDot} />
        <Text style={styles.searchPlaceholder}>Where to?</Text>
        <View style={styles.searchScheduleIcon}>
          <MaterialIcons name="schedule" size={22} color={themeColors.onSurfaceVariant} />
        </View>
      </Pressable>

      {/* Nearby drivers pill: real count from /drivers/nearby; hidden when none/unknown. */}
      {nearbyDrivers.length > 0 ? (
        <View style={styles.nearbyVehicle} pointerEvents="none">
          <View style={styles.etaChip}>
            <Text style={styles.etaText}>
              {nearbyDrivers.length} {nearbyDrivers.length === 1 ? "driver" : "drivers"} nearby
            </Text>
          </View>
        </View>
      ) : null}

      {/* My Location FAB */}
      <Pressable
        style={styles.locationFAB}
        accessibilityLabel="Center on my location"
        onPress={handleCenterOnMyLocation}
      >
        <MaterialIcons name="my-location" size={22} color={themeColors.primary} />
      </Pressable>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Drag Handle */}
        <View style={styles.dragHandle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetScroll}
        >
          {/* Quick Ride bento */}
          <Text style={styles.sectionLabel}>QUICK RIDE</Text>
          <View style={styles.bentoGrid}>
            {/* Home shortcut */}
            <Pressable
              style={({ pressed }) => [styles.bentoCard, pressed && styles.bentoCardPressed]}
              onPress={() => router.push("/(passenger)/destination-search" as any)}
            >
              <View style={[styles.bentoIconBox, { backgroundColor: themeColors.primaryContainer }]}>
                <MaterialIcons name="home" size={20} color={themeColors.onPrimaryContainer} />
              </View>
              <Text style={styles.bentoTitle}>Home</Text>
              <Text style={styles.bentoSub} numberOfLines={1}>123 Main St, Apt 4B</Text>
            </Pressable>

            {/* Work shortcut */}
            <Pressable
              style={({ pressed }) => [styles.bentoCard, pressed && styles.bentoCardPressed]}
              onPress={() => router.push("/(passenger)/destination-search" as any)}
            >
              <View style={[styles.bentoIconBox, { backgroundColor: themeColors.secondaryContainer }]}>
                <MaterialIcons name="work" size={20} color={themeColors.onSecondaryContainer} />
              </View>
              <Text style={styles.bentoTitle}>Work</Text>
              <Text style={styles.bentoSub} numberOfLines={1}>Tech Hub, Building C</Text>
            </Pressable>
          </View>

          {/* Recent */}
          <Text style={[styles.sectionLabel, styles.recentLabel]}>RECENT</Text>
          {RECENT_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.recentItem, pressed && styles.recentItemPressed]}
              onPress={() => router.push("/(passenger)/destination-search" as any)}
            >
              <View style={styles.recentIconBox}>
                <MaterialIcons name="schedule" size={22} color={themeColors.onSurfaceVariant} />
              </View>
              <View style={styles.recentTextBlock}>
                <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.recentSub} numberOfLines={1}>{item.subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === "home";
          return (
            <Pressable
              key={item.key}
              style={({ pressed }) => [
                styles.navItem,
                isActive && styles.navItemActive,
                pressed && styles.navItemPressed,
              ]}
              onPress={() => {
                if (item.key === "payments") {
                  setShowPaymentModal(true);
                } else {
                  router.push(item.route as any);
                }
              }}
              accessibilityLabel={item.label}
            >
              <MaterialIcons
                name={item.icon}
                size={24}
                color={isActive ? themeColors.primary : themeColors.onSurfaceVariant}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Payment Information Modal (MVP1 Policy: Cash-Only PKR) */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <MaterialIcons name="payments" size={32} color={themeColors.primary} />
            </View>
            <Text style={styles.modalTitle}>Payment Method</Text>
            <View style={styles.cashBadge}>
              <MaterialIcons name="check-circle" size={16} color="#059669" />
              <Text style={styles.cashBadgeText}>Cash Only (PKR)</Text>
            </View>
            <Text style={styles.modalBody}>
              Indigo currently operates exclusively with direct cash settlements. All fares are paid in Pakistani Rupees (PKR) directly to the driver at the end of each trip.
            </Text>
            <Text style={styles.modalSub}>
              Digital wallets and card payments will be enabled in upcoming releases.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.85 }]}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.modalBtnText}>Understood</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: themeColors.surfaceContainerHigh,
    overflow: "hidden",
  },
  mapBg: {
    ...StyleSheet.absoluteFill,
  },
  // ── Header ──
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 8,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  brand: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: themeColors.primary,
    letterSpacing: -0.28,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: themeColors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarImg: {
    width: 40,
    height: 40,
  },
  // ── Search Bar ──
  searchBar: {
    position: "absolute",
    top: 116,
    left: 20,
    right: 20,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.outlineVariant,
    height: 52,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    paddingHorizontal: 12,
  },
  searchDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: themeColors.primary,
    marginRight: 10,
    marginLeft: 4,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
  },
  searchScheduleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: themeColors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Location Dot ──
  locationWrapper: {
    position: "absolute",
    top: "45%",
    left: "50%",
    zIndex: 10,
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: themeColors.primary,
  },
  locationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: themeColors.primary,
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  // ── Nearby Vehicle ──
  nearbyVehicle: {
    position: "absolute",
    top: "30%",
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
    gap: 4,
  },
  etaChip: {
    backgroundColor: themeColors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: themeColors.outlineVariant,
  },
  etaText: {
    fontSize: 10,
    fontWeight: "700",
    color: themeColors.onSurface,
  },
  carIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: themeColors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  // ── FAB ──
  locationFAB: {
    position: "absolute",
    right: 20,
    bottom: BOTTOM_NAV_HEIGHT + 288 + 12,
    zIndex: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  // ── Bottom Sheet ──
  bottomSheet: {
    position: "absolute",
    bottom: BOTTOM_NAV_HEIGHT,
    left: 0,
    right: 0,
    height: 288,
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: themeColors.outlineVariant,
    zIndex: 30,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: themeColors.outlineVariant,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  sheetScroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.onSurfaceVariant,
    lineHeight: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  recentLabel: {
    marginTop: 16,
  },
  // ── Bento grid ──
  bentoGrid: {
    flexDirection: "row",
    gap: 12,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: themeColors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.outlineVariant,
    padding: 16,
    gap: 8,
  },
  bentoCardPressed: {
    borderColor: themeColors.primary,
    backgroundColor: themeColors.surfaceContainer,
  },
  bentoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bentoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.onSurface,
    lineHeight: 24,
  },
  bentoSub: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.onSurfaceVariant,
    lineHeight: 16,
  },
  // ── Recent ──
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  recentItemPressed: {
    backgroundColor: themeColors.surfaceContainerLow,
  },
  recentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.surfaceVariant,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  recentTextBlock: {
    flex: 1,
    overflow: "hidden",
  },
  recentName: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurface,
  },
  recentSub: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.onSurfaceVariant,
    lineHeight: 16,
  },
  // ── Bottom Nav ──
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_NAV_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: themeColors.surface,
    borderTopWidth: 1,
    borderTopColor: themeColors.outlineVariant,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 40,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  navItemActive: {
    backgroundColor: themeColors.primaryContainer,
  },
  navItemPressed: {
    backgroundColor: themeColors.surfaceContainerHigh,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.onSurfaceVariant,
    lineHeight: 16,
  },
  navLabelActive: {
    color: themeColors.primary,
  },
  // ── Payment Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: themeColors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: themeColors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: themeColors.onSurface,
    marginBottom: 10,
  },
  cashBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  cashBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
  },
  modalBody: {
    fontSize: 14,
    color: themeColors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 10,
  },
  modalSub: {
    fontSize: 12,
    color: themeColors.outline,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  modalBtn: {
    width: "100%",
    backgroundColor: themeColors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: themeColors.onPrimary,
  },
});
