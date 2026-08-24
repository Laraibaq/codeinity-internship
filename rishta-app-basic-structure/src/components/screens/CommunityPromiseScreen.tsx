import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import type { UserFormData } from "../../types";

interface Props {
  formData: UserFormData;
  updateFormData: (fields: Partial<UserFormData>) => void;
  onNext: () => void;
}

export const CommunityPromiseScreen: React.FC<Props> = ({
  formData,
  updateFormData,
  onNext,
}) => {
  const isAgreed = formData.agreedToPromise;

  const handleToggle = () => {
    updateFormData({ agreedToPromise: !isAgreed });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Progress Bar (11 of 12) */}
      <View className="w-full px-5 pt-4 pb-6 flex-row justify-between gap-1">
        {Array.from({ length: 11 }).map((_, i) => (
          <View
            key={i}
            className="h-1 flex-1 rounded-full bg-primary-container"
          />
        ))}
        <View className="h-1 flex-1 rounded-full bg-surface-container-highest" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 items-center justify-center px-5 pb-8">
          {/* Elevate Card */}
          <View className="bg-surface-white w-full max-w-md rounded-xl p-8 shadow-sm border border-border-subtle relative overflow-hidden">
            {/* Icon */}
            <View className="w-16 h-16 mx-auto self-center rounded-full bg-surface-container items-center justify-center mb-6 relative">
              <Icon name="shield_person" size={32} color="#064e3b" fill />
              <View className="absolute top-0 right-0 w-3 h-3 bg-gold rounded-full border-2 border-white" />
            </View>

            {/* Title */}
            <Text className="font-display text-2xl font-bold text-primary text-center mb-6 tracking-tight">
              Community Promise
            </Text>

            {/* Pledges List */}
            <View className="gap-5 mb-8">
              {[
                "Treat everyone with respect",
                "Be honest about yourself and your family member",
                "No harassment — report misuse",
              ].map((pledge) => (
                <View key={pledge} className="flex-row items-start gap-4">
                  <View className="mt-0.5">
                    <Icon
                      name="check_circle"
                      size={20}
                      color="#B45309"
                      fill
                    />
                  </View>
                  <Text className="font-body text-sm text-on-surface-variant leading-relaxed flex-1">
                    {pledge}
                  </Text>
                </View>
              ))}
            </View>

            <View className="w-full h-px bg-border-subtle mb-6" />

            {/* Agreement Checkbox */}
            <Pressable
              onPress={handleToggle}
              className="flex-row items-start gap-4 w-full"
            >
              <View className="items-center justify-center mt-0.5">
                <View
                  className={`w-6 h-6 rounded-md border-[1.5px] items-center justify-center ${
                    isAgreed
                      ? "bg-primary-container border-primary-container"
                      : "bg-surface-white border-outline-variant"
                  }`}
                >
                  {isAgreed && (
                    <Icon
                      name="check"
                      size={14}
                      color="#ffffff"
                      strokeWidth={3}
                    />
                  )}
                </View>
              </View>
              <Text className="font-body text-sm text-on-surface pt-0.5 flex-1">
                I agree to the community guidelines
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Area */}
      <View className="w-full p-5 pb-6 bg-background border-t border-border-subtle">
        <View className="max-w-md mx-auto w-full">
          <Pressable
            onPress={onNext}
            disabled={!isAgreed}
            className={`w-full h-12 rounded-full items-center justify-center ${
              isAgreed
                ? "bg-primary-container active:bg-primary active:scale-[0.98]"
                : "bg-surface-container-highest"
            }`}
          >
            <Text
              className={`font-body text-xs font-semibold uppercase tracking-wider ${
                isAgreed ? "text-white" : "text-outline"
              }`}
            >
              Continue
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};
