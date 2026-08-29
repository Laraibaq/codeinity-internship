import { useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// New screen: Settings' "Help Center" row previously had no destination at all (a bare, unwired
// Pressable, same as Privacy Policy / Terms of Service). This gives it a real destination: an FAQ
// list plus a working "Email Support" action that opens the device's mail app via `Linking` --
// the one piece of this screen that needs no backend to actually work.

const SUPPORT_EMAIL = "support@ridehailingapp.example";

const FAQS = [
  {
    question: "How do I get paid?",
    answer:
      "This MVP is cash-only -- riders pay you directly at the end of each trip. Digital payouts and a Withdraw flow are planned for a later release.",
  },
  {
    question: "Why is my Documents status still pending?",
    answer:
      "Document review is manual right now. You'll see the status change on the Documents screen once it's checked -- there's no fixed turnaround time yet.",
  },
  {
    question: "Can I drive a bike or rickshaw?",
    answer:
      "Not yet. Only cars are supported in this MVP; bike and rickshaw support is planned for a future update.",
  },
  {
    question: "How is my rating calculated?",
    answer:
      "Your rating is the average of your last rider reviews, shown on the Ratings & Reviews screen along with the star breakdown.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen((prev) => !prev)}
      className="gap-2 rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm"
    >
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 font-body-md text-body-md font-semibold text-on-surface">
          {question}
        </Text>
        <MaterialIcons
          name={open ? "expand-less" : "expand-more"}
          size={22}
          color={themeColors.onSurfaceVariant}
        />
      </View>
      {open ? (
        <Text className="font-body-md text-body-md text-on-surface-variant">{answer}</Text>
      ) : null}
    </Pressable>
  );
}

export default function HelpCenterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleEmailSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Driver support request")}`);
  };

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
            Help Center
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-4xl gap-stack-md px-container-margin py-stack-md pb-32"
      >
        <Pressable
          onPress={handleEmailSupport}
          className="flex-row items-center gap-4 rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm active:scale-[0.98]"
        >
          <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-container">
            <MaterialIcons name="email" size={22} color={themeColors.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-body-md text-body-md font-semibold text-on-surface">
              Email Support
            </Text>
            <Text className="font-label-sm text-label-sm text-on-surface-variant">
              {SUPPORT_EMAIL}
            </Text>
          </View>
          <MaterialIcons name="open-in-new" size={20} color={themeColors.outline} />
        </Pressable>

        <View className="gap-stack-sm">
          <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Frequently Asked Questions
          </Text>
          {FAQS.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
