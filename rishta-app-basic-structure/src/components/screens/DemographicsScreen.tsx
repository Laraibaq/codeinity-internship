import React from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import type { UserFormData } from "../../types";

interface Props {
  formData: UserFormData;
  updateFormData: (fields: Partial<UserFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const inputStyle =
  Platform.OS === "web"
    ? ({ outlineStyle: "none" } as unknown as object)
    : undefined;

export const DemographicsScreen: React.FC<Props> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
}) => {
  const heightInches = formData.heightInches || 66;
  const feet = Math.floor(heightInches / 12);
  const inches = heightInches % 12;
  const cm = Math.round(heightInches * 2.54);

  const bump = (delta: number) => {
    const next = Math.min(84, Math.max(48, heightInches + delta));
    updateFormData({ heightInches: next });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Header */}
      <View className="w-full bg-background border-b border-border-subtle flex-row justify-between items-center px-5 h-14">
        <Pressable
          onPress={onBack}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-container-highest active:scale-95"
        >
          <Icon name="arrow_back" size={24} color="#003527" />
        </Pressable>
        <Text className="font-display text-lg font-bold text-primary tracking-tight">
          Personal & Background
        </Text>
        <View className="w-10 h-10" />
      </View>

      {/* Progress Bar (7/12 active = ~58%) */}
      <View className="w-full h-1 bg-surface-container-highest relative">
        <View
          className="bg-primary h-full rounded-r-full"
          style={{ width: "58.33%" }}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-5 pt-6 max-w-md mx-auto w-full">
          <View className="mb-8">
            <Text className="font-display text-2xl font-bold text-primary mb-2">
              Demographics
            </Text>
            <Text className="font-body text-sm text-on-surface-variant">
              Please share details to help us find the most compatible matches
              for your family's preferences.
            </Text>
            <View className="mt-4 flex-row items-start gap-2 bg-surface-container-low p-3 rounded-lg border border-border-subtle">
              <View className="mt-0.5">
                <Icon name="info" size={18} color="#B45309" fill />
              </View>
              <Text className="font-body text-xs text-on-surface-variant flex-1">
                Note: Caste, sect, and ethnicity lists are region-based to
                ensure relevance.
              </Text>
            </View>
          </View>

          <View className="gap-6">
            {/* Height Stepper */}
            <View className="bg-surface-white p-4 rounded-xl shadow-sm border border-border-subtle">
              <Text className="font-body text-xs font-semibold text-on-surface-variant mb-4">
                Height
              </Text>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="font-body text-lg text-primary font-semibold">
                  {feet}' {inches}"
                </Text>
                <Text className="font-body text-sm text-on-surface-variant">
                  {cm} cm
                </Text>
              </View>
              <View className="flex-row items-center justify-between gap-3">
                <Pressable
                  onPress={() => bump(-1)}
                  className="h-12 w-12 rounded-full bg-surface-container items-center justify-center active:bg-surface-container-high"
                >
                  <Text className="font-body text-xl text-primary">-</Text>
                </Pressable>
                <View className="flex-1 h-1.5 bg-surface-container-highest rounded-lg overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-lg"
                    style={{
                      width: `${((heightInches - 48) / (84 - 48)) * 100}%`,
                    }}
                  />
                </View>
                <Pressable
                  onPress={() => bump(1)}
                  className="h-12 w-12 rounded-full bg-surface-container items-center justify-center active:bg-surface-container-high"
                >
                  <Text className="font-body text-xl text-primary">+</Text>
                </Pressable>
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="font-body text-xs text-outline">4' 0"</Text>
                <Text className="font-body text-xs text-outline">7' 0"</Text>
              </View>
            </View>

            {/* Sect Dropdown */}
            <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle p-3">
              <Text className="font-body text-xs font-semibold text-on-surface-variant mb-1">
                Sect
              </Text>
              <Pressable className="flex-row items-center justify-between py-1">
                <Text
                  className={`font-body text-sm ${
                    formData.sect
                      ? "text-on-surface"
                      : "text-outline-variant"
                  }`}
                >
                  {formData.sect
                    ? formData.sect.charAt(0).toUpperCase() +
                      formData.sect.slice(1)
                    : "Select sect"}
                </Text>
                <Icon name="expand_more" size={20} color="#404944" />
              </Pressable>
            </View>

            {/* Ethnicity Dropdown */}
            <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle p-3">
              <Text className="font-body text-xs font-semibold text-on-surface-variant mb-1">
                Ethnicity
              </Text>
              <Pressable className="flex-row items-center justify-between py-1">
                <Text
                  className={`font-body text-sm ${
                    formData.ethnicity
                      ? "text-on-surface"
                      : "text-outline-variant"
                  }`}
                >
                  {formData.ethnicity
                    ? formData.ethnicity.charAt(0).toUpperCase() +
                      formData.ethnicity.slice(1)
                    : "Select ethnicity"}
                </Text>
                <Icon name="expand_more" size={20} color="#404944" />
              </Pressable>
            </View>

            {/* Caste / Baradari */}
            <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle p-3">
              <Text className="font-body text-xs font-semibold text-on-surface-variant mb-1">
                Caste / Baradari
              </Text>
              <View className="flex-row items-center bg-surface-container-low rounded-lg px-3 py-2">
                <View className="mr-2">
                  <Icon name="search" size={16} color="#707974" />
                </View>
                <TextInput
                  value={formData.caste}
                  onChangeText={(text) => updateFormData({ caste: text })}
                  placeholder="Search caste..."
                  placeholderTextColor="#bfc9c3"
                  className="flex-1 font-body text-sm text-on-surface"
                  style={inputStyle}
                />
              </View>
            </View>

            {/* Household Details Section */}
            <View className="mt-4 mb-2 flex-row items-center gap-2">
              <Icon name="home" size={24} color="#003527" fill />
              <Text className="font-display text-xl font-semibold text-primary">
                Household Details
              </Text>
            </View>

            {/* House Size */}
            <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle p-3">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="font-body text-xs font-semibold text-on-surface-variant">
                  House Size (e.g. 5 Marla, 3 Bedroom)
                </Text>
                <Text className="text-[10px] text-outline font-body uppercase tracking-wider">
                  Optional
                </Text>
              </View>
              <TextInput
                value={formData.houseSize}
                onChangeText={(text) => updateFormData({ houseSize: text })}
                placeholder="e.g. 10 Marla, 4 Bedroom"
                placeholderTextColor="#bfc9c3"
                className="font-body text-sm text-on-surface py-1"
                style={inputStyle}
              />
            </View>

            {/* Monthly Household Income */}
            <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle p-3">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="font-body text-xs font-semibold text-on-surface-variant">
                  Monthly Household Income
                </Text>
                <View className="flex-row items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded border border-border-subtle">
                  <Icon name="lock" size={14} color="#404944" />
                  <Text className="text-[10px] font-body text-on-surface-variant">
                    Private
                  </Text>
                </View>
              </View>
              <Pressable className="flex-row items-center justify-between py-1">
                <Text
                  className={`font-body text-sm ${
                    formData.incomeBracket
                      ? "text-on-surface"
                      : "text-outline-variant"
                  }`}
                >
                  {formData.incomeBracket || "Select income bracket"}
                </Text>
                <Icon name="expand_more" size={20} color="#404944" />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Area */}
      <View className="w-full bg-surface-white px-5 py-4 border-t border-border-subtle">
        <View className="max-w-md mx-auto w-full">
          <Pressable
            onPress={onNext}
            className="w-full h-14 bg-primary-container active:bg-primary rounded-lg flex-row items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Text className="text-white font-body text-xs font-semibold uppercase tracking-wider">
              Continue
            </Text>
            <Icon name="arrow_forward" size={14} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};
