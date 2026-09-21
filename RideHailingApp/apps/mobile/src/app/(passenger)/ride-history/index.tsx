import React from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { PassengerHeader } from "@/components/passenger/passenger-header";
import type { PassengerRideResponse } from "@/lib/api/passenger/rides";

const MOCK_RIDES: PassengerRideResponse[] = [
  {
    id: "ride-101",
    passengerId: "p-1",
    driverId: "d-1",
    status: "completed",
    pickupAddress: "Market St & 5th St",
    destinationAddress: "San Francisco International Airport",
    fare: 35.5,
    createdAt: "2026-09-18T14:30:00Z",
    updatedAt: "2026-09-18T15:10:00Z",
  },
  {
    id: "ride-102",
    passengerId: "p-1",
    driverId: "d-2",
    status: "completed",
    pickupAddress: "123 Powell St",
    destinationAddress: "789 Mission St",
    fare: 14.0,
    createdAt: "2026-09-15T09:15:00Z",
    updatedAt: "2026-09-15T09:35:00Z",
  },
];

export default function PassengerRideHistoryScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <PassengerHeader title="Ride History" />

      <FlatList
        data={MOCK_RIDES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(passenger)/ride-history/${item.id}`)}
            className="p-4 mb-3 rounded-2xl bg-surface border border-outline-variant/20 shadow-sm active:scale-98"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-secondary text-xs">
                {new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
              <Text className="text-on-surface text-base font-bold">
                ${item.fare.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row items-center mb-1">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
              <Text className="text-on-surface text-sm font-medium flex-1" numberOfLines={1}>
                {item.pickupAddress}
              </Text>
            </View>

            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2" />
              <Text className="text-on-surface text-sm font-medium flex-1" numberOfLines={1}>
                {item.destinationAddress}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
