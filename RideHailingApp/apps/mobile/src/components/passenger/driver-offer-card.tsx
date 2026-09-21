import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import type { DriverOffer } from "@/store/passenger/passenger-ride-store";

export interface DriverOfferCardProps {
  offer: DriverOffer;
  onAccept: (offer: DriverOffer) => void;
  onDecline: (offerId: string) => void;
  currencySymbol?: string;
}

export function DriverOfferCard({
  offer,
  onAccept,
  onDecline,
  currencySymbol = "$",
}: DriverOfferCardProps) {
  return (
    <View className="bg-surface rounded-2xl p-4 mb-3 border border-outline-variant/30 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-primary-fixed items-center justify-center mr-3">
            <MaterialIcons name="person" size={26} color={themeColors.primary} />
          </View>
          <View>
            <Text className="text-on-surface text-base font-bold">{offer.driverName}</Text>
            <View className="flex-row items-center mt-0.5">
              <MaterialIcons name="star" size={14} color="#f59e0b" />
              <Text className="text-on-surface text-xs font-semibold ml-1">
                {offer.driverRating.toFixed(1)}
              </Text>
              <Text className="text-secondary text-xs ml-2">
                {offer.vehicleModel} • {offer.vehiclePlate}
              </Text>
            </View>
          </View>
        </View>

        <View className="items-end">
          <Text className="text-primary text-xl font-bold">
            {currencySymbol}{offer.offeredFare.toFixed(2)}
          </Text>
          <Text className="text-secondary text-xs">
            {offer.estimatedArrivalMinutes} min away
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mt-4 pt-3 border-t border-outline-variant/20">
        <Pressable
          onPress={() => onDecline(offer.id)}
          className="flex-1 py-2.5 mr-2 rounded-xl bg-surface-container items-center justify-center active:scale-95"
        >
          <Text className="text-secondary font-semibold text-sm">Decline</Text>
        </Pressable>

        <Pressable
          onPress={() => onAccept(offer)}
          className="flex-1 py-2.5 ml-2 rounded-xl bg-primary items-center justify-center active:scale-95"
        >
          <Text className="text-white font-semibold text-sm">Accept</Text>
        </Pressable>
      </View>
    </View>
  );
}
