import React from "react";
import { View, Text, Pressable, TextInput, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import type { UserFormData } from "../../types";

interface Props {
  formData: UserFormData;
  updateFormData: (fields: Partial<UserFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const inputStyle = Platform.OS === "web"
  ? ({ outlineStyle: "none" } as unknown as object)
  : undefined;

export const BasicDetailsScreen: React.FC<Props> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
}) => {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Mobile Header */}
      <View className="flex-row justify-between items-center px-5 h-14 w-full bg-background border-b border-border-subtle">
        <Pressable
          onPress={onBack}
          className="p-2 -ml-2 rounded-full active:bg-surface-container-highest"
        >
          <Icon name="arrow_back" size={24} color="#404944" />
        </Pressable>
        <Text className="font-display text-xl font-bold text-primary">
          Rishta
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 max-w-3xl w-full mx-auto px-5 py-6">
          {/* Mobile Progress Bar */}
          <View className="w-full flex-row gap-1 mb-8">
            <View className="h-1 flex-1 bg-primary rounded-full" />
            <View className="h-1 flex-1 bg-primary rounded-full" />
            <View className="h-1 flex-1 bg-primary rounded-full" />
            <View className="h-1 flex-1 bg-primary rounded-full" />
            <View className="h-1 flex-1 bg-surface-container-highest rounded-full" />
            <View className="h-1 flex-1 bg-surface-container-highest rounded-full" />
            <View className="h-1 flex-1 bg-surface-container-highest rounded-full" />
            <View className="h-1 flex-1 bg-surface-container-highest rounded-full" />
          </View>

          {/* Page Header */}
          <View className="mb-10">
            <Text className="font-display text-2xl font-bold text-on-surface mb-2">
              Basic details
            </Text>
            <Text className="font-body text-sm text-on-surface-variant">
              Let's start with the fundamentals. This information helps us
              verify authenticity.
            </Text>
          </View>

          {/* Form */}
          <View className="flex-1 gap-6">
            {/* First Name */}
            <View className="flex-col">
              <Text className="font-body text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">
                First name
              </Text>
              <TextInput
                value={formData.firstName}
                onChangeText={(text) => updateFormData({ firstName: text })}
                placeholder="e.g. Fatima"
                placeholderTextColor="#bfc9c3"
                className="w-full bg-surface-white border border-border-subtle rounded-lg px-4 py-3 font-body text-base text-on-surface min-h-[48px]"
                style={inputStyle}
              />
            </View>

            {/* Last Name */}
            <View className="flex-col">
              <Text className="font-body text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">
                Last name
              </Text>
              <TextInput
                value={formData.lastName}
                onChangeText={(text) => updateFormData({ lastName: text })}
                placeholder="e.g. Ali"
                placeholderTextColor="#bfc9c3"
                className="w-full bg-surface-white border border-border-subtle rounded-lg px-4 py-3 font-body text-base text-on-surface min-h-[48px]"
                style={inputStyle}
              />
            </View>

            {/* Marital Status */}
            <View className="flex-col">
              <Text className="font-body text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">
                Marital status
              </Text>
              <Pressable className="w-full bg-surface-white border border-border-subtle rounded-lg px-4 py-3 min-h-[48px] flex-row items-center justify-between">
                <Text
                  className={`font-body text-base ${
                    formData.maritalStatus
                      ? "text-on-surface"
                      : "text-outline-variant"
                  }`}
                >
                  {formData.maritalStatus
                    ? formData.maritalStatus.charAt(0).toUpperCase() +
                      formData.maritalStatus.slice(1)
                    : "Select status"}
                </Text>
                <Icon name="expand_more" size={20} color="#404944" />
              </Pressable>
            </View>

            {/* Religion */}
            <View className="flex-col">
              <Text className="font-body text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">
                Religion
              </Text>
              <Pressable className="w-full bg-surface-white border border-border-subtle rounded-lg px-4 py-3 min-h-[48px] flex-row items-center justify-between">
                <Text
                  className={`font-body text-base ${
                    formData.religion
                      ? "text-on-surface"
                      : "text-outline-variant"
                  }`}
                >
                  {formData.religion
                    ? formData.religion.charAt(0).toUpperCase() +
                      formData.religion.slice(1)
                    : "Select religion"}
                </Text>
                <Icon name="expand_more" size={20} color="#404944" />
              </Pressable>
            </View>

            {/* Date of Birth */}
            <View className="flex-col">
              <Text className="font-body text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">
                Date of birth
              </Text>
              <TextInput
                value={formData.dob}
                onChangeText={(text) => updateFormData({ dob: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#bfc9c3"
                className="w-full bg-surface-white border border-border-subtle rounded-lg px-4 py-3 font-body text-base text-on-surface min-h-[48px]"
                style={inputStyle}
              />
              <View className="flex-row items-center gap-1.5 mt-2 ml-1">
                <Icon name="info" size={16} color="#B45309" />
                <Text className="font-body text-[11px] text-on-surface-variant">
                  Must be 18 or older to register.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="pt-4 pb-6 px-5 bg-background border-t border-border-subtle">
        <View className="max-w-3xl mx-auto w-full">
          <Pressable
            onPress={onNext}
            className="w-full h-14 flex-row items-center justify-center gap-2 bg-primary active:bg-primary-container rounded-full active:scale-[0.98]"
          >
            <Text className="text-white font-body text-base font-medium">
              Continue
            </Text>
            <Icon name="arrow_forward" size={20} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};
