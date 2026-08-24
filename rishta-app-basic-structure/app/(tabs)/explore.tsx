import React from "react";
import { View } from "react-native";
import { ExploreView } from "../../src/components/social/ExploreView";
import { useSocial } from "../../src/context/SocialContext";

export default function ExploreTab() {
  const {
    profiles,
    handleSendInterest,
    user,
  } = useSocial();

  return (
    <View className="flex-1 bg-background pb-20">
      <ExploreView
        profiles={profiles}
        onSendInterest={handleSendInterest}
        interestsUsedToday={user.interestsUsedToday}
        interestsDailyLimit={user.interestsDailyLimit}
      />
    </View>
  );
}
