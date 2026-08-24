import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { MatchesView } from "../../src/components/social/MatchesView";
import { useSocial } from "../../src/context/SocialContext";

export default function MatchesTab() {
  const router = useRouter();
  const { matches, handleOpenChat } = useSocial();

  return (
    <View className="flex-1 bg-background pb-20">
      <MatchesView
        matches={matches}
        onOpenChat={(profileId) => {
          handleOpenChat(profileId);
          router.push(`/chat/${profileId}`);
        }}
      />
    </View>
  );
}
