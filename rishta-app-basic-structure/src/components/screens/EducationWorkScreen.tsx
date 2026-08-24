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

const DropdownField: React.FC<{ label: string; value: string; placeholder: string }> = ({
  label,
  value,
  placeholder,
}) => (
  <View>
    <Text className="mb-1 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
      {label}
    </Text>
    <Pressable className="w-full h-14 px-4 bg-surface-white border border-border-subtle rounded-lg flex-row items-center justify-between">
      <Text
        className={`font-body text-base ${
          value ? "text-on-surface" : "text-outline-variant"
        }`}
      >
        {value
          ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ")
          : placeholder}
      </Text>
      <Icon name="expand_more" size={20} color="#404944" />
    </Pressable>
  </View>
);

export const EducationWorkScreen: React.FC<Props> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
}) => {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Top Navigation */}
      <View className="bg-background border-b border-border-subtle w-full flex-row justify-between items-center px-5 h-14">
        <Pressable
          onPress={onBack}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-container-highest active:scale-95"
        >
          <Icon name="arrow_back" size={24} color="#404944" />
        </Pressable>
        <Text className="font-display text-xl font-bold text-primary">
          Rishta
        </Text>
        <View className="w-10" />
      </View>

      {/* Progress Bar (60% active) */}
      <View className="w-full bg-surface-container-highest h-1 relative">
        <View
          className="bg-primary h-full rounded-r-full"
          style={{ width: "60%" }}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-5 py-6 max-w-2xl mx-auto w-full">
          {/* Header */}
          <View className="mb-8">
            <Text className="font-display text-2xl font-bold text-primary mb-2">
              Education & Work
            </Text>
            <Text className="font-body text-sm text-on-surface-variant">
              Tell us about your background. This helps find matches with
              similar life paths.
            </Text>
          </View>

          {/* Form */}
          <View className="flex-col gap-8">
            {/* Section 1: Education */}
            <View className="bg-surface-white rounded-xl shadow-sm p-6 border border-border-subtle">
              <View className="flex-row items-center gap-2 mb-6 border-b border-border-subtle pb-4">
                <Icon name="school" size={24} color="#003527" />
                <Text className="font-display text-xl font-semibold text-on-surface">
                  Education
                </Text>
              </View>
              <View className="flex-col gap-6">
                <DropdownField
                  label="Highest Education Level"
                  value={formData.educationLevel}
                  placeholder="Select level"
                />

                <View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Institute Name
                    </Text>
                    <Text className="font-body text-xs text-outline-variant">
                      Optional
                    </Text>
                  </View>
                  <TextInput
                    value={formData.instituteName}
                    onChangeText={(text) =>
                      updateFormData({ instituteName: text })
                    }
                    placeholder="e.g. NUST, Lums"
                    placeholderTextColor="#bfc9c3"
                    className="w-full h-14 px-4 bg-surface-white border border-border-subtle rounded-lg font-body text-base text-on-surface"
                    style={inputStyle}
                  />
                </View>
              </View>
            </View>

            {/* Section 2: Work & Location */}
            <View className="bg-surface-white rounded-xl shadow-sm p-6 border border-border-subtle">
              <View className="flex-row items-center gap-2 mb-6 border-b border-border-subtle pb-4">
                <Icon name="work" size={24} color="#003527" />
                <Text className="font-display text-xl font-semibold text-on-surface">
                  Work & Location
                </Text>
              </View>
              <View className="flex-col gap-6">
                <DropdownField
                  label="Employment Status"
                  value={formData.employmentStatus}
                  placeholder="Select status"
                />
                <DropdownField
                  label="Profession"
                  value={formData.profession}
                  placeholder="Select profession"
                />
                <DropdownField
                  label="Country of Residence"
                  value={formData.country}
                  placeholder="Select country"
                />
                <DropdownField
                  label="Nationality"
                  value={formData.nationality}
                  placeholder="Select nationality"
                />

                <View>
                  <Text className="mb-1 font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    City / State
                  </Text>
                  <TextInput
                    value={formData.cityState}
                    onChangeText={(text) =>
                      updateFormData({ cityState: text })
                    }
                    placeholder="e.g. Lahore, Punjab"
                    placeholderTextColor="#bfc9c3"
                    className="w-full h-14 px-4 bg-surface-white border border-border-subtle rounded-lg font-body text-base text-on-surface"
                    style={inputStyle}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Area */}
      <View className="w-full bg-surface-white border-t border-border-subtle p-4">
        <View className="max-w-2xl mx-auto flex-row gap-4 w-full">
          <Pressable
            onPress={onNext}
            className="h-14 px-6 rounded-full border-[1.5px] border-primary-container items-center justify-center active:bg-surface-container-high active:scale-95 w-32"
          >
            <Text className="text-primary-container font-body text-base font-semibold">
              Skip
            </Text>
          </Pressable>
          <Pressable
            onPress={onNext}
            className="h-14 bg-primary-container rounded-full flex-1 flex-row items-center justify-center gap-2 active:bg-primary active:scale-95"
          >
            <Text className="text-white font-body text-base font-semibold">
              Continue
            </Text>
            <Icon name="arrow_forward" size={20} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};
