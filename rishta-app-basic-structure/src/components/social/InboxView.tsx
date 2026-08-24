import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Platform } from "react-native";
import { Image } from "expo-image";
import { Icon } from "../common/Icon";
import { PatternOverlay } from "../common/PatternOverlay";
import type { Conversation, UserAccount } from "../../types/social";

interface InboxViewProps {
  user: UserAccount;
  conversations: Conversation[];
  onSelectConversation: (convId: string) => void;
}

const inputStyle = Platform.OS === "web"
  ? ({ outlineStyle: "none" } as unknown as object)
  : undefined;

export const InboxView: React.FC<InboxViewProps> = ({
  user,
  conversations,
  onSelectConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View className="flex-1 relative">
      <PatternOverlay className="absolute inset-0" opacity={0.03} />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 96 }}>
        <View className="relative z-10 px-5 pt-4 max-w-4xl mx-auto w-full">
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-1">
              <Text className="font-display text-[28px] font-bold text-primary">Inbox</Text>
              <Text className="font-body text-sm text-on-surface-variant">
                Direct messages with verified family matches
              </Text>
            </View>
            <Image
              source={{ uri: user.avatar }}
              className="w-10 h-10 rounded-full border-2 border-surface-white"
              contentFit="cover"
              accessibilityLabel="User avatar"
            />
          </View>

          <View className="mb-6 bg-surface-white rounded-full px-4 py-2 flex-row items-center gap-3 border border-border-subtle">
            <Icon name="search" size={20} color="#707974" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search conversations..."
              placeholderTextColor="#bfc9c3"
              className="flex-1 font-body text-sm text-on-surface py-1.5"
              style={inputStyle}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Icon name="close" size={18} color="#707974" />
              </Pressable>
            )}
          </View>

          <View className="gap-4">
            {filteredConversations.length === 0 ? (
              <View className="bg-surface-white rounded-xl p-8 items-center border border-border-subtle">
                <Icon name="search_off" size={28} color="#707974" />
                <Text className="font-body text-sm text-on-surface-variant mt-2 text-center">
                  No conversations found matching "{searchQuery}"
                </Text>
              </View>
            ) : (
              filteredConversations.map((conv) => {
                const isUnread = conv.unreadCount > 0;
                return (
                  <Pressable
                    key={conv.id}
                    onPress={() => onSelectConversation(conv.id)}
                    className={`bg-surface-white p-4 rounded-xl border border-border-subtle active:bg-surface-container-low ${
                      isUnread ? "border-l-4 border-l-primary-container" : ""
                    }`}
                  >
                    <View className="flex-row items-center gap-4">
                      <View className="relative">
                        <Image
                          source={{ uri: conv.profile.avatar }}
                          className="w-14 h-14 rounded-full border border-border-subtle"
                          contentFit="cover"
                          accessibilityLabel={conv.profile.name}
                        />
                        {isUnread && (
                          <View className="absolute -bottom-1 -right-1 bg-surface-white rounded-full p-0.5">
                            <View className="w-4 h-4 bg-primary-container rounded-full items-center justify-center">
                              <View className="w-2 h-2 bg-gold rounded-full" />
                            </View>
                          </View>
                        )}
                      </View>

                      <View className="flex-1 min-w-0">
                        <View className="flex-row justify-between items-baseline mb-1">
                          <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                            <Text className="font-display text-lg font-semibold text-primary" numberOfLines={1}>
                              {conv.profile.name}
                            </Text>
                            {conv.profile.verified && (
                              <Icon name="verified" size={14} color="#B45309" fill />
                            )}
                          </View>
                          <Text
                            className={`font-body text-xs ${isUnread ? "text-primary-container font-bold" : "text-outline"}`}
                          >
                            {conv.lastTime}
                          </Text>
                        </View>
                        <Text
                          className={`font-body text-sm ${isUnread ? "text-on-surface font-semibold" : "text-on-surface-variant"}`}
                          numberOfLines={1}
                        >
                          {conv.lastMessage}
                        </Text>
                      </View>

                      {isUnread && (
                        <View className="bg-primary-container w-6 h-6 rounded-full items-center justify-center">
                          <Text className="text-white font-body text-xs font-bold">{conv.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}

            <View className="py-8 items-center">
              <View className="w-16 h-16 bg-surface-container-low rounded-full items-center justify-center mb-4 opacity-60">
                <Icon name="forum" size={28} color="#707974" />
              </View>
              <Text className="font-body text-sm text-on-surface-variant max-w-[220px] text-center">
                Start more conversations from your Matches tab.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
