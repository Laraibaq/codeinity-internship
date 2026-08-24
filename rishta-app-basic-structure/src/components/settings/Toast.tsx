import React from "react";
import { View, Text, Pressable } from "react-native";
import { Icon } from "../common/Icon";
import type { ToastType } from "../../types/settings";

interface ToastProps {
  message: string | null;
  type?: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "success",
  onClose,
}) => {
  if (!message) return null;

  const iconName =
    type === "success"
      ? "check_circle"
      : type === "info"
        ? "info"
        : "alert_triangle";

  const iconColor =
    type === "success" ? "#95d3ba" : type === "info" ? "#ffdbca" : "#B45309";

  return (
    <View className="absolute bottom-20 left-5 right-5 z-[200] items-center">
      <View className="max-w-sm w-full bg-primary-container px-4 py-3 rounded-xl shadow-xl border border-primary-fixed-dim/30 flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2 flex-1">
          <Icon name={iconName} size={20} color={iconColor} />
          <Text className="text-sm font-medium text-white flex-1">
            {message}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          className="p-1 rounded-full active:bg-white/10"
          accessibilityLabel="Dismiss toast"
        >
          <Icon name="close" size={16} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </View>
    </View>
  );
};
