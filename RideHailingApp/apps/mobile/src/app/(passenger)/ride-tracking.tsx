import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { PassengerMap } from "@/components/passenger/passenger-map";
import { DriverCard } from "@/components/passenger/driver-card";
import { RideStatusCard } from "@/components/passenger/ride-status-card";
import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";

export default function PassengerRideTrackingScreen() {
  const router = useRouter();
  const pickup = usePassengerRideStore((s) => s.pickup);
  const destination = usePassengerRideStore((s) => s.destination);
  const selectedOffer = usePassengerRideStore((s) => s.selectedOffer);
  const rideStatus = usePassengerRideStore((s) => s.rideStatus);

  const driverPoint = pickup
    ? {
        latitude: pickup.latitude + 0.003,
        longitude: pickup.longitude + 0.003,
        title: selectedOffer?.driverName || "Driver",
      }
    : null;

  return (
    <View className="flex-1 bg-background">
      {/* Map View */}
      <View className="flex-1 relative">
        <PassengerMap
          pickup={pickup}
          destination={destination}
          driverLocation={driverPoint}
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

          <View className="bg-surface/90 backdrop-blur-md px-4 py-2 rounded-full border border-outline-variant/30 shadow-md">
            <Text className="text-on-surface text-xs font-bold">
              Arriving in {selectedOffer?.estimatedArrivalMinutes || 4} mins
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
              : `${selectedOffer?.driverName || "Driver"} is on the way`
          }
          subText={`Meeting spot: ${pickup?.name || pickup?.address || "Pickup Location"}`}
        />

        <DriverCard
          driverName={selectedOffer?.driverName || "Alex Robinson"}
          driverRating={selectedOffer?.driverRating || 4.9}
          totalTrips={842}
          vehicleModel={selectedOffer?.vehicleModel || "Toyota Camry"}
          vehiclePlate={selectedOffer?.vehiclePlate || "8XYZ123"}
          vehicleColor={selectedOffer?.vehicleColor || "Silver"}
          onCall={() => {}}
          onMessage={() => {}}
        />

        {/* SOS Emergency button skeleton */}
        <Pressable
          className="w-full py-3 rounded-2xl bg-error-container items-center justify-center active:scale-98"
        >
          <Text className="text-error font-bold text-sm">Emergency SOS (Safety)</Text>
        </Pressable>
      </View>
    </View>
  );
}
