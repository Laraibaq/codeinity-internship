import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { InboxView } from "../../src/components/social/InboxView";
import { useSocial } from "../../src/context/SocialContext";

export default function InboxTab() {
  const router = useRouter();
  const { user, conversations, handleOpenChat } = useSocial();

  return (
    <View className="flex-1 bg-background pb-20">
      <InboxView
        user={user}
        conversations={conversations}
        onSelectConversation={(convId) => {
          const conv = conversations.find((c) => c.id === convId);
          if (!conv) return;
          handleOpenChat(conv.profile.id);
          router.push(`/chat/${conv.profile.id}`);
        }}
      />
    </View>
  );
}
