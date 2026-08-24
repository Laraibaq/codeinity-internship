import React from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import type { NavTab } from "../../types/social";

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingRequestsCount: number;
  unreadMessagesCount: number;
}

const TABS: { id: NavTab; label: string; icon: string; filledWhenActive?: boolean }[] = [
  { id: "explore", label: "Explore", icon: "search" },
  { id: "requests", label: "Requests", icon: "person_add", filledWhenActive: true },
  { id: "matches", label: "Matches", icon: "favorite", filledWhenActive: true },
  { id: "inbox", label: "Inbox", icon: "mail", filledWhenActive: true },
  { id: "profile", label: "Profile", icon: "account_circle" },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  pendingRequestsCount,
  unreadMessagesCount,
}) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 768;

  if (isWide) {
    return (
      <View className="bg-surface-white border-b border-border-subtle flex-row justify-center gap-10 py-3">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onSelectTab(tab.id)}
              className={`flex-row items-center gap-2 ${isActive ? "border-b-2 border-primary-container pb-1" : ""}`}
            >
              <Icon
                name={tab.icon}
                size={20}
                color={isActive ? "#003527" : "#404944"}
                fill={isActive && tab.filledWhenActive}
              />
              <Text
                className={`font-body text-sm font-semibold ${isActive ? "text-primary" : "text-on-surface-variant"}`}
              >
                {tab.label}
              </Text>
              {tab.id === "requests" && pendingRequestsCount > 0 && (
                <View className="bg-error px-1.5 py-0.5 rounded-full">
                  <Text className="text-white text-[10px] font-bold">{pendingRequestsCount}</Text>
                </View>
              )}
              {tab.id === "inbox" && unreadMessagesCount > 0 && (
                <View className="w-2 h-2 bg-gold rounded-full" />
              )}
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View
      className="absolute bottom-0 left-0 right-0 z-50 rounded-t-xl bg-surface-white border-t border-border-subtle shadow-lg"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="flex-row justify-around items-center px-4 py-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onSelectTab(tab.id)}
              className="items-center justify-center min-w-[64px] h-12 active:opacity-70"
            >
              <View className="relative">
                <Icon
                  name={tab.icon}
                  size={24}
                  color={isActive ? "#003527" : "#404944"}
                  fill={isActive && tab.filledWhenActive}
                />
                {tab.id === "requests" && pendingRequestsCount > 0 && (
                  <View className="absolute -top-1 -right-2 bg-error px-1.5 py-0.5 rounded-full min-w-[16px] items-center">
                    <Text className="text-white text-[10px] font-bold">{pendingRequestsCount}</Text>
                  </View>
                )}
                {tab.id === "inbox" && unreadMessagesCount > 0 && (
                  <View className="absolute top-0 right-0 w-2 h-2 bg-gold rounded-full" />
                )}
              </View>
              <Text
                className={`font-body text-[10px] font-semibold mt-0.5 ${isActive ? "text-primary" : "text-on-surface-variant opacity-70"}`}
              >
                {tab.label}
              </Text>
              {isActive && tab.id !== "explore" && tab.id !== "profile" && (
                <View className="w-1 h-1 bg-gold rounded-full mt-0.5" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
