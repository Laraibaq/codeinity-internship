import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRequests: () => void;
  onNavigateToMatches: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToRequests,
  onNavigateToMatches,
}) => {
  const insets = useSafeAreaInsets();

  if (!isOpen) return null;

  return (
    <View className="absolute inset-0 z-50 bg-black/40">
      <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Close notifications" />

      <View
        className="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-surface-white border-l border-border-subtle"
        style={{ paddingTop: insets.top }}
      >
        <View className="p-5 border-b border-border-subtle flex-row items-center justify-between bg-surface-container-low">
          <View className="flex-row items-center gap-2">
            <Icon name="notifications" size={20} color="#064e3b" />
            <Text className="font-display text-lg font-bold text-primary">Notifications</Text>
          </View>
          <Pressable onPress={onClose} className="p-1 rounded-full active:bg-surface-container-high">
            <Icon name="close" size={24} color="#707974" />
          </Pressable>
        </View>

        <ScrollView className="flex-1">
          <Pressable
            onPress={() => {
              onClose();
              onNavigateToRequests();
            }}
            className="p-4 flex-row gap-3 active:bg-surface-container-low border-b border-border-subtle"
          >
            <View className="w-10 h-10 rounded-full bg-primary-container/10 items-center justify-center">
              <Icon name="person_add" size={20} color="#064e3b" />
            </View>
            <View className="flex-1">
              <Text className="font-body text-[13px] text-on-surface font-medium leading-snug">
                <Text className="font-body font-semibold">Sana, 26 (Doctor)</Text> sent you a connection approval
                request.
              </Text>
              <Text className="font-body text-[11px] text-outline mt-1">3 hours ago</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              onClose();
              onNavigateToMatches();
            }}
            className="p-4 flex-row gap-3 active:bg-surface-container-low border-b border-border-subtle"
          >
            <View className="w-10 h-10 rounded-full bg-gold/10 items-center justify-center">
              <Icon name="favorite" size={20} color="#B45309" fill />
            </View>
            <View className="flex-1">
              <Text className="font-body text-[13px] text-on-surface font-medium leading-snug">
                You and <Text className="font-body font-semibold">Zayd, 30</Text> matched! Start a conversation now.
              </Text>
              <Text className="font-body text-[11px] text-outline mt-1">Yesterday</Text>
            </View>
          </Pressable>

          <View className="p-4 flex-row gap-3 border-b border-border-subtle">
            <View className="w-10 h-10 rounded-full bg-surface-tint/10 items-center justify-center">
              <Icon name="verified" size={20} color="#2b6954" />
            </View>
            <View className="flex-1">
              <Text className="font-body text-[13px] text-on-surface font-medium leading-snug">
                CNIC Family Verification badge renewed successfully for Ayesha.
              </Text>
              <Text className="font-body text-[11px] text-outline mt-1">2 days ago</Text>
            </View>
          </View>
        </ScrollView>

        <View
          className="p-4 border-t border-border-subtle bg-surface-container-low items-center"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Text className="font-body text-xs text-outline">Rishta Matrimonial Notifications</Text>
        </View>
      </View>
    </View>
  );
};
