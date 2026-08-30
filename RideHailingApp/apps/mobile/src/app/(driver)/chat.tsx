import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// New screen: navigate-to-pickup.tsx's chat icon previously had no destination at all (a bare,
// unwired Pressable with a "no in-app messaging screen exists yet" TODO). Built a real one. Per
// explicit request, the call icon that used to sit next to chat on navigate-to-pickup.tsx now
// lives inside this screen's header instead of as a separate button there -- "message the
// passenger" and "call the passenger" are the same category of action, so they share one entry
// point rather than two icons doing similar things side by side.
//
// No messaging backend exists yet (no Socket.IO chat channel, no persistence) -- this is local
// component state only, same "frontend-only, functional in the UI" pattern as the rest of this
// project's un-backed screens. Messages reset if you navigate away and back.
//
// Call: uses `Linking.openURL("tel:...")` to open the device's own phone dialer, the same real,
// no-backend-needed pattern help-center.tsx already uses for "Email Support" -- there's no
// passenger phone number in this app's data model yet (RideRequest has no phone field), so this
// dials a placeholder number rather than guessing one that isn't there.
const PLACEHOLDER_PASSENGER_PHONE = "+15551234567";

type ChatMessage = {
  id: string;
  from: "driver" | "passenger";
  text: string;
  time: string;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: "1", from: "passenger", text: "Hi! I'm waiting outside the coffee shop.", time: "9:41 AM" },
  { id: "2", from: "driver", text: "On my way, be there in a few minutes.", time: "9:42 AM" },
];

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ name?: string }>();
  const name = params.name || "Passenger";
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      {
        id: `${Date.now()}`,
        from: "driver",
        text,
        time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      },
    ]);
    setDraft("");
  };

  const handleCall = () => {
    Linking.openURL(`tel:${PLACEHOLDER_PASSENGER_PHONE}`);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ paddingTop: insets.top }} className="w-full bg-surface shadow-sm">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            {name}
          </Text>
          <Pressable
            onPress={handleCall}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="call" size={24} color={themeColors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-3 px-container-margin py-stack-md"
      >
        {messages.map((message) => {
          const isDriver = message.from === "driver";
          return (
            <View
              key={message.id}
              className={`max-w-[80%] gap-1 rounded-2xl px-4 py-3 ${
                isDriver ? "self-end bg-primary" : "self-start bg-surface-container-low"
              }`}
            >
              <Text
                className="font-body-md text-body-md"
                style={{ color: isDriver ? themeColors.onPrimary : themeColors.onSurface }}
              >
                {message.text}
              </Text>
              <Text
                className="font-label-sm text-[10px]"
                style={{
                  color: isDriver ? themeColors.onPrimary : themeColors.onSurfaceVariant,
                  opacity: 0.7,
                }}
              >
                {message.time}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View
        style={{ paddingBottom: 12 + insets.bottom }}
        className="flex-row items-center gap-2 border-t border-outline-variant/20 bg-surface px-container-margin pt-3"
      >
        <TextInput
          className="min-h-[44px] flex-1 rounded-full border border-outline-variant bg-surface-container-lowest px-4 font-body-md text-body-md text-on-surface"
          value={draft}
          onChangeText={setDraft}
          placeholder="Message passenger..."
          placeholderTextColor={themeColors.outline}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <Pressable
          onPress={handleSend}
          disabled={!draft.trim()}
          className="h-11 w-11 items-center justify-center rounded-full bg-primary active:scale-95"
          style={draft.trim() ? undefined : { opacity: 0.5 }}
        >
          <MaterialIcons name="send" size={20} color={themeColors.onPrimary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
