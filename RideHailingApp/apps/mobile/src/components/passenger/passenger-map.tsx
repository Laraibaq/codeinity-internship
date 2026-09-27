import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";
import { themeColors } from "@/constants/theme-colors";
import { PAKISTAN_DEFAULT_REGION } from "@/constants/default-region";
import { PickupMarker } from "./pickup-marker";
import { DestinationMarker } from "./destination-marker";

export interface PassengerMapLocation {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}

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
  getMapView: () => MapView | null;
}

const DEFAULT_PASSENGER_REGION: Region = PAKISTAN_DEFAULT_REGION;

export const PassengerMap = forwardRef<PassengerMapRef, PassengerMapProps>(
  (
    {
      pickup,
      destination,
      driverLocation,
      routeCoordinates,
      showUserLocation = true,
      initialRegion = DEFAULT_PASSENGER_REGION,
      style,
      children,
      onRegionChangeComplete,
      autoFitRoute = true,
    },
    ref,
  ) => {
    const mapRef = useRef<MapView | null>(null);

    // Compute route polyline coordinates
    const polylineCoords = React.useMemo(() => {
      if (routeCoordinates && routeCoordinates.length > 1) {
        return routeCoordinates;
      }
      if (pickup && destination) {
        return [
          { latitude: pickup.latitude, longitude: pickup.longitude },
          { latitude: destination.latitude, longitude: destination.longitude },
        ];
      }
      return [];
    }, [routeCoordinates, pickup, destination]);

    const fitRoute = React.useCallback(() => {
      if (!mapRef.current) return;

      const points: { latitude: number; longitude: number }[] = [];
      if (polylineCoords.length > 0) {
        points.push(...polylineCoords);
      } else {
        if (pickup) points.push({ latitude: pickup.latitude, longitude: pickup.longitude });
        if (destination)
          points.push({ latitude: destination.latitude, longitude: destination.longitude });
      }

      if (points.length >= 2) {
        mapRef.current.fitToCoordinates(points, {
          edgePadding: { top: 120, right: 60, bottom: 260, left: 60 },
          animated: true,
        });
      } else if (points.length === 1) {
        mapRef.current.animateToRegion(
          {
            latitude: points[0].latitude,
            longitude: points[0].longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          500,
        );
      }
    }, [polylineCoords, pickup, destination]);

    useImperativeHandle(
      ref,
      () => ({
        fitToRoute: fitRoute,
        centerOn: (lat: number, lon: number, latDelta = 0.02, lonDelta = 0.02) => {
          mapRef.current?.animateToRegion(
            {
              latitude: lat,
              longitude: lon,
              latitudeDelta: latDelta,
              longitudeDelta: lonDelta,
            },
            600,
          );
        },
        getMapView: () => mapRef.current,
      }),
      [fitRoute],
    );

    // Automatically fit to route when both pickup and destination or route coordinates are ready
    useEffect(() => {
      if (autoFitRoute && pickup && destination) {
        const timer = setTimeout(() => {
          fitRoute();
        }, 400);
        return () => clearTimeout(timer);
      }
    }, [autoFitRoute, pickup, destination, polylineCoords, fitRoute]);

    return (
      <View style={[styles.container, style]}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          showsUserLocation={showUserLocation}
          showsCompass={false}
          showsMyLocationButton={false}
          onRegionChangeComplete={onRegionChangeComplete}
        >
          {pickup && (
            <Marker
              coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}
              title={pickup.title || "Pickup Location"}
              description={pickup.description}
            >
              <PickupMarker label={pickup.title || "Pickup"} />
            </Marker>
          )}

          {destination && (
            <Marker
              coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
              title={destination.title || "Destination"}
              description={destination.description}
            >
              <DestinationMarker label={destination.title || "Destination"} />
            </Marker>
          )}

          {driverLocation && (
            <Marker
              coordinate={{
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
              }}
              title={driverLocation.title || "Driver"}
              description={driverLocation.description}
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
  },
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
