import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { PassengerHeader } from "@/components/passenger/passenger-header";
import { usePassengerAuthStore } from "@/store/passenger/passenger-auth-store";

export default function PassengerProfileScreen() {
  const router = useRouter();
  const profile = usePassengerAuthStore((s) => s.profile);

  return (
    <View className="flex-1 bg-background">
      <PassengerHeader title="Passenger Profile" />

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Avatar & Info */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-full bg-primary-fixed items-center justify-center mb-3 shadow-sm">
            <MaterialIcons name="person" size={54} color={themeColors.primary} />
          </View>
          <Text className="text-xl font-bold text-on-surface">
            {profile?.fullName || "Passenger User"}
          </Text>
          <Text className="text-secondary text-sm mt-0.5">
            {profile?.email || "passenger@example.com"}
          </Text>
          <View className="flex-row items-center mt-2 bg-surface-container px-3 py-1 rounded-full">
            <MaterialIcons name="star" size={16} color="#f59e0b" />
            <Text className="text-on-surface text-xs font-bold ml-1">4.95 Rating</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View className="bg-surface rounded-2xl border border-outline-variant/30 overflow-hidden mb-6">
          <Pressable
            onPress={() => router.push("/(passenger)/saved-places")}
            className="flex-row items-center px-4 py-4 border-b border-outline-variant/20 active:bg-surface-container"
          >
            <MaterialIcons name="bookmark" size={22} color={themeColors.primary} />
            <Text className="flex-1 ml-3 text-on-surface text-base font-semibold">Saved Places</Text>
            <MaterialIcons name="chevron-right" size={22} color={themeColors.secondary} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/(passenger)/ride-history")}
            className="flex-row items-center px-4 py-4 border-b border-outline-variant/20 active:bg-surface-container"
          >
            <MaterialIcons name="history" size={22} color={themeColors.primary} />
            <Text className="flex-1 ml-3 text-on-surface text-base font-semibold">Ride History</Text>
            <MaterialIcons name="chevron-right" size={22} color={themeColors.secondary} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/(passenger)/settings")}
            className="flex-row items-center px-4 py-4 active:bg-surface-container"
          >
            <MaterialIcons name="settings" size={22} color={themeColors.primary} />
            <Text className="flex-1 ml-3 text-on-surface text-base font-semibold">Settings</Text>
            <MaterialIcons name="chevron-right" size={22} color={themeColors.secondary} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
