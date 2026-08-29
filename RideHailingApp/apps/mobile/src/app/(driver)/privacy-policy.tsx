import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// New screen: Settings' "Privacy Policy" row previously had no destination (bare, unwired
// Pressable). Placeholder legal copy for this MVP -- swap for the real policy once legal signs
// off on one (Dependencies.docx has no policy text to source this from).

const SECTIONS = [
  {
    title: "Information We Collect",
    body: "We collect the information you provide when creating a driver account -- name, phone number, email, home address, vehicle details, and identity/verification documents -- along with location data while you're online, used to match you with nearby ride requests.",
  },
  {
    title: "How We Use Your Information",
    body: "Your information is used to verify your identity, connect you with riders, calculate earnings, and maintain the safety and reliability of the platform. We do not sell your personal data to third parties.",
  },
  {
    title: "Location Data",
    body: "Location is only tracked while you're online and available for rides. You can go offline at any time from the Dashboard to stop location sharing.",
  },
  {
    title: "Data Retention",
    body: "Trip history, ratings, and verification documents are retained for as long as your driver account is active, and as required by applicable regulations after account closure.",
  },
  {
    title: "Your Rights",
    body: "You can request a copy of your data or ask us to delete your account by contacting support from the Help Center.",
  },
];

export default function PrivacyPolicyScreen() {
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
            Privacy Policy
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-4xl gap-stack-md px-container-margin py-stack-md pb-32"
      >
        <Text className="font-label-sm text-label-sm text-on-surface-variant">
          Last updated: MVP1 draft
        </Text>
        {SECTIONS.map((section) => (
          <View key={section.title} className="gap-2">
            <Text className="font-body-md text-body-md font-semibold text-on-surface">
              {section.title}
            </Text>
            <Text className="font-body-md text-body-md text-on-surface-variant">
              {section.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
