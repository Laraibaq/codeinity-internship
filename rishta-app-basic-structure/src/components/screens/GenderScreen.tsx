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

export const GenderScreen: React.FC<Props> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
}) => {
  const selected = formData.gender;

  const handleSelect = (g: "male" | "female") => {
    updateFormData({ gender: g });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Top Navigation */}
      <View className="flex-row justify-between items-center px-5 h-14 w-full bg-background border-b border-border-subtle">
        <Pressable
          onPress={onBack}
          accessibilityLabel="Go back"
          className="w-12 h-12 items-start justify-center active:scale-95"
        >
          <Icon name="arrow_back" size={24} color="#404944" />
        </Pressable>
        <Text className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          Step 3 of 12
        </Text>
        <View className="w-12" />
      </View>

      {/* Progress Bar (25%) */}
      <View className="w-full bg-surface-container-highest h-1 relative overflow-hidden">
        <View className="absolute top-0 left-0 h-full bg-primary rounded-r-full w-1/4" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 px-5 pt-8 pb-8 w-full max-w-md self-center">
          {/* Header */}
          <View className="mb-10 items-center">
            <Text className="font-display text-3xl font-bold text-primary mb-3 text-center">
              Your gender
            </Text>
            <Text className="font-body text-sm text-on-surface-variant text-center">
              To ensure meaningful connections, Rishta currently facilitates
              opposite-gender matching.
            </Text>
          </View>

          {/* Selection Grid */}
          <View className="flex-row gap-4">
            {(["male", "female"] as const).map((g) => {
              const isSelected = selected === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => handleSelect(g)}
                  className={`flex-1 aspect-square bg-surface-white border rounded-xl p-6 items-center justify-center ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border-subtle"
                  }`}
                >
                  <View
                    className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                      isSelected ? "bg-primary/10" : "bg-surface-container-low"
                    }`}
                  >
                    <Icon
                      name={g === "male" ? "male" : "female"}
                      size={36}
                      color={isSelected ? "#003527" : "#404944"}
                      fill={isSelected}
                    />
                  </View>
                  <Text className="font-display text-xl font-semibold text-on-surface capitalize">
                    {g}
                  </Text>
                  {isSelected && (
                    <View className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full items-center justify-center">
                      <Icon name="check" size={14} color="#ffffff" strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <View className="flex-1" />

          {/* Bottom Actions */}
          <View className="mt-8 pt-4 pb-6">
            <Pressable
              onPress={onNext}
              disabled={!selected}
              className={`w-full h-14 rounded-full items-center justify-center ${
                selected
                  ? "bg-primary active:bg-primary-container active:scale-95"
                  : "bg-surface-container-highest"
              }`}
            >
              <Text
                className={`font-body text-base font-semibold ${
                  selected ? "text-white" : "text-on-surface-variant"
                }`}
              >
                Continue
              </Text>
            </Pressable>
            <View className="mt-4 flex-row items-center justify-center gap-1">
              <Icon name="lock" size={14} color="#B45309" fill />
              <Text className="font-body text-xs font-semibold text-on-surface-variant">
                Your privacy is protected
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
