import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Icon } from "../common/Icon";
import { PatternOverlay } from "../common/PatternOverlay";
import type { UserAccount } from "../../types/social";

interface DailyLimitModalProps {
  user: UserAccount;
  onUpgrade: () => void;
  onClose: () => void;
}

export const DailyLimitModal: React.FC<DailyLimitModalProps> = ({
  user,
  onUpgrade,
  onClose,
}) => {
  return (
    <View className="absolute inset-0 bg-on-surface/50 z-50 justify-end sm:justify-center">
      <Pressable className="absolute inset-0" onPress={onClose} accessibilityLabel="Close" />

      <View className="w-full max-w-md bg-surface-white rounded-t-3xl sm:rounded-2xl overflow-hidden border border-border-subtle max-h-[90%] self-center">
        <View className="w-full items-center pt-3 pb-1">
          <View className="w-12 h-1.5 bg-surface-container-high rounded-full" />
        </View>

        <View className="absolute top-0 left-0 w-full h-32 opacity-50 pointer-events-none overflow-hidden">
          <PatternOverlay className="absolute inset-0" />
        </View>

        <ScrollView className="p-6 pt-8" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="w-16 h-16 bg-surface-white border border-border-subtle rounded-full items-center justify-center self-center mb-5 relative">
            <Icon name="favorite" size={28} color="#064e3b" fill />
            <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-surface-white rounded-full items-center justify-center border border-border-subtle">
              <Icon name="lock" size={12} color="#B45309" fill />
            </View>
          </View>

          <View className="items-center mb-6">
            <Text className="font-display text-[22px] font-bold text-on-surface mb-2 text-center">
              You've used today's interests
            </Text>
            <Text className="font-body text-sm text-on-surface-variant max-w-xs text-center leading-normal">
              Basic members get {user.interestsDailyLimit} interests per day to ensure thoughtful
              connections. Upgrade to unlock more profiles.
            </Text>
          </View>

          <View className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden mb-6">
            <View className="flex-row bg-surface-container-low border-b border-border-subtle p-3">
              <View className="flex-1" />
              <Text className="flex-1 font-body text-[11px] font-bold text-on-surface-variant uppercase text-center">
                Basic
              </Text>
              <Text className="flex-1 font-body text-[11px] font-bold text-on-surface-variant uppercase text-center">
                Standard
              </Text>
              <Text className="flex-1 font-body text-[11px] font-bold text-primary-container uppercase text-center">
                Premium
              </Text>
            </View>

            <View className="flex-row border-b border-border-subtle p-3 items-center">
              <View className="flex-1 flex-row items-center gap-1.5">
                <Icon name="favorite" size={16} color="#707974" />
                <Text className="font-body text-[13px] text-on-surface font-medium">Int.</Text>
              </View>
              <Text className="flex-1 font-body text-[13px] text-on-surface-variant text-center">10</Text>
              <Text className="flex-1 font-body text-[13px] text-on-surface-variant text-center">25</Text>
              <Text className="flex-1 font-body text-[13px] text-primary-container font-bold text-center">
                Unlimited
              </Text>
            </View>

            <View className="flex-row p-3 items-center">
              <View className="flex-1 flex-row items-center gap-1.5">
                <Icon name="visibility" size={16} color="#707974" />
                <Text className="font-body text-[13px] text-on-surface font-medium">Vis.</Text>
              </View>
              <Text className="flex-1 font-body text-[13px] text-on-surface-variant text-center">20</Text>
              <Text className="flex-1 font-body text-[13px] text-on-surface-variant text-center">50</Text>
              <Text className="flex-1 font-body text-[13px] text-primary-container font-bold text-center">
                Unlimited
              </Text>
            </View>
          </View>

          <View className="gap-3">
            <Pressable
              onPress={onUpgrade}
              className="w-full h-12 bg-primary-container rounded-lg items-center justify-center active:bg-primary"
            >
              <Text className="text-white font-body text-sm font-semibold">Upgrade Now</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              className="w-full h-11 items-center justify-center active:opacity-70"
            >
              <Text className="text-on-surface-variant font-body text-sm font-semibold">Maybe later</Text>
            </Pressable>
          </View>

          <Text className="text-center font-body text-[11px] text-on-surface-variant/80 mt-5">
            Quotas reset at midnight (Pakistan time).
          </Text>
        </ScrollView>
      </View>
    </View>
  );
};
