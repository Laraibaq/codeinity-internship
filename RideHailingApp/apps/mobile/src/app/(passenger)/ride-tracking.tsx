import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { PassengerMap } from "@/components/passenger/passenger-map";
import { DriverCard } from "@/components/passenger/driver-card";
import { RideStatusCard } from "@/components/passenger/ride-status-card";
import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";
import { socketClient } from "@/lib/realtime/socket-client";
import { apiClient } from "@/lib/api-client";

type FreshnessStatus = "live" | "stale" | "unavailable";

export default function PassengerRideTrackingScreen() {
  const router = useRouter();
  const {
    createdRideId,
    currentRideId,
    pickup,
    destination,
    selectedOffer,
    rideStatus,
    setRideStatus,
  } = usePassengerRideStore();

  const effectiveRideId = createdRideId || currentRideId;

  const [driverCoords, setDriverCoords] = useState<{
    latitude: number;
    longitude: number;
    timestamp?: string;
  } | null>(null);

  const [freshnessStatus, setFreshnessStatus] = useState<FreshnessStatus>("unavailable");
  const [freshnessText, setFreshnessText] = useState<string>("Connecting to driver...");
  const latestTimestampRef = useRef<number | null>(null);

  const evaluateFreshness = useCallback(() => {
    if (!latestTimestampRef.current) {
      setFreshnessStatus("unavailable");
      setFreshnessText("Driver location unavailable");
      return;
    }

    const elapsedMs = Date.now() - latestTimestampRef.current;
    const elapsedSec = Math.round(elapsedMs / 1000);

    if (elapsedSec <= 30) {
      setFreshnessStatus("live");
      setFreshnessText(
        elapsedSec <= 3
          ? "Live • Updated just now"
          : `Live • Updated ${elapsedSec}s ago`,
      );
    } else if (elapsedSec <= 120) {
      setFreshnessStatus("stale");
      setFreshnessText("Driver location may be outdated");
    } else {
      setFreshnessStatus("unavailable");
      setFreshnessText("Driver location unavailable");
    }
  }, []);

  // Fetch authoritative state from REST API
  const fetchAuthoritativeRideState = useCallback(async () => {
    if (!effectiveRideId) return;
    try {
      const res = await apiClient.get<any>(`/rides/${effectiveRideId}`);
      if (!res.data) return;

      const ride = res.data;
      if (ride.status === "completed") {
        setRideStatus("completed");
        router.push("/(passenger)/ride-complete" as any);
        return;
      }
      if (ride.status === "cancelled") {
        setRideStatus("cancelled");
        router.push("/(passenger)/home" as any);
        return;
      }
      if (ride.status === "ongoing") {
        setRideStatus("in_progress");
      }

      if (ride.driver && ride.driver.currentLat != null && ride.driver.currentLng != null) {
        setDriverCoords({
          latitude: Number(ride.driver.currentLat),
          longitude: Number(ride.driver.currentLng),
          timestamp: ride.driver.updatedAt,
        });
        const updatedAtMs = ride.driver.updatedAt ? new Date(ride.driver.updatedAt).getTime() : Date.now();
        latestTimestampRef.current = updatedAtMs;
        evaluateFreshness();
      }
    } catch (err) {
      console.warn("[RideTracking] Could not fetch authoritative ride state:", err);
    }
  }, [effectiveRideId, evaluateFreshness, router, setRideStatus]);

  useEffect(() => {
    if (!effectiveRideId) return;

    let isMounted = true;

    // 1. Initial authoritative load
    fetchAuthoritativeRideState();

    // 2. Connect socket and join ride room
    socketClient.connect().then(() => {
      if (isMounted) {
        socketClient.joinRoom(`ride:${effectiveRideId}`);
      }
    });

    // 3. Listen for live driver location updates
    const unsubLocation = socketClient.on(
      "driver:location-updated",
      (data: { rideId: string; driverId: string; lat: number; lng: number; timestamp?: string }) => {
        if (!isMounted) return;
        if (data.rideId && data.rideId !== effectiveRideId) return;

        setDriverCoords({
          latitude: data.lat,
          longitude: data.lng,
          timestamp: data.timestamp,
        });
        const ts = data.timestamp ? new Date(data.timestamp).getTime() : Date.now();
        latestTimestampRef.current = ts;
        evaluateFreshness();
      },
    );

    // 4. Listen for ride status transitions
    const unsubStatus = socketClient.on(
      "ride:status-changed",
      (data: { rideId: string; status: string }) => {
        if (!isMounted) return;
        if (data.rideId && data.rideId !== effectiveRideId) return;

        if (data.status === "ongoing") {
          setRideStatus("in_progress");
        } else if (data.status === "completed") {
          setRideStatus("completed");
          router.push("/(passenger)/ride-complete" as any);
        } else if (data.status === "cancelled") {
          setRideStatus("cancelled");
          router.push("/(passenger)/home" as any);
        }
      },
    );

    // 5. Periodic freshness evaluation & REST fallback sync every 10 seconds
    const freshnessTimer = setInterval(() => {
      if (isMounted) {
        evaluateFreshness();
      }
    }, 5000);

    const fallbackRestTimer = setInterval(() => {
      if (isMounted && (!socketClient.isConnected() || freshnessStatus !== "live")) {
        fetchAuthoritativeRideState();
      }
    }, 10000);

    return () => {
      isMounted = false;
      unsubLocation();
      unsubStatus();
      socketClient.leaveRoom(`ride:${effectiveRideId}`);
      clearInterval(freshnessTimer);
      clearInterval(fallbackRestTimer);
    };
  }, [effectiveRideId, evaluateFreshness, fetchAuthoritativeRideState, freshnessStatus, router, setRideStatus]);

  const driverMarkerPoint =
    driverCoords && freshnessStatus !== "unavailable"
      ? {
          latitude: driverCoords.latitude,
          longitude: driverCoords.longitude,
          title: selectedOffer?.driverName || "Driver",
          description: freshnessText,
        }
      : null;

  return (
    <View className="flex-1 bg-background">
      {/* Map View */}
      <View className="flex-1 relative">
        <PassengerMap
          pickup={pickup}
          destination={destination}
          driverLocation={driverMarkerPoint}
          showUserLocation
        />

        {/* Floating Top Header */}
        <View className="absolute top-12 left-4 right-4 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.push("/(passenger)/home")}
            className="w-11 h-11 rounded-full bg-surface items-center justify-center shadow-md border border-outline-variant/30 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={22} color="#151c27" />
          </Pressable>

          {/* Freshness Status Pill */}
          <View className="bg-surface/95 backdrop-blur-md px-4 py-2 rounded-full border border-outline-variant/30 shadow-md flex-row items-center gap-2">
            <View
              className={`w-2.5 h-2.5 rounded-full ${
                freshnessStatus === "live"
                  ? "bg-emerald-500"
                  : freshnessStatus === "stale"
                    ? "bg-amber-500"
                    : "bg-slate-400"
              }`}
            />
            <Text className="text-on-surface text-xs font-semibold">
              {freshnessText}
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/(passenger)/ride-complete")}
            className="w-11 h-11 rounded-full bg-emerald-500 items-center justify-center shadow-md active:scale-95"
          >
            <MaterialIcons name="check" size={22} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      {/* Bottom Information Card */}
      <View className="bg-surface rounded-t-3xl p-5 border-t border-outline-variant/30 shadow-2xl space-y-4">
        <RideStatusCard
          status={rideStatus === "idle" ? "driver_assigned" : rideStatus}
          statusText={
            rideStatus === "driver_arrived"
              ? "Driver has arrived!"
              : rideStatus === "in_progress"
                ? "Ride in progress"
                : `${selectedOffer?.driverName || "Driver"} is on the way`
          }
          subText={`Meeting spot: ${pickup?.name || pickup?.address || "Pickup Location"}`}
        />

        <DriverCard
          driverName={selectedOffer?.driverName || "Driver"}
          driverRating={selectedOffer?.driverRating || 4.9}
          totalTrips={842}
          vehicleModel={selectedOffer?.vehicleModel || "Standard"}
          vehiclePlate={selectedOffer?.vehiclePlate || "ABC-123"}
          vehicleColor={selectedOffer?.vehicleColor || "Silver"}
          onCall={() => {}}
          onMessage={() => {}}
        />

        {/* SOS Emergency button */}
        <Pressable
          className="w-full py-3 rounded-2xl bg-error-container items-center justify-center active:scale-98"
        >
          <Text className="text-error font-bold text-sm">Emergency SOS (Safety)</Text>
        </Pressable>
      </View>
    </View>
  );
}
