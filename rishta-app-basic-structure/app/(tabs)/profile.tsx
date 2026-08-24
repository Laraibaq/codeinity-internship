import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { ProfileView } from "../../src/components/social/ProfileView";
import { useSocial } from "../../src/context/SocialContext";

export default function ProfileTab() {
  const router = useRouter();
  const { user, handleUpdateRole, setShowDailyLimitModal } = useSocial();

  return (
    <View className="flex-1 bg-background pb-20">
      <ProfileView
        user={user}
        onUpdateRole={handleUpdateRole}
        onOpenUpgradeModal={() => setShowDailyLimitModal(true)}
        onOpenSettings={() => router.push("/settings")}
        onOpenOwnProfile={() => router.push("/own-profile")}
        onOpenDiscover={() => router.push("/discover")}
      />
    </View>
  );
}
