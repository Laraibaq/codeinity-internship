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

export const WhatLookingForScreen: React.FC<Props> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
}) => {
  const intentOptions = [
    {
      id: "ready",
      title: "I am ready to get married",
      icon: "favorite",
      isFilled: true,
    },
    {
      id: "know",
      title: "I want to get to know someone",
      icon: "family_restroom",
      isFilled: false,
    },
    {
      id: "not_sure",
      title: "Not sure yet",
      icon: "psychology",
      isFilled: false,
    },
  ];

  const timelineOptions = [
    "1–2 months",
    "3–4 months",
    "4–12 months",
    "1–2 years",
    "Open / decide together",
  ];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Onboarding Header */}
      <View className="w-full px-5 pt-4 pb-4 gap-4">
        <View className="flex-row items-center justify-between h-10 w-full">
          <Pressable
            onPress={onBack}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-container-highest active:scale-95"
          >
            <Icon name="arrow_back" size={24} color="#404944" />
          </Pressable>
          <Text className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
            Step 5 of 6
          </Text>
          <View className="w-10 h-10" />
        </View>

        {/* Progress Bar: Segment 5 Active */}
        <View className="flex-row gap-1.5 w-full">
          <View className="h-1 flex-1 rounded-full bg-primary-container" />
          <View className="h-1 flex-1 rounded-full bg-primary-container" />
          <View className="h-1 flex-1 rounded-full bg-primary-container" />
          <View className="h-1 flex-1 rounded-full bg-primary-container" />
          <View className="h-1 flex-1 rounded-full bg-primary-container" />
          <View className="h-1 flex-1 rounded-full bg-surface-container-highest" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-5 max-w-lg mx-auto w-full">
          {/* Page Title */}
          <View className="mb-8 mt-4">
            <Text className="font-display text-2xl font-bold text-primary mb-2">
              What are you looking for?
            </Text>
            <Text className="font-body text-sm text-on-surface-variant">
              We'll use this to find people on the same page.
            </Text>
          </View>

          {/* Question A: Intent */}
          <View className="mb-10">
            <Text className="font-display text-xl font-semibold text-on-surface mb-4">
              What brings you here?
            </Text>
            <View className="flex-col gap-3">
              {intentOptions.map((opt) => {
                const isSelected = formData.intent === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => updateFormData({ intent: opt.id })}
                    className={`w-full p-5 rounded-xl border flex-row items-center gap-4 relative active:scale-[0.98] ${
                      isSelected
                        ? "border-primary-container bg-surface-white"
                        : "border-outline-variant bg-surface-white"
                    }`}
                  >
                    <View
                      className={`w-12 h-12 rounded-full items-center justify-center ${
                        isSelected
                          ? "bg-primary-container"
                          : "bg-surface-container"
                      }`}
                    >
                      <Icon
                        name={opt.icon}
                        size={24}
                        color={isSelected ? "#ffffff" : "#064e3b"}
                        fill={opt.isFilled || isSelected}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`font-body text-base font-medium ${
                          isSelected ? "text-primary-container" : "text-on-surface"
                        }`}
                      >
                        {opt.title}
                      </Text>
                    </View>
                    <View
                      className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                        isSelected
                          ? "border-primary-container bg-primary-container"
                          : "border-outline-variant"
                      }`}
                    >
                      {isSelected && (
                        <Icon
                          name="check"
                          size={14}
                          color="#ffffff"
                          strokeWidth={3}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Question B: Timeline */}
          <View>
            <Text className="font-display text-xl font-semibold text-on-surface mb-4">
              Marriage timeline
            </Text>
            <View className="flex-row flex-wrap gap-2.5">
              {timelineOptions.map((item) => {
                const isSelected = formData.timeline === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => updateFormData({ timeline: item })}
                    className={`px-5 py-3 rounded-full border active:scale-95 ${
                      isSelected
                        ? "bg-primary-container border-primary-container"
                        : "border-outline-variant bg-surface-white"
                    }`}
                  >
                    <Text
                      className={`font-body text-sm ${
                        isSelected
                          ? "text-white font-medium"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View className="w-full px-5 pt-4 pb-6 bg-background border-t border-border-subtle">
        <View className="max-w-lg mx-auto w-full">
          <Pressable
            onPress={onNext}
            className="w-full h-14 bg-primary-container active:bg-primary rounded-full flex-row items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Text className="text-white font-body text-xs font-semibold uppercase tracking-wider">
              Continue
            </Text>
            <Icon name="arrow_forward" size={18} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};
