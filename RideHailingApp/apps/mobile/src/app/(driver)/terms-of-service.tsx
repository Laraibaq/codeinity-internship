import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// New screen: Settings' "Terms of Service" row previously had no destination (bare, unwired
// Pressable). Placeholder legal copy for this MVP -- swap for the real terms once legal signs off
// on one (Dependencies.docx has no terms text to source this from).

const SECTIONS = [
  {
    title: "Eligibility",
    body: "You must be a licensed driver, at least 21 years old, and pass identity and background verification to drive on this platform.",
  },
  {
    title: "Vehicle Requirements",
    body: "This MVP only supports cars in good working condition with valid registration and insurance. Bike and rickshaw support is planned for a future release.",
  },
  {
    title: "Payments",
    body: "This MVP is cash-only: riders pay you directly at the end of each trip. Digital payouts through the app are not yet available.",
  },
  {
    title: "Conduct",
    body: "Drivers are expected to follow all traffic laws, treat riders respectfully, and maintain a clean, safe vehicle. Violations may result in account suspension.",
  },
  {
    title: "Account Termination",
    body: "Either you or the platform may terminate your driver account at any time. Outstanding cash earnings are unaffected by termination since they're settled directly with riders.",
  },
];

export default function TermsOfServiceScreen() {
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
            Terms of Service
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
