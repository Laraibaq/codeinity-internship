import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import { PatternOverlay } from "../common/PatternOverlay";
import type { Conversation, UserAccount } from "../../types/social";

interface ChatViewProps {
  conversation: Conversation;
  user: UserAccount;
  onBack: () => void;
  onSendMessage: (conversationId: string, text: string) => void;
}

const inputStyle = Platform.OS === "web"
  ? ({ outlineStyle: "none" } as unknown as object)
  : undefined;

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  user,
  onBack,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [conversation.messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(conversation.id, inputText.trim());
    setInputText("");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <View className="bg-surface-white border-b border-border-subtle shadow-sm">
        <View className="flex-row justify-between items-center w-full px-5 py-2 h-[68px]">
          <Pressable
            onPress={onBack}
            accessibilityLabel="Go back"
            className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-container-low -ml-2"
          >
            <Icon name="arrow_back" size={24} color="#404944" />
          </Pressable>

          <View className="flex-row items-center gap-3 flex-1 px-2">
            <Image
              source={{ uri: conversation.profile.avatar }}
              className="w-10 h-10 rounded-full border border-border-subtle"
              contentFit="cover"
              accessibilityLabel={conversation.profile.name}
            />
            <View>
              <View className="flex-row items-center gap-1.5">
                <Text className="font-display text-xl font-semibold text-on-surface">
                  {conversation.profile.name}
                </Text>
                {conversation.profile.verified && (
                  <Icon name="verified" size={14} color="#B45309" fill />
                )}
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-1.5 h-1.5 bg-primary-container rounded-full" />
                <Text className="text-[11px] text-surface-tint font-medium">Active now</Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityLabel="More options"
            className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-container-low -mr-2"
          >
            <Icon name="more_horiz" size={24} color="#404944" />
          </Pressable>
        </View>

        <View className="bg-surface-container-low px-5 py-2 flex-row items-center gap-2 border-b border-border-subtle">
          <Icon name="family_restroom" size={16} color="#064e3b" />
          <Text className="font-body text-xs font-semibold text-on-surface-variant flex-1">
            You are chatting as manager of {user.managingFor}'s profile.
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View className="flex-1 relative">
          <PatternOverlay className="absolute inset-0" opacity={0.5} />

          <ScrollView
            ref={scrollRef}
            className="flex-1 px-5 py-6"
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="items-center mb-4 mt-2">
              <View className="bg-surface-container-highest rounded-full px-4 py-1.5 border border-border-subtle">
                <Text className="font-body text-xs font-semibold text-on-surface-variant">
                  You matched on {conversation.matchedDate} — say salaam!
                </Text>
              </View>
            </View>

            <View className="gap-5">
              {conversation.messages.map((msg) => {
                const isMe = msg.senderId === "user";
                return (
                  <View key={msg.id} className={`gap-1 ${isMe ? "items-end" : "items-start"}`}>
                    <View
                      className={`flex-row items-end gap-2 max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {!isMe && (
                        <Image
                          source={{ uri: conversation.profile.avatar }}
                          className="w-8 h-8 rounded-full border border-border-subtle mb-1"
                          contentFit="cover"
                          accessibilityLabel={conversation.profile.name}
                        />
                      )}

                      <View
                        className={`rounded-2xl px-4 py-3 ${
                          isMe
                            ? "bg-primary-container rounded-tr-sm"
                            : "bg-surface-white rounded-tl-sm border border-border-subtle"
                        }`}
                      >
                        <Text
                          className={`font-body text-sm leading-relaxed ${isMe ? "text-white" : "text-on-surface"}`}
                        >
                          {msg.text}
                        </Text>
                      </View>
                    </View>

                    <Text
                      className={`font-body text-[10px] text-on-surface-variant ${isMe ? "pr-1" : "pl-10"}`}
                    >
                      {msg.timestamp}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View className="bg-surface-white border-t border-border-subtle px-5 py-3">
            <View className="flex-row items-center gap-3">
              <Pressable
                accessibilityLabel="Add attachment"
                className="w-10 h-10 rounded-full items-center justify-center active:bg-surface-container-low"
              >
                <Icon name="add" size={24} color="#404944" />
              </Pressable>

              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                placeholderTextColor="#404944"
                className="flex-1 bg-surface-container-low border border-border-subtle rounded-full px-4 py-3 font-body text-sm text-on-surface"
                style={inputStyle}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />

              <Pressable
                onPress={handleSend}
                disabled={!inputText.trim()}
                accessibilityLabel="Send message"
                className={`w-12 h-12 bg-primary-container rounded-full items-center justify-center active:bg-primary ${
                  !inputText.trim() ? "opacity-50" : ""
                }`}
              >
                <Icon name="send" size={22} color="#ffffff" fill />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
