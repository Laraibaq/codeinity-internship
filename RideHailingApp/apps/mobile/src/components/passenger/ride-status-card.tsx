import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import type { PassengerRideStatus } from "@/store/passenger/passenger-ride-store";

export interface RideStatusCardProps {
  status: PassengerRideStatus;
  statusText?: string;
  subText?: string;
}

const STATUS_CONFIG: Record<
  PassengerRideStatus,
  { label: string; sub: string; icon: keyof typeof MaterialIcons.glyphMap; color: string }
> = {
  idle: {
    label: "Ready to ride",
    sub: "Where would you like to go?",
    icon: "directions-car",
    color: themeColors.primary,
  },
  selecting_pickup: {
    label: "Select Pickup",
    sub: "Confirm where the driver should pick you up",
    icon: "my-location",
    color: "#10b981",
  },
  selecting_destination: {
    label: "Select Destination",
    sub: "Where are you heading?",
    icon: "place",
    color: "#ef4444",
  },
  offering_fare: {
    label: "Propose Fare",
    sub: "Enter a fair offer for your ride",
    icon: "attach-money",
    color: themeColors.primary,
  },
  waiting_for_drivers: {
    label: "Looking for Drivers",
    sub: "Waiting for nearby drivers to respond...",
    icon: "radar",
    color: "#f59e0b",
  },
  driver_assigned: {
    label: "Driver Assigned",
    sub: "Your driver is heading to the pickup location",
    icon: "local-taxi",
    color: themeColors.primary,
  },
  driver_arrived: {
    label: "Driver Arrived",
    sub: "Your driver is waiting at the pickup spot",
    icon: "notifications-active",
    color: "#10b981",
  },
  in_progress: {
    label: "Trip in Progress",
    sub: "Enjoy your ride to the destination",
    icon: "navigation",
    color: themeColors.primary,
  },
  completed: {
    label: "Ride Completed",
    sub: "You have arrived at your destination",
    icon: "check-circle",
    color: "#10b981",
  },
  cancelled: {
    label: "Ride Cancelled",
    sub: "This ride was cancelled",
    icon: "cancel",
    color: "#ef4444",
  },
};

export function RideStatusCard({ status, statusText, subText }: RideStatusCardProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <View className="bg-surface rounded-2xl p-4 border border-outline-variant/30 shadow-sm flex-row items-center">
      <View
        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: `${config.color}15` }}
      >
        <MaterialIcons name={config.icon} size={24} color={config.color} />
      </View>
      <View className="flex-1">
        <Text className="text-on-surface text-base font-bold">
          {statusText || config.label}
        </Text>
        <Text className="text-secondary text-xs mt-0.5">
          {subText || config.sub}
        </Text>
      </View>
    </View>
  );
}
