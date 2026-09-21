import React from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { PassengerHeader } from "@/components/passenger/passenger-header";
import { usePassengerAuthStore } from "@/store/passenger/passenger-auth-store";

export default function PassengerSettingsScreen() {
  const router = useRouter();
  const logoutPassenger = usePassengerAuthStore((s) => s.logoutPassenger);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logoutPassenger();
          router.replace("/(passenger-auth)/welcome");
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <PassengerHeader title="Settings" />

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-secondary text-xs uppercase font-bold tracking-wider mb-3">
          App Preferences
        </Text>

        <View className="bg-surface rounded-2xl border border-outline-variant/30 overflow-hidden mb-6">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-outline-variant/20">
            <View className="flex-row items-center">
              <MaterialIcons name="notifications-none" size={22} color="#6b7280" />
              <Text className="ml-3 text-on-surface text-base">Push Notifications</Text>
            </View>
            <Text className="text-secondary text-sm">Enabled</Text>
          </View>

          <View className="flex-row items-center justify-between px-4 py-4 border-b border-outline-variant/20">
            <View className="flex-row items-center">
              <MaterialIcons name="language" size={22} color="#6b7280" />
              <Text className="ml-3 text-on-surface text-base">Language</Text>
            </View>
            <Text className="text-secondary text-sm">English</Text>
          </View>

          <View className="flex-row items-center justify-between px-4 py-4">
            <View className="flex-row items-center">
              <MaterialIcons name="security" size={22} color="#6b7280" />
              <Text className="ml-3 text-on-surface text-base">Privacy & Safety</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
          </View>
        </View>

        <Text className="text-secondary text-xs uppercase font-bold tracking-wider mb-3">
          Account
        </Text>

        <View className="bg-surface rounded-2xl border border-outline-variant/30 overflow-hidden">
          <Pressable
            onPress={handleSignOut}
            className="flex-row items-center px-4 py-4 active:bg-error-container/20"
          >
            <MaterialIcons name="logout" size={22} color="#ba1a1a" />
            <Text className="ml-3 text-error text-base font-semibold">Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
