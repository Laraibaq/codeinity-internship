import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import type { ScreenType, SubscriptionPlan, ToastType } from "../../types/settings";

interface SubscriptionScreenProps {
  onNavigate: (screen: ScreenType) => void;
  plans: SubscriptionPlan[];
  currentPlanId: string;
  onSelectPlan: (planId: string) => void;
  showToast: (msg: string, type?: ToastType) => void;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  onNavigate,
  plans,
  currentPlanId,
  onSelectPlan,
  showToast,
}) => {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="border-b border-border-subtle bg-background flex-row justify-between items-center px-5 h-14">
        <Pressable
          onPress={() => onNavigate("settings")}
          className="h-12 w-12 items-center justify-center active:opacity-80"
          accessibilityLabel="Menu"
        >
          <Icon name="menu" size={24} color="#003527" />
        </Pressable>
        <Text className="font-display text-[28px] font-bold text-primary flex-1 text-center">
          Rishta
        </Text>
        <Pressable
          onPress={() => onNavigate("notifications")}
          className="h-12 w-12 items-center justify-center active:opacity-80"
          accessibilityLabel="Notifications"
        >
          <Icon name="notifications" size={24} color="#003527" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-8 pb-24 items-center"
      >
        <View className="items-center mb-10 max-w-2xl gap-3">
          <Text className="font-display text-[28px] font-bold text-primary text-center">
            Choose Your Path to Forever
          </Text>
          <Text className="text-base text-outline text-center leading-relaxed font-body">
            Select a plan that fits your journey. Upgrade anytime to connect
            with more verified profiles.
          </Text>
        </View>

        <View className="w-full gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isPremium = plan.popular;

            return (
              <View
                key={plan.id}
                className={`bg-surface-white rounded-xl p-6 relative overflow-hidden ${
                  isPremium
                    ? "shadow-xl border-2 border-gold"
                    : "shadow-sm border border-border-subtle"
                }`}
              >
                {isPremium && (
                  <View className="absolute top-0 right-0 bg-gold px-4 py-1 rounded-bl-lg">
                    <Text className="text-white text-xs font-bold tracking-wider uppercase">
                      Most Popular
                    </Text>
                  </View>
                )}

                <View className="mb-6 pt-1">
                  <View className="flex-row items-center gap-2 mb-2">
                    {isPremium && (
                      <Icon name="check" size={20} color="#B45309" />
                    )}
                    <Text className="font-display text-xl font-bold text-primary">
                      {plan.name}
                    </Text>
                  </View>
                  <View className="flex-row items-baseline gap-1">
                    <Text className="font-display text-[32px] font-bold text-primary-container">
                      {plan.price}
                    </Text>
                    <Text className="text-sm text-outline font-body">
                      {plan.period}
                    </Text>
                  </View>
                </View>

                <View className="gap-4 mb-8">
                  {[
                    {
                      icon: isPremium ? "infinity" : "visibility",
                      text: plan.profilesVisible,
                      bold: isPremium,
                    },
                    {
                      icon: isPremium ? "infinity" : "heart",
                      text: plan.interests,
                      bold: isPremium,
                    },
                    {
                      icon: isPremium ? "visibility" : "lock",
                      text: plan.teasers,
                      bold: isPremium,
                      muted: !isPremium,
                    },
                    {
                      icon: "rocket",
                      text: plan.boost,
                      bold: isPremium,
                      accent:
                        isPremium || plan.id === "standard",
                    },
                  ].map((feature) => (
                    <View key={feature.text} className="flex-row items-start gap-3">
                      <Icon
                        name={feature.icon}
                        size={20}
                        color={
                          feature.muted
                            ? "#707974"
                            : feature.accent
                              ? "#B45309"
                              : "#064e3b"
                        }
                      />
                      <Text
                        className={`text-sm text-on-surface flex-1 font-body ${feature.bold ? "font-semibold" : ""}`}
                      >
                        {feature.text}
                      </Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={() => {
                    if (!isCurrent) {
                      onSelectPlan(plan.id);
                      showToast(`Subscribed to ${plan.name} plan!`, "success");
                    }
                  }}
                  disabled={isCurrent}
                  className={`w-full h-12 rounded-full items-center justify-center ${
                    isCurrent
                      ? "border-2 border-primary-container bg-surface-container-low"
                      : isPremium
                        ? "bg-primary-container active:bg-primary"
                        : "border-2 border-primary-container active:bg-surface-container-low"
                  }`}
                >
                  <Text
                    className={`font-semibold text-xs uppercase tracking-wider ${
                      isCurrent
                        ? "text-primary-container"
                        : isPremium
                          ? "text-white"
                          : "text-primary-container"
                    }`}
                  >
                    {isCurrent ? "Current Plan" : `Choose ${plan.name}`}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <Text className="mt-12 text-center text-outline text-xs font-body">
          Quotas reset daily at midnight, Pakistan time. Cancel anytime.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};
