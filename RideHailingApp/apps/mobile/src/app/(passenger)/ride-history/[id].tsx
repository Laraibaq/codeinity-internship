import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { PassengerHeader } from "@/components/passenger/passenger-header";

export default function PassengerRideDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-background">
      <PassengerHeader title="Ride Details" />

      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="bg-surface rounded-2xl p-5 border border-outline-variant/30 mb-5 shadow-sm">
          <Text className="text-secondary text-xs uppercase font-bold tracking-wider mb-1">
            Trip ID: {id}
          </Text>
          <Text className="text-2xl font-bold text-on-surface mb-4">$35.50</Text>

          <View className="space-y-3 pt-3 border-t border-outline-variant/20">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-emerald-500 mr-3" />
              <View className="flex-1">
                <Text className="text-secondary text-xs">Pickup</Text>
                <Text className="text-on-surface text-sm font-semibold">Market St & 5th St</Text>
              </View>
            </View>

            <View className="flex-row items-center mt-3">
              <View className="w-3 h-3 rounded-full bg-red-500 mr-3" />
              <View className="flex-1">
                <Text className="text-secondary text-xs">Destination</Text>
                <Text className="text-on-surface text-sm font-semibold">
                  San Francisco International Airport
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="bg-surface rounded-2xl p-5 border border-outline-variant/30 shadow-sm">
          <Text className="text-on-surface text-base font-bold mb-3">Driver Info</Text>
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-primary-fixed items-center justify-center mr-3">
              <MaterialIcons name="person" size={26} color={themeColors.primary} />
            </View>
            <View>
              <Text className="text-on-surface text-base font-semibold">Michael Chang</Text>
              <View className="flex-row items-center mt-0.5">
                <MaterialIcons name="star" size={14} color="#f59e0b" />
                <Text className="text-on-surface text-xs font-semibold ml-1">4.9</Text>
                <Text className="text-secondary text-xs ml-2">Toyota Camry • 7ABC123</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
