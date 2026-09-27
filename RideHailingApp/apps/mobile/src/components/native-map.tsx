import React, { useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";
import { themeColors } from "@/constants/theme-colors";
import { PAKISTAN_DEFAULT_REGION } from "@/constants/default-region";

export interface MapPoint {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}

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

const DEFAULT_REGION: Region = PAKISTAN_DEFAULT_REGION;

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
  initialRegion,
  showsRoutePolyline = true,
  style,
  children,
}: NativeMapProps) {
  const validPickup = isValidCoord(pickup) ? pickup : null;
  const validDropoff = isValidCoord(dropoff) ? dropoff : null;
  const validDriverLocation = isValidCoord(driverLocation) ? driverLocation : null;

  const calculatedRegion = useMemo<Region>(() => {
    if (initialRegion) return initialRegion;

    const points: MapPoint[] = [];
    if (validDriverLocation) points.push(validDriverLocation);
    if (validPickup) points.push(validPickup);
    if (validDropoff) points.push(validDropoff);

    if (points.length === 1) {
      return {
        latitude: points[0].latitude,
        longitude: points[0].longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
    }

    if (points.length > 1) {
      const lats = points.map((p) => p.latitude);
      const lngs = points.map((p) => p.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.03),
        longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.03),
      };
    }

    return DEFAULT_REGION;
  }, [initialRegion, validDriverLocation, validPickup, validDropoff]);

  const polylineCoords = useMemo(() => {
    if (!showsRoutePolyline) return [];
    if (validPickup && validDropoff) {
      return [
        { latitude: validPickup.latitude, longitude: validPickup.longitude },
        { latitude: validDropoff.latitude, longitude: validDropoff.longitude },
      ];
    }
    if (validDriverLocation && validPickup) {
      return [
        { latitude: validDriverLocation.latitude, longitude: validDriverLocation.longitude },
        { latitude: validPickup.latitude, longitude: validPickup.longitude },
      ];
    }
    if (validDriverLocation && validDropoff) {
      return [
        { latitude: validDriverLocation.latitude, longitude: validDriverLocation.longitude },
        { latitude: validDropoff.latitude, longitude: validDropoff.longitude },
      ];
    }
    return [];
  }, [showsRoutePolyline, validPickup, validDropoff, validDriverLocation]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={calculatedRegion}
        showsUserLocation={showUserLocation}
        showsCompass={false}
        showsMyLocationButton={false}
      >
        {validPickup && (
          <Marker
            coordinate={{ latitude: validPickup.latitude, longitude: validPickup.longitude }}
            title={validPickup.title || "Pickup"}
            description={validPickup.description}
            pinColor="#10b981"
          />
        )}

        {validDropoff && (
          <Marker
            coordinate={{ latitude: validDropoff.latitude, longitude: validDropoff.longitude }}
            title={validDropoff.title || "Destination"}
            description={validDropoff.description}
            pinColor="#ef4444"
          />
        )}

        {validDriverLocation && (
          <Marker
            coordinate={{
              latitude: validDriverLocation.latitude,
              longitude: validDriverLocation.longitude,
            }}
            title={validDriverLocation.title || "Your Location"}
            pinColor={themeColors.primary}
          />
        )}

        {polylineCoords.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor={themeColors.primary}
            strokeWidth={4}
          />
        )}

        {children}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
});
