import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

export interface FareInputProps {
  value: number;
  onChangeValue: (val: number) => void;
  recommendedFare?: number;
  minFare?: number;
  maxFare?: number;
  currencySymbol?: string;
  step?: number;
}

export function FareInput({
  value,
  onChangeValue,
  recommendedFare,
  minFare = 5,
  maxFare = 500,
  currencySymbol = "$",
  step = 1,
}: FareInputProps) {
  const handleDecrement = () => {
    const next = Math.max(minFare, value - step);
    onChangeValue(next);
  };

  const handleIncrement = () => {
    const next = Math.min(maxFare, value + step);
    onChangeValue(next);
  };

  return (
    <View className="bg-surface rounded-2xl p-4 border border-outline-variant/30">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-on-surface text-sm font-semibold">Your Fare Offer</Text>
        {recommendedFare !== undefined && (
          <Text className="text-secondary text-xs">
            Recommended: {currencySymbol}{recommendedFare.toFixed(2)}
          </Text>
        )}
      </View>

      <View className="flex-row items-center justify-between bg-surface-container rounded-xl p-2">
        <Pressable
          onPress={handleDecrement}
          className="w-12 h-12 rounded-xl bg-surface items-center justify-center border border-outline-variant/30 active:scale-95"
        >
          <MaterialIcons name="remove" size={24} color={themeColors.onSurface} />
        </Pressable>

        <View className="flex-row items-center">
          <Text className="text-on-surface text-3xl font-bold mr-1">{currencySymbol}</Text>
          <TextInput
            value={value ? String(value) : ""}
            onChangeText={(text) => {
              const parsed = parseFloat(text.replace(/[^0-9.]/g, ""));
              if (!isNaN(parsed)) {
                onChangeValue(parsed);
              } else if (text === "") {
                onChangeValue(0);
              }
            }}
            keyboardType="decimal-pad"
            className="text-on-surface text-3xl font-bold text-center min-w-[70px]"
          />
        </View>

        <Pressable
          onPress={handleIncrement}
          className="w-12 h-12 rounded-xl bg-primary items-center justify-center active:scale-95"
        >
          <MaterialIcons name="add" size={24} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}
