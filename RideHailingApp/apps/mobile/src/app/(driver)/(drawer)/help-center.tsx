import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import {
  useDriverSupportTickets,
  useSubmitSupportTicket,
  useSupportFaqs,
  type CreateSupportTicketPayload,
} from "@/hooks/use-driver-support";

const SUPPORT_EMAIL = "support@ridehailingapp.example";

const FALLBACK_FAQS = [
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

const CATEGORIES: { label: string; value: CreateSupportTicketPayload["category"] }[] = [
  { label: "Ride Issue", value: "ride" },
  { label: "Account", value: "account" },
  { label: "Vehicle & Docs", value: "vehicle_document" },
  { label: "Technical", value: "technical" },
  { label: "Safety", value: "safety" },
  { label: "Other", value: "other" },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen((prev) => !prev)}
      className="gap-2 rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm active:scale-[0.99]"
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
        <Text className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
          {answer}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function HelpCenterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();

  const { data: remoteFaqs, isRefetching: isFaqRefetching, refetch: refetchFaqs } = useSupportFaqs();
  const {
    data: tickets,
    isRefetching: isTicketsRefetching,
    refetch: refetchTickets,
  } = useDriverSupportTickets();
  const submitTicket = useSubmitSupportTicket();

  const [showForm, setShowForm] = useState(!!rideId);
  const [category, setCategory] = useState<CreateSupportTicketPayload["category"]>(
    rideId ? "ride" : "ride",
  );
  const [subject, setSubject] = useState(rideId ? `Trip Issue (#${rideId.slice(0, 8)})` : "");
  const [description, setDescription] = useState("");
  const [successBanner, setSuccessBanner] = useState(false);

  const faqs = remoteFaqs && remoteFaqs.length > 0 ? remoteFaqs : FALLBACK_FAQS;

  const handleEmailSupport = () => {
    Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Driver support request")}`,
    );
  };

  const handleSubmitTicket = () => {
    if (!subject.trim()) {
      Alert.alert("Required", "Please enter a subject for your ticket.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Required", "Please describe your issue.");
      return;
    }

    submitTicket.mutate(
      {
        category,
        subject: subject.trim(),
        description: description.trim(),
        rideId: rideId ? String(rideId) : undefined,
      },
      {
        onSuccess: () => {
          setSuccessBanner(true);
          setShowForm(false);
          setSubject("");
          setDescription("");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || "Failed to submit ticket. Please try again.";
          Alert.alert("Submission Error", msg);
        },
      },
    );
  };

  const handleRefresh = () => {
    refetchFaqs();
    refetchTickets();
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
        refreshControl={
          <RefreshControl
            refreshing={isFaqRefetching || isTicketsRefetching}
            onRefresh={handleRefresh}
            tintColor={themeColors.primary}
          />
        }
      >
        {rideId ? (
          <View className="flex-row items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-stack-md">
            <View className="flex-1">
              <Text className="font-label-sm text-label-sm font-bold text-primary">
                Help for Trip #{rideId.slice(0, 8)}
              </Text>
              <Text className="font-body-md text-body-md text-on-surface-variant">
                Need to report an issue or dispute a fare for this trip?
              </Text>
            </View>
            {!showForm ? (
              <Pressable
                onPress={() => setShowForm(true)}
                className="rounded-lg bg-primary px-3.5 py-2 active:scale-95"
              >
                <Text className="font-label-sm text-xs font-semibold text-on-primary">Open Form</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {successBanner ? (
          <View className="flex-row items-center gap-3 rounded-xl border border-primary/40 bg-primaryFixed/30 p-stack-md">
            <MaterialIcons name="check-circle" size={24} color={themeColors.primary} />
            <View className="flex-1">
              <Text className="font-body-md text-body-md font-semibold text-primary">
                Ticket submitted successfully!
              </Text>
              <Text className="font-label-sm text-label-sm text-on-surface-variant">
                Our support team has received your ticket and will follow up shortly.
              </Text>
            </View>
            <Pressable onPress={() => setSuccessBanner(false)} hitSlop={8}>
              <MaterialIcons name="close" size={20} color={themeColors.onSurfaceVariant} />
            </Pressable>
          </View>
        ) : null}

        {/* Ticket Submission Card */}
        <View className="rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm">
          <Pressable
            onPress={() => setShowForm((prev) => !prev)}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container">
                <MaterialIcons name="support-agent" size={22} color={themeColors.primary} />
              </View>
              <View>
                <Text className="font-body-md text-body-md font-semibold text-on-surface">
                  Submit Support Ticket
                </Text>
                <Text className="font-label-sm text-label-sm text-on-surface-variant">
                  {showForm ? "Hide ticket form" : "Report an issue or dispute to support"}
                </Text>
              </View>
            </View>
            <MaterialIcons
              name={showForm ? "expand-less" : "expand-more"}
              size={22}
              color={themeColors.onSurfaceVariant}
            />
          </Pressable>

          {showForm ? (
            <View className="mt-4 gap-3 border-t border-outline-variant/20 pt-4">
              <Text className="font-label-sm text-label-sm font-semibold text-on-surface">
                Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.value;
                  return (
                    <Pressable
                      key={cat.value}
                      onPress={() => setCategory(cat.value)}
                      className="mr-2 rounded-full border px-3 py-1.5"
                      style={{
                        borderColor: isSelected ? themeColors.primary : themeColors.outlineVariant,
                        backgroundColor: isSelected
                          ? themeColors.primaryFixed
                          : themeColors.surfaceContainerLowest,
                      }}
                    >
                      <Text
                        className="font-label-sm text-xs font-semibold"
                        style={{
                          color: isSelected ? themeColors.primary : themeColors.onSurfaceVariant,
                        }}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text className="mt-1 font-label-sm text-label-sm font-semibold text-on-surface">
                Subject
              </Text>
              <TextInput
                className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 font-body-md text-body-md text-on-surface"
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief summary of the issue..."
                placeholderTextColor={themeColors.outline}
              />

              <Text className="mt-1 font-label-sm text-label-sm font-semibold text-on-surface">
                Description
              </Text>
              <TextInput
                className="min-h-[90px] rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 font-body-md text-body-md text-on-surface"
                value={description}
                onChangeText={setDescription}
                placeholder="Explain what happened in detail..."
                placeholderTextColor={themeColors.outline}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <Pressable
                onPress={handleSubmitTicket}
                disabled={submitTicket.isPending}
                className="mt-2 h-12 items-center justify-center rounded-xl bg-primary shadow-sm active:scale-[0.98]"
              >
                {submitTicket.isPending ? (
                  <ActivityIndicator size="small" color={themeColors.onPrimary} />
                ) : (
                  <Text className="font-label-sm text-label-sm font-semibold text-on-primary">
                    Send Ticket
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Existing tickets list */}
        {tickets && tickets.length > 0 ? (
          <View className="gap-stack-sm">
            <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              My Support Tickets
            </Text>
            {tickets.map((t) => (
              <View
                key={t.id}
                className="gap-2 rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 font-body-md text-body-md font-semibold text-on-surface">
                    {t.subject}
                  </Text>
                  <View
                    className="rounded-full px-2.5 py-0.5"
                    style={{
                      backgroundColor:
                        t.status === "resolved"
                          ? `${themeColors.primaryFixed}66`
                          : `${themeColors.secondaryFixed}66`,
                    }}
                  >
                    <Text
                      className="font-label-sm text-[10px] font-bold uppercase"
                      style={{
                        color:
                          t.status === "resolved" ? themeColors.primary : themeColors.secondary,
                      }}
                    >
                      {t.status}
                    </Text>
                  </View>
                </View>
                <Text className="font-body-md text-xs text-on-surface-variant" numberOfLines={2}>
                  {t.description}
                </Text>
                <View className="flex-row items-center justify-between pt-1">
                  <Text className="font-label-sm text-[11px] text-on-surface-variant">
                    Category: {t.category}
                  </Text>
                  <Text className="font-label-sm text-[11px] text-on-surface-variant">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Email Support Contact Card */}
        <Pressable
          onPress={handleEmailSupport}
          className="flex-row items-center gap-4 rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm active:scale-[0.98]"
        >
          <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-container">
            <MaterialIcons name="email" size={22} color={themeColors.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-body-md text-body-md font-semibold text-on-surface">
              Email Support Directly
            </Text>
            <Text className="font-label-sm text-label-sm text-on-surface-variant">
              {SUPPORT_EMAIL}
            </Text>
          </View>
          <MaterialIcons name="open-in-new" size={20} color={themeColors.outline} />
        </Pressable>

        {/* FAQs */}
        <View className="gap-stack-sm">
          <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Frequently Asked Questions
          </Text>
          {faqs.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
