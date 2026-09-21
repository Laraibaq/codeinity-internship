import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export interface DestinationMarkerProps {
  label?: string;
}

export function DestinationMarker({ label = "Destination" }: DestinationMarkerProps) {
  return (
    <View className="items-center">
      <View className="bg-red-600 px-2 py-1 rounded-md shadow-sm mb-1">
        <Text className="text-white text-xs font-semibold">{label}</Text>
      </View>
      <View className="w-8 h-8 rounded-full bg-red-500/20 items-center justify-center">
        <View className="w-5 h-5 rounded-full bg-red-600 items-center justify-center">
          <MaterialIcons name="place" size={14} color="#ffffff" />
        </View>
      </View>
    </View>
  );
}
