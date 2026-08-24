import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { RequestsView } from "../../src/components/social/RequestsView";
import { useSocial } from "../../src/context/SocialContext";

export default function RequestsTab() {
  const router = useRouter();
  const {
    requests,
    handleAcceptRequest,
    handleDeclineRequest,
    handleWithdrawRequest,
  } = useSocial();

  return (
    <View className="flex-1 bg-background pb-20">
      <RequestsView
        requests={requests}
        onAcceptRequest={handleAcceptRequest}
        onDeclineRequest={handleDeclineRequest}
        onWithdrawRequest={handleWithdrawRequest}
        onNavigateToExplore={() => router.push("/(tabs)/explore")}
      />
    </View>
  );
}
