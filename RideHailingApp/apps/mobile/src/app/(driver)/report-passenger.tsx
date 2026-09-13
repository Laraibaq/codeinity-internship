import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { useSubmitSupportTicket } from "@/hooks/use-driver-support";

const REASONS = [
  { value: "unsafe_behavior", label: "Unsafe or threatening behavior" },
  { value: "harassment", label: "Harassment" },
  { value: "property_damage", label: "Property damage" },
  { value: "no_show", label: "No-show at pickup" },
  { value: "other", label: "Other" },
] as const;

export default function ReportPassengerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const submitTicket = useSubmitSupportTicket();

  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selected) return;
    const reasonObj = REASONS.find((r) => r.value === selected);
    submitTicket.mutate(
      {
        category: "safety",
        subject: `Passenger Report: ${reasonObj?.label ?? "Safety Concern"}`,
        description: notes.trim() || reasonObj?.label || "Safety incident reported by driver.",
        rideId: rideId ? String(rideId) : undefined,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || "Failed to submit report. Please try again.";
          Alert.alert("Submission Failed", msg);
        },
      },
    );
  };

  if (submitted) {
    return (
      <View className="flex-1 items-center justify-center gap-stack-md bg-background px-container-margin">
        <MaterialIcons name="check-circle" size={56} color={themeColors.primary} />
        <Text className="text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          Report submitted
        </Text>
        <Text className="text-center font-body-md text-body-md text-on-surface-variant">
          Our safety team will review this and follow up if needed.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-stack-sm rounded-full bg-primary px-8 py-3 active:scale-95"
        >
          <Text className="font-body-md text-body-md font-semibold text-on-primary">Done</Text>
        </Pressable>
      </View>
    );
  }

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
            Report a Passenger
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-4xl gap-stack-md px-container-margin py-stack-md pb-32"
      >
        {rideId ? (
          <View className="rounded-xl border border-primary/30 bg-primaryFixed/20 p-stack-md">
            <Text className="font-label-sm text-xs font-semibold text-primary">
              Reporting for Trip #{rideId.slice(0, 8)}
            </Text>
          </View>
        ) : null}

        <Text className="font-body-md text-body-md text-on-surface-variant">
          Let us know what happened. Your report is confidential.
        </Text>

        <View className="gap-stack-sm">
          {REASONS.map((reason) => {
            const isSelected = selected === reason.value;
            return (
              <Pressable
                key={reason.value}
                onPress={() => setSelected(reason.value)}
                className="flex-row items-center justify-between rounded-xl border p-4"
                style={{
                  borderColor: isSelected ? themeColors.primary : themeColors.outlineVariant,
                  backgroundColor: isSelected
                    ? themeColors.surfaceContainerLow
                    : themeColors.surfaceContainerLowest,
                }}
              >
                <Text className="font-body-md text-body-md font-semibold text-on-surface">
                  {reason.label}
                </Text>
                {isSelected ? (
                  <MaterialIcons name="check-circle" size={22} color={themeColors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View className="gap-base">
          <Text className="font-label-sm text-label-sm text-on-surface-variant">
            Additional details (optional)
          </Text>
          <TextInput
            className="min-h-[100px] rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4 font-body-md text-body-md text-on-surface"
            value={notes}
            onChangeText={setNotes}
            placeholder="Describe what happened..."
            placeholderTextColor={themeColors.outline}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View className="px-container-margin pb-stack-md pt-stack-sm">
        <Pressable
          disabled={!selected || submitTicket.isPending}
          onPress={handleSubmit}
          className="h-14 w-full items-center justify-center rounded-xl bg-primary shadow-sm active:scale-[0.98]"
          style={selected && !submitTicket.isPending ? undefined : { opacity: 0.5 }}
        >
          {submitTicket.isPending ? (
            <ActivityIndicator size="small" color={themeColors.onPrimary} />
          ) : (
            <Text className="font-label-sm text-label-sm text-on-primary">Submit Report</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
