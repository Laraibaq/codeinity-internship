import React, { forwardRef, useImperativeHandle } from "react";
import { StyleSheet, View, Text, type StyleProp, type ViewStyle } from "react-native";

export interface PassengerMapLocation {
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

export interface PassengerMapProps {
  pickup?: PassengerMapLocation | null;
  destination?: PassengerMapLocation | null;
  driverLocation?: PassengerMapLocation | null;
  routeCoordinates?: { latitude: number; longitude: number }[] | null;
  showUserLocation?: boolean;
  initialRegion?: Region;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  onRegionChangeComplete?: (region: Region) => void;
  autoFitRoute?: boolean;
}

export interface PassengerMapRef {
  fitToRoute: () => void;
  centerOn: (lat: number, lon: number, latDelta?: number, lonDelta?: number) => void;
  getMapView: () => any;
}

export const PassengerMap = forwardRef<PassengerMapRef, PassengerMapProps>(
  (
    {
      pickup,
      destination,
      driverLocation,
      routeCoordinates,
      style,
      children,
    },
    ref,
  ) => {
    useImperativeHandle(ref, () => ({
      fitToRoute: () => {},
      centerOn: () => {},
      getMapView: () => null,
    }));

    return (
      <View style={[styles.container, style]}>
        <View style={styles.mapGrid}>
          <View style={styles.mapInfo}>
            <Text style={styles.mapTitle}>🗺️ Passenger Map Preview</Text>
            {pickup && (
              <Text style={styles.mapBadge}>🟢 Pickup: {pickup.title || `${pickup.latitude.toFixed(4)}, ${pickup.longitude.toFixed(4)}`}</Text>
            )}
            {destination && (
              <Text style={styles.mapBadge}>🔴 Destination: {destination.title || `${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}`}</Text>
            )}
            {driverLocation && (
              <Text style={styles.mapBadge}>🚗 Driver: {driverLocation.title || `${driverLocation.latitude.toFixed(4)}, ${driverLocation.longitude.toFixed(4)}`}</Text>
            )}
            {routeCoordinates && (
              <Text style={styles.mapBadge}>📍 Route: {routeCoordinates.length} waypoints plotted</Text>
            )}
          </View>
        </View>
        {children}
      </View>
    );
  },
);

PassengerMap.displayName = "PassengerMap";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1e293b",
    overflow: "hidden",
    position: "relative",
    minHeight: 220,
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
