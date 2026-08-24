import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PatternOverlay } from "../src/components/common/PatternOverlay";
import { Icon } from "../src/components/common/Icon";
import { BRAND_NAME } from "../shared/tokens";

const SECTIONS = [
  {
    href: "/onboarding" as const,
    title: "Onboarding",
    subtitle: "Phone, OTP, profile setup, plans — 15 screens",
    icon: "smartphone",
  },
  {
    href: "/(tabs)/explore" as const,
    title: "Main App",
    subtitle: "Explore, Requests, Matches, Inbox & Profile",
    icon: "favorite",
  },
  {
    href: "/discover" as const,
    title: "Discover & Feed",
    subtitle: "Grid discovery, card feed, own profile editor",
    icon: "person_search",
  },
  {
    href: "/settings" as const,
    title: "Settings & Account",
    subtitle: "Subscription, boost, privacy, safety, preferences",
    icon: "settings",
  },
];

export default function HomeHub() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 relative">
        <PatternOverlay opacity={0.9} />
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-10 pb-16"
        >
          <Text className="font-display text-4xl text-primary tracking-tight">
            {BRAND_NAME}
          </Text>
          <Text className="font-body text-on-surface-variant mt-2 text-base leading-6 max-w-md">
            One app for mobile and web. Choose a section to preview, or open the
            main experience.
          </Text>

          <View className="mt-10 gap-4">
            {SECTIONS.map((section) => (
              <Pressable
                key={section.href}
                onPress={() => router.push(section.href)}
                className="bg-surface-white border border-border-subtle rounded-2xl p-5 flex-row items-center gap-4 active:opacity-90"
              >
                <View className="w-12 h-12 rounded-full bg-primary-container items-center justify-center">
                  <Icon name={section.icon} size={22} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="font-display text-xl text-primary">
                    {section.title}
                  </Text>
                  <Text className="font-body text-sm text-on-surface-variant mt-1">
                    {section.subtitle}
                  </Text>
                </View>
                <Icon name="chevron_right" size={22} color="#707974" />
              </Pressable>
            ))}
          </View>

          <Text className="font-body text-xs text-outline mt-10 text-center">
            Run once: npm start · Press w for web · Scan QR for Expo Go
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
