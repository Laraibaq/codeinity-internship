import React from "react";
import { StyleSheet, View, Text, type StyleProp, type ViewStyle } from "react-native";

export interface MapPoint {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export interface NativeMapProps {
  pickup?: MapPoint | null;
  dropoff?: MapPoint | null;
  driverLocation?: MapPoint | null;
  showUserLocation?: boolean;
  initialRegion?: Region;
  showsRoutePolyline?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function isValidCoord(p?: MapPoint | null): p is MapPoint {
  return (
    p != null &&
    typeof p.latitude === "number" &&
    typeof p.longitude === "number" &&
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude) &&
    p.latitude >= -90 &&
    p.latitude <= 90 &&
    p.longitude >= -180 &&
    p.longitude <= 180
  );
}

export function NativeMap({
  pickup,
  dropoff,
  driverLocation,
  showUserLocation = false,
  showsRoutePolyline = true,
  style,
  children,
}: NativeMapProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.mapGrid}>
        <View style={styles.mapInfo}>
          <Text style={styles.mapTitle}>🗺️ Live Map Preview</Text>
          {pickup && (
            <Text style={styles.mapBadge}>🟢 Pickup: {pickup.title || `${pickup.latitude.toFixed(4)}, ${pickup.longitude.toFixed(4)}`}</Text>
          )}
          {dropoff && (
            <Text style={styles.mapBadge}>🔴 Dropoff: {dropoff.title || `${dropoff.latitude.toFixed(4)}, ${dropoff.longitude.toFixed(4)}`}</Text>
          )}
          {driverLocation && (
            <Text style={styles.mapBadge}>🚗 Driver: {driverLocation.title || `${driverLocation.latitude.toFixed(4)}, ${driverLocation.longitude.toFixed(4)}`}</Text>
          )}
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1e293b",
    overflow: "hidden",
    position: "relative",
    minHeight: 200,
  },
  mapGrid: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  mapInfo: {
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 6,
  },
  mapTitle: {
    color: "#f8fafc",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  mapBadge: {
    color: "#94a3b8",
    fontSize: 12,
  },
});
