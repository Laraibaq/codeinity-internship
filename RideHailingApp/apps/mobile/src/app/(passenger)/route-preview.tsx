import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";
import {
  PassengerMap,
  type PassengerMapRef,
} from "@/components/passenger/passenger-map";
import { getDirectionsMapbox } from "@/lib/api/passenger/mapbox";

export default function PassengerRoutePreviewScreen() {
  const router = useRouter();
  const mapRef = React.useRef<PassengerMapRef>(null);

  const currentLocation = usePassengerRideStore((s) => s.currentLocation);
  const pickup = usePassengerRideStore((s) => s.pickup);
  const destination = usePassengerRideStore((s) => s.destination);
  const setRoute = usePassengerRideStore((s) => s.setRoute);

  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [durationMin, setDurationMin] = useState<number>(0);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [isFallbackRoute, setIsFallbackRoute] = useState(false);

  const effectivePickup = pickup || currentLocation;
  const effectiveDest = destination;
  const hasRoutePoints = Boolean(effectivePickup && effectiveDest);

  // Nothing to preview without a real pickup and destination -- go back rather than fake them.
  useEffect(() => {
    if (!hasRoutePoints) router.back();
  }, [hasRoutePoints, router]);

  useEffect(() => {
    if (!effectivePickup || !effectiveDest) return;
    let isMounted = true;
    (async () => {
      setIsLoadingRoute(true);
      try {
        const routeInfo = await getDirectionsMapbox(
          { latitude: effectivePickup.latitude, longitude: effectivePickup.longitude },
          { latitude: effectiveDest.latitude, longitude: effectiveDest.longitude },
        );

        if (isMounted) {
          setDistanceKm(routeInfo.distanceKm);
          setDurationMin(routeInfo.durationMinutes);
          setRouteCoords(routeInfo.geometry);
          setIsFallbackRoute(Boolean(routeInfo.isEstimatedFallback));
          setRoute(routeInfo.distanceKm, routeInfo.durationMinutes, routeInfo.geometry);
        }
      } catch {
        if (isMounted) {
          setIsFallbackRoute(true);
        }
      } finally {
        if (isMounted) {
          setIsLoadingRoute(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [effectivePickup?.latitude, effectivePickup?.longitude, effectiveDest?.latitude, effectiveDest?.longitude]);

  if (!effectivePickup || !effectiveDest) return null;

  const handleConfirm = () => {
    router.push("/(passenger)/ride-select" as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Real Interactive Route Map */}
      <PassengerMap
        ref={mapRef}
        style={styles.mapBg}
        pickup={{
          latitude: effectivePickup.latitude,
          longitude: effectivePickup.longitude,
          title: effectivePickup.name || "Pickup",
        }}
        destination={{
          latitude: effectiveDest.latitude,
          longitude: effectiveDest.longitude,
          title: effectiveDest.name || "Destination",
        }}
        routeCoordinates={routeCoords}
        autoFitRoute={true}
      />

      {/* Back button floating over map */}
      <View style={styles.topNav}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurface} />
        </Pressable>
      </View>

      {/* Bottom sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />

        {/* Route details */}
        <View style={styles.routeBlock}>
          <View style={styles.routeTimeline}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineLine} />
            <View style={styles.timelineSquare} />
          </View>
          <View style={styles.routeLabels}>
            {/* Pickup */}
            <View style={styles.routeStop}>
              <Text style={styles.stopLabel}>PICKUP</Text>
              <Text style={styles.stopName} numberOfLines={1}>
                {effectivePickup.name || effectivePickup.address || "Current Location"}
              </Text>
            </View>
            <View style={styles.routeSeparator} />
            {/* Destination */}
            <View style={styles.routeStop}>
              <Text style={styles.stopLabel}>DESTINATION</Text>
              <Text style={styles.stopName} numberOfLines={1}>
                {effectiveDest.name || effectiveDest.address || "Destination"}
              </Text>
            </View>
          </View>
        </View>

        {/* Metrics row */}
        <View style={styles.metricsCard}>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>{isFallbackRoute ? "Est. Distance" : "Distance"}</Text>
            {isLoadingRoute ? (
              <ActivityIndicator size="small" color={themeColors.primary} style={{ marginTop: 4 }} />
            ) : (
              <Text style={styles.metricValue}>
                {distanceKm}{" "}
                <Text style={styles.metricUnit}>km</Text>
              </Text>
            )}
          </View>
          <View style={styles.metricDivider} />
          <View style={[styles.metricBlock, styles.metricBlockRight]}>
            <Text style={styles.metricLabel}>{isFallbackRoute ? "Est. Duration" : "Duration"}</Text>
            {isLoadingRoute ? (
              <ActivityIndicator size="small" color={themeColors.primary} style={{ marginTop: 4 }} />
            ) : (
              <Text style={[styles.metricValue, styles.metricValuePrimary]}>
                {durationMin}{" "}
                <Text style={[styles.metricUnit, styles.metricUnitPrimary]}>min</Text>
              </Text>
            )}
          </View>
        </View>

        {/* Explicit fallback indicator */}
        {isFallbackRoute && (
          <View style={styles.fallbackNotice}>
            <MaterialIcons name="info-outline" size={14} color={themeColors.outline} />
            <Text style={styles.fallbackNoticeText}>
              Estimated direct route (Mapbox token not configured)
            </Text>
          </View>
        )}

        {/* CTA */}
        <Pressable
          onPress={handleConfirm}
          style={({ pressed }) => [styles.btnConfirm, pressed && styles.pressed]}
        >
          <Text style={styles.btnConfirmText}>Choose Ride</Text>
          <MaterialIcons name="arrow-forward" size={22} color={themeColors.onPrimary} />
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
  // ── Map markers ──
  pickupDot: {
    position: "absolute",
    top: "67%",
    left: "30%",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: themeColors.primary,
    borderWidth: 3,
    borderColor: "rgba(53,37,205,0.25)",
    zIndex: 10,
  },
  destinationPin: {
    position: "absolute",
    top: "26%",
    left: "68%",
    zIndex: 10,
    alignItems: "center",
  },
  destEtaChip: {
    backgroundColor: themeColors.onSurface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 4,
  },
  destEtaText: {
    color: themeColors.surface,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    lineHeight: 16,
  },
  // ── Top Nav ──
  topNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  backBtnPressed: {
    backgroundColor: themeColors.surfaceContainerHigh,
  },
  // ── Bottom Sheet ──
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: themeColors.outlineVariant,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  // ── Route timeline ──
  routeBlock: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  routeTimeline: {
    alignItems: "center",
    paddingTop: 18,
    gap: 2,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.primary,
  },
  timelineLine: {
    width: 1,
    height: 36,
    backgroundColor: themeColors.outlineVariant,
    marginVertical: 4,
  },
  timelineSquare: {
    width: 8,
    height: 8,
    borderRadius: 1,
    backgroundColor: themeColors.onSurface,
  },
  routeLabels: {
    flex: 1,
    gap: 0,
  },
  routeStop: {
    paddingVertical: 4,
  },
  stopLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: themeColors.onSurfaceVariant,
    lineHeight: 16,
    marginBottom: 4,
  },
  stopName: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.onSurface,
    lineHeight: 24,
  },
  routeSeparator: {
    height: 1,
    backgroundColor: "rgba(199,196,216,0.3)",
    marginVertical: 8,
  },
  // ── Metrics ──
  metricsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.2)",
    marginBottom: 24,
  },
  metricBlock: {
    flex: 1,
    gap: 4,
  },
  metricBlockRight: {
    alignItems: "flex-end",
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.onSurfaceVariant,
    lineHeight: 16,
  },
  metricValue: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    letterSpacing: 0.48,
    color: themeColors.onSurface,
  },
  metricValuePrimary: {
    color: themeColors.primary,
  },
  metricUnit: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
  },
  metricUnitPrimary: {
    color: "rgba(53,37,205,0.7)",
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(199,196,216,0.3)",
    marginHorizontal: 16,
  },
  // ── CTA ──
  btnConfirm: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  btnConfirmText: {
    color: themeColors.onPrimary,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  fallbackNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(119, 117, 135, 0.08)",
    borderRadius: 8,
    marginBottom: 12,
  },
  fallbackNoticeText: {
    fontSize: 12,
    color: themeColors.onSurfaceVariant,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
