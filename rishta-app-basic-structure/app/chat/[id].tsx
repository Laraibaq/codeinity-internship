import React from "react";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChatView } from "../../src/components/social/ChatView";
import { useSocial } from "../../src/context/SocialContext";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { conversations, user, handleSendMessage, handleOpenChat } = useSocial();

  const conversation =
    conversations.find((c) => c.profile.id === id) ||
    conversations.find((c) => c.id === id);

  if (!conversation) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6 gap-4">
        <Text className="font-display text-xl text-primary text-center">
          Conversation not found
        </Text>
        <Pressable
          onPress={() => {
            if (id) handleOpenChat(id);
            router.back();
          }}
          className="bg-primary px-5 py-3 rounded-xl"
        >
          <Text className="text-white font-body font-semibold">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ChatView
      conversation={conversation}
      user={user}
      onBack={() => router.back()}
      onSendMessage={handleSendMessage}
    />
  );
}
