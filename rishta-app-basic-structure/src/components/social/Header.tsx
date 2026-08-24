import React from "react";
import { View, Text, Pressable } from "react-native";
import { Icon } from "../common/Icon";
import type { UserAccount } from "../../types/social";

interface HeaderProps {
  user: UserAccount;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenMenu,
  onOpenNotifications,
  unreadNotificationsCount = 2,
}) => {
  return (
    <View className="bg-background w-full border-b border-border-subtle/40">
      <View className="flex-row justify-between items-center px-5 h-12 w-full">
        <Pressable
          onPress={onOpenMenu}
          accessibilityLabel="Open menu"
          className="h-10 w-10 items-center justify-center -ml-2 rounded-full active:bg-surface-container-low"
        >
          <Icon name="menu" size={24} color="#003527" />
        </Pressable>

        <View className="flex-row items-center gap-2">
          <Text className="font-display text-2xl text-primary tracking-tight font-bold">
            Rishta
          </Text>
        </View>

        <Pressable
          onPress={onOpenNotifications}
          accessibilityLabel="Notifications"
          className="h-10 w-10 items-center justify-center -mr-2 rounded-full active:bg-surface-container-low relative"
        >
          <Icon name="notifications" size={24} color="#003527" />
          {unreadNotificationsCount > 0 && (
            <View className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-background" />
          )}
        </Pressable>
      </View>

      <View className="bg-surface-container-low px-5 py-1.5 border-t border-border-subtle flex-row items-center justify-center gap-2">
        <Icon name="family_home" size={14} color="#064e3b" />
        <Text className="font-body text-xs text-on-surface-variant text-center">
          Managing profile for{" "}
          <Text className="font-body font-semibold text-primary">{user.managingFor}</Text>{" "}
          as <Text className="capitalize">{user.managerRole}</Text>
        </Text>
      </View>
    </View>
  );
};
