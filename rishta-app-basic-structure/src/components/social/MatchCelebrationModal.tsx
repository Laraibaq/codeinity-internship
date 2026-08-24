import React from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { Icon } from "../common/Icon";
import { PatternOverlay } from "../common/PatternOverlay";
import type { Profile, UserAccount } from "../../types/social";

interface MatchCelebrationModalProps {
  user: UserAccount;
  matchedProfile: Profile;
  onSaySalaam: (profileId: string) => void;
  onKeepBrowsing: () => void;
}

export const MatchCelebrationModal: React.FC<MatchCelebrationModalProps> = ({
  user,
  matchedProfile,
  onSaySalaam,
  onKeepBrowsing,
}) => {
  return (
    <View className="absolute inset-0 z-50 items-center justify-center p-4 bg-on-surface/60">
      <View className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <Text
            key={i}
            className="absolute text-base opacity-70"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 8) % 40}%`,
              color: i % 3 === 0 ? "#B45309" : "#064E3B",
            }}
          >
            {i % 2 === 0 ? "✦" : "🌙"}
          </Text>
        ))}
      </View>

      <View className="w-full max-w-md bg-background rounded-2xl p-8 relative border border-border-subtle items-center overflow-hidden">
        <PatternOverlay className="absolute inset-0" opacity={0.5} />

        <View className="relative flex-row items-center justify-center mb-8 w-full max-w-[280px]">
          <Image
            source={{ uri: user.avatar }}
            className="w-28 h-28 rounded-full border-4 border-surface-white -mr-3 z-10"
            contentFit="cover"
            accessibilityLabel={user.managingFor}
          />
          <Image
            source={{ uri: matchedProfile.avatar }}
            className="w-28 h-28 rounded-full border-4 border-surface-white ml-[-12px] z-0"
            contentFit="cover"
            accessibilityLabel={matchedProfile.name}
          />
          <View className="absolute inset-0 items-center justify-center z-20">
            <View className="w-12 h-12 bg-primary-container rounded-full items-center justify-center border-4 border-surface-white">
              <Icon name="favorite" size={24} color="#ffffff" fill />
            </View>
          </View>
        </View>

        <View className="mb-8 px-2 items-center">
          <Text className="font-display text-[32px] font-bold text-primary mb-3 text-center">
            It's a match!
          </Text>
          <Text className="font-body text-[15px] text-on-surface-variant max-w-[270px] text-center leading-relaxed">
            You and{" "}
            <Text className="font-body font-semibold text-primary">{matchedProfile.name}</Text> have liked each
            other. You can now start a conversation.
          </Text>
        </View>

        <View className="w-full gap-3">
          <Pressable
            onPress={() => onSaySalaam(matchedProfile.id)}
            className="w-full h-[54px] bg-primary-container rounded-full flex-row items-center justify-center gap-2 active:bg-primary"
          >
            <Icon name="chat" size={20} color="#ffffff" />
            <Text className="text-white font-body text-sm font-semibold">Say salaam</Text>
          </Pressable>

          <Pressable
            onPress={onKeepBrowsing}
            className="w-full h-[50px] rounded-full items-center justify-center active:bg-surface-container-low"
          >
            <Text className="text-primary-container font-body text-sm font-semibold">Keep browsing</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
