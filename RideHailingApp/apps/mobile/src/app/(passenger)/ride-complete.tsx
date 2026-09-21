import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { PassengerHeader } from "@/components/passenger/passenger-header";
import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";

export default function PassengerRideCompleteScreen() {
  const router = useRouter();
  const resetRide = usePassengerRideStore((s) => s.resetRide);
  const selectedOffer = usePassengerRideStore((s) => s.selectedOffer);
  const [rating, setRating] = useState(5);

  const handleDone = () => {
    resetRide();
    router.replace("/(passenger)/home");
  };

  return (
    <View className="flex-1 bg-background">
      <PassengerHeader title="Trip Completed" showBack={false} />

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-full bg-emerald-500/10 items-center justify-center mb-3">
            <MaterialIcons name="check-circle" size={40} color="#10b981" />
          </View>
          <Text className="text-2xl font-bold text-on-surface">You have arrived!</Text>
          <Text className="text-secondary text-sm mt-1">
            We hope you enjoyed your ride.
          </Text>
        </View>

        {/* Fare Receipt Card */}
        <View className="bg-surface rounded-2xl p-5 border border-outline-variant/30 mb-6 shadow-sm">
          <Text className="text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
            Trip Total
          </Text>
          <Text className="text-3xl font-bold text-on-surface mb-4">
            ${selectedOffer?.offeredFare ? selectedOffer.offeredFare.toFixed(2) : "25.00"}
          </Text>

          <View className="pt-3 border-t border-outline-variant/20 flex-row justify-between items-center">
            <Text className="text-secondary text-sm">Driver</Text>
            <Text className="text-on-surface text-sm font-semibold">
              {selectedOffer?.driverName || "Alex Robinson"}
            </Text>
          </View>
        </View>

        {/* Driver Rating Box */}
        <View className="bg-surface rounded-2xl p-5 border border-outline-variant/30 items-center shadow-sm">
          <Text className="text-on-surface text-base font-bold mb-1">Rate your driver</Text>
          <Text className="text-secondary text-xs mb-4">How was your experience?</Text>

          <View className="flex-row items-center space-x-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setRating(star)}
                className="p-1 active:scale-125"
              >
                <MaterialIcons
                  name={star <= rating ? "star" : "star-outline"}
                  size={32}
                  color={star <= rating ? "#f59e0b" : "#9ca3af"}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="p-6 bg-surface border-t border-outline-variant/20">
        <Pressable
          onPress={handleDone}
          className="w-full py-4 rounded-2xl bg-primary items-center justify-center active:scale-98 shadow-sm"
        >
          <Text className="text-white text-base font-bold">Done & Back to Home</Text>
        </Pressable>
      </View>
    </View>
  );
}
