import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

export interface DriverCardProps {
  driverName: string;
  driverRating: number;
  totalTrips?: number;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor?: string;
  onCall?: () => void;
  onMessage?: () => void;
}

export function DriverCard({
  driverName,
  driverRating,
  totalTrips,
  vehicleModel,
  vehiclePlate,
  vehicleColor,
  onCall,
  onMessage,
}: DriverCardProps) {
  return (
    <View className="bg-surface rounded-2xl p-4 border border-outline-variant/30 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-14 h-14 rounded-full bg-primary-fixed items-center justify-center mr-3">
            <MaterialIcons name="person" size={32} color={themeColors.primary} />
          </View>
          <View>
            <Text className="text-on-surface text-lg font-bold">{driverName}</Text>
            <View className="flex-row items-center mt-0.5">
              <MaterialIcons name="star" size={16} color="#f59e0b" />
              <Text className="text-on-surface text-sm font-semibold ml-1">
                {driverRating.toFixed(1)}
              </Text>
              {totalTrips !== undefined && (
                <Text className="text-secondary text-xs ml-2">
                  ({totalTrips} rides)
                </Text>
              )}
            </View>
            <Text className="text-secondary text-xs mt-1">
              {vehicleModel} • {vehiclePlate} {vehicleColor ? `(${vehicleColor})` : ""}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center space-x-2">
          {onCall && (
            <Pressable
              onPress={onCall}
              className="w-10 h-10 rounded-full bg-surface-container items-center justify-center active:scale-90 mr-2"
            >
              <MaterialIcons name="phone" size={20} color={themeColors.primary} />
            </Pressable>
          )}
          {onMessage && (
            <Pressable
              onPress={onMessage}
              className="w-10 h-10 rounded-full bg-surface-container items-center justify-center active:scale-90"
            >
              <MaterialIcons name="chat" size={20} color={themeColors.primary} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
