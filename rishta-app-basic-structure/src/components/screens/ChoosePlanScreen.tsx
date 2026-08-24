import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import type { UserFormData } from "../../types";

interface Props {
  formData: UserFormData;
  updateFormData: (fields: Partial<UserFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface PlanFeature {
  icon: string;
  fill: boolean;
  color: string;
  title: string;
  subtitle?: string;
  muted?: boolean;
}

interface Plan {
  id: UserFormData["selectedPlan"];
  name: string;
  tagline: string;
  features: PlanFeature[];
  ctaLabel: string;
  recommended?: boolean;
  premium?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Begin your search.",
    ctaLabel: "Select Free",
    features: [
      {
        icon: "check_circle",
        fill: true,
        color: "#bfc9c3",
        title: "5 Profiles / Day",
        subtitle: "Careful matching",
      },
      {
        icon: "check_circle",
        fill: true,
        color: "#bfc9c3",
        title: "2 Interests / Day",
      },
      {
        icon: "add",
        fill: false,
        color: "#bfc9c3",
        title: "Boost (Add-on)",
        muted: true,
      },
    ],
  },
  {
    id: "basic",
    name: "Basic",
    tagline: "Widen your horizon.",
    ctaLabel: "Choose Basic",
    features: [
      {
        icon: "check_circle",
        fill: true,
        color: "#003527",
        title: "20 Profiles / Day",
      },
      {
        icon: "check_circle",
        fill: true,
        color: "#003527",
        title: "10 Interests / Day",
      },
      {
        icon: "add",
        fill: false,
        color: "#bfc9c3",
        title: "Boost (Add-on)",
        muted: true,
      },
    ],
  },
  {
    id: "standard",
    name: "Standard",
    tagline: "Serious commitment.",
    ctaLabel: "Choose Standard",
    recommended: true,
    features: [
      {
        icon: "check_circle",
        fill: true,
        color: "#B45309",
        title: "50 Profiles / Day",
      },
      {
        icon: "check_circle",
        fill: true,
        color: "#B45309",
        title: "25 Interests / Day",
      },
      { icon: "bolt", fill: true, color: "#B45309", title: "1 Boost / Month" },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Unlimited possibilities.",
    ctaLabel: "Choose Premium",
    premium: true,
    features: [
      {
        icon: "auto_awesome",
        fill: true,
        color: "#B45309",
        title: "Unlimited Profiles",
      },
      {
        icon: "auto_awesome",
        fill: true,
        color: "#B45309",
        title: "Unlimited Interests",
      },
      { icon: "bolt", fill: true, color: "#B45309", title: "1 Boost / Week" },
    ],
  },
];

export const ChoosePlanScreen: React.FC<Props> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
}) => {
  const selectedPlan = formData.selectedPlan || "standard";

  const selectPlan = (plan: UserFormData["selectedPlan"]) => {
    updateFormData({ selectedPlan: plan });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* TopAppBar */}
      <View className="w-full bg-background shadow-sm">
        <View className="flex-row items-center justify-between px-5 h-12 w-full max-w-screen-md mx-auto">
          <Pressable
            onPress={onBack}
            accessibilityLabel="Back"
            className="h-10 w-10 items-center justify-center active:scale-95"
          >
            <Icon name="arrow_back" size={24} color="#404944" />
          </Pressable>
          <Text className="font-display text-xl font-bold text-primary">
            Matrimonial Grace
          </Text>
          <View className="h-10 w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-screen-md mx-auto px-5 pt-6 flex-1">
          {/* Onboarding Progress */}
          <View className="w-full flex-row gap-2 mb-8">
            <View className="h-1 flex-1 bg-primary-container rounded-full" />
            <View className="h-1 flex-1 bg-primary-container rounded-full" />
            <View className="h-1 flex-1 bg-primary-container rounded-full" />
            <View className="h-1 flex-1 bg-primary-container rounded-full" />
          </View>

          <View className="items-center mb-10">
            <Text className="font-display text-2xl font-bold text-primary mb-2 text-center">
              Choose how you search
            </Text>
            <Text className="font-body text-sm text-on-surface-variant text-center">
              Select the plan that aligns with your journey.
            </Text>
          </View>

          {/* Plans - vertical stack for mobile */}
          <View className="gap-4">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const isPremium = plan.premium;
              const isRecommended = plan.recommended;

              const cardClass = isPremium
                ? "bg-primary shadow-lg"
                : isRecommended
                ? "bg-surface-white shadow-lg border-[1.5px] border-gold"
                : `bg-surface-white shadow-sm border ${
                    isSelected
                      ? "border-primary"
                      : "border-border-subtle"
                  }`;

              const nameColor = isPremium ? "text-white" : "text-primary";
              const taglineColor = isPremium
                ? "text-primary-on-container"
                : "text-on-surface-variant";
              const featureTitleColor = isPremium
                ? "text-white"
                : "text-on-surface";

              return (
                <Pressable
                  key={plan.id}
                  onPress={() => selectPlan(plan.id)}
                  className={`w-full rounded-xl p-6 relative overflow-hidden ${cardClass}`}
                >
                  {isRecommended && (
                    <View className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold px-3 py-1 rounded-full flex-row items-center gap-1 shadow-sm">
                      <Icon name="star" size={14} color="#ffffff" fill />
                      <Text className="text-white font-body text-[10px] font-semibold">
                        Recommended
                      </Text>
                    </View>
                  )}
                  <Text
                    className={`font-display text-xl font-semibold mb-1 ${nameColor} ${
                      isRecommended ? "mt-2" : ""
                    }`}
                  >
                    {plan.name}
                  </Text>
                  <Text className={`font-body text-sm mb-6 ${taglineColor}`}>
                    {plan.tagline}
                  </Text>
                  <View className="gap-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <View key={i} className="flex-row items-start gap-3">
                        <View className="mt-0.5">
                          <Icon
                            name={feature.icon}
                            size={20}
                            color={feature.color}
                            fill={feature.fill}
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`font-body text-xs font-semibold ${
                              feature.muted
                                ? "text-on-surface-variant"
                                : featureTitleColor
                            }`}
                          >
                            {feature.title}
                          </Text>
                          {feature.subtitle && (
                            <Text className="font-body text-xs text-on-surface-variant">
                              {feature.subtitle}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>

                  <View
                    className={`w-full h-14 rounded-lg items-center justify-center ${
                      isPremium
                        ? "bg-surface-white active:bg-surface-container"
                        : isRecommended
                        ? "bg-primary-container active:bg-primary"
                        : isSelected
                        ? "bg-primary"
                        : "border-[1.5px] border-primary"
                    }`}
                  >
                    <Text
                      className={`font-body text-xs font-semibold ${
                        isPremium
                          ? "text-primary"
                          : isRecommended || isSelected
                          ? "text-white"
                          : "text-primary"
                      }`}
                    >
                      {plan.ctaLabel}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions Anchored */}
      <View className="w-full bg-background border-t border-border-subtle p-5">
        <View className="max-w-screen-md mx-auto gap-3 w-full">
          <Pressable
            onPress={onNext}
            className="w-full h-14 rounded-lg bg-primary-container active:bg-primary items-center justify-center active:scale-95 shadow-md"
          >
            <Text className="text-white font-body text-xs font-semibold">
              Choose {selectedPlan.toUpperCase()} Plan
            </Text>
          </Pressable>
          <Pressable
            onPress={onNext}
            className="w-full h-12 rounded-lg items-center justify-center active:bg-surface-container-high"
          >
            <Text className="text-on-surface-variant font-body text-xs font-semibold">
              Continue with Free
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};
