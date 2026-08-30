import { ScrollView, Text, View, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// New screen: safety-center.tsx's "Safety Tips" row previously had no destination (a bare,
// unwired Pressable). Static reference content -- no backend needed, same pattern as
// privacy-policy.tsx/terms-of-service.tsx.

const TIPS = [
  {
    icon: "nightlight" as const,
    title: "Late-night driving",
    body: "Stick to well-lit, busier routes when possible. Trust your instincts -- if a pickup location feels wrong, it's OK to cancel.",
  },
  {
    icon: "verified-user" as const,
    title: "Verify before you pick up",
    body: "Confirm the passenger's name matches the app before starting the trip. Ask them to confirm their destination out loud.",
  },
  {
    icon: "visibility" as const,
    title: "Stay aware",
    body: "Keep your phone mounted and hands-free. Avoid distractions and keep valuables out of sight.",
  },
  {
    icon: "record-voice-over" as const,
    title: "Speak up early",
    body: "If a passenger makes you uncomfortable, end the trip at the next safe location rather than waiting it out.",
  },
  {
    icon: "share-location" as const,
    title: "Share your trip",
    body: "Turn on Share Trip Status for late-night or unfamiliar routes so a contact can follow along.",
  },
];

export default function SafetyTipsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="w-full bg-surface shadow-sm">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Safety Tips
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-4xl gap-stack-md px-container-margin py-stack-md pb-32"
      >
        {TIPS.map((tip) => (
          <View
            key={tip.title}
            className="flex-row gap-4 rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm"
          >
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-container">
              <MaterialIcons name={tip.icon} size={22} color={themeColors.onPrimaryContainer} />
            </View>
            <View className="flex-1">
              <Text className="mb-1 font-body-md text-body-md font-semibold text-on-surface">
                {tip.title}
              </Text>
              <Text className="font-body-md text-body-md text-on-surface-variant">{tip.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
