import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { themeColors } from "@/constants/theme-colors";

export interface PassengerHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function PassengerHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightAction,
}: PassengerHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-surface border-b border-outline-variant/20">
      <View className="flex-row items-center flex-1">
        {showBack && (
          <Pressable
            onPress={handleBack}
            className="w-10 h-10 rounded-xl bg-surface-container items-center justify-center mr-3 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={20} color={themeColors.onSurface} />
          </Pressable>
        )}
        <View className="flex-1">
          <Text className="text-on-surface text-lg font-bold" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-secondary text-xs" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {rightAction && <View className="ml-2">{rightAction}</View>}
    </View>
  );
}
