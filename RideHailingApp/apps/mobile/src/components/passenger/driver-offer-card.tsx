import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import type { DriverOffer } from "@/store/passenger/passenger-ride-store";
import { formatCurrency } from "@/utils/currency";

export interface DriverOfferCardProps {
  offer: DriverOffer;
  onAccept: (offer: DriverOffer) => void;
  onReject: (offer: DriverOffer) => void;
  onCounter?: (offer: DriverOffer) => void;
  disabled?: boolean;
}

// A driver's bid on the passenger's ride. Only data the server actually has is shown: rating,
// vehicle details and ETA are omitted when null/empty instead of being replaced by placeholders.
export function DriverOfferCard({
  offer,
  onAccept,
  onReject,
  onCounter,
  disabled = false,
}: DriverOfferCardProps) {
  const vehicleLine = [offer.vehicleModel, offer.vehiclePlate].filter(Boolean).join(" • ");

  return (
    <View className="bg-surface rounded-2xl p-4 mb-3 border border-outline-variant/30 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-12 h-12 rounded-full bg-primary-fixed items-center justify-center mr-3">
            <MaterialIcons name="person" size={26} color={themeColors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-on-surface text-base font-bold" numberOfLines={1}>
              {offer.driverName}
            </Text>
            <View className="flex-row items-center mt-0.5">
              {offer.driverRating != null ? (
                <>
                  <MaterialIcons name="star" size={14} color="#f59e0b" />
                  <Text className="text-on-surface text-xs font-semibold ml-1">
                    {offer.driverRating.toFixed(1)}
                  </Text>
                </>
              ) : (
                <Text className="text-secondary text-xs">New driver</Text>
              )}
            </View>
            {vehicleLine ? (
              <Text className="text-secondary text-xs mt-0.5" numberOfLines={1}>
                {vehicleLine}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="items-end">
          <Text className="text-primary text-xl font-bold">{formatCurrency(offer.offeredFare)}</Text>
          {offer.estimatedArrivalMinutes != null ? (
            <Text className="text-secondary text-xs">~{offer.estimatedArrivalMinutes} min away</Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center mt-4 pt-3 border-t border-outline-variant/20 gap-2">
        <Pressable
          onPress={() => onReject(offer)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Reject ${offer.driverName}'s offer`}
          className="flex-1 py-2.5 rounded-xl bg-surface-container items-center justify-center active:scale-95"
        >
          <Text className="text-secondary font-semibold text-sm">Reject</Text>
        </Pressable>

        {onCounter && (
          <Pressable
            onPress={() => onCounter(offer)}
            disabled={disabled}
            accessibilityRole="button"
            className="flex-1 py-2.5 rounded-xl bg-secondary-container items-center justify-center active:scale-95 border border-outline-variant/30"
          >
            <Text className="text-on-secondary-container font-semibold text-sm">Counter</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => onAccept(offer)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Accept ${offer.driverName}'s offer at ${formatCurrency(offer.offeredFare)}`}
          className="flex-1 py-2.5 rounded-xl bg-primary items-center justify-center active:scale-95"
        >
          <Text className="text-white font-semibold text-sm">Accept</Text>
        </Pressable>
      </View>
    </View>
  );
}
