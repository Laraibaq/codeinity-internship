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

export const FamilyBackgroundScreen: React.FC<Props> = ({
  formData,
  updateFormData,
  onNext,
}) => {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Header */}
      <View className="w-full max-w-lg mx-auto flex-row justify-end items-center p-6 w-full">
        <Pressable
          onPress={onNext}
          className="flex-row items-center gap-1 active:opacity-70"
        >
          <Text className="text-on-surface-variant font-body text-sm">
            Skip for now
          </Text>
          <Icon name="arrow_forward" size={18} color="#404944" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-lg mx-auto px-6 pb-6 flex-1">
          <View className="mb-8">
            <Text className="font-display text-2xl font-bold text-rich-green mb-2">
              Family Background
            </Text>
            <Text className="font-body text-sm text-on-surface-variant">
              Tell us a bit about your family to help us find better matches.
              This section is optional.
            </Text>
          </View>

          <View className="flex-col gap-6 flex-1">
            {/* Parents Block */}
            <View className="bg-surface-white p-6 rounded-xl shadow-sm border border-border-subtle gap-5">
              <View>
                <Text className="font-body text-xs font-semibold text-primary mb-1.5">
                  Father's Occupation & Details
                </Text>
                <TextInput
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={formData.fatherDetails}
                  onChangeText={(text) =>
                    updateFormData({ fatherDetails: text })
                  }
                  placeholder="E.g. Retired Banker, or Business Owner..."
                  placeholderTextColor="#bfc9c3"
                  className="w-full rounded-lg border border-border-subtle bg-surface-white px-4 py-3 font-body text-sm text-on-surface min-h-[80px]"
                  style={inputStyle}
                />
              </View>

              <View>
                <Text className="font-body text-xs font-semibold text-primary mb-1.5">
                  Mother's Occupation & Details
                </Text>
                <TextInput
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={formData.motherDetails}
                  onChangeText={(text) =>
                    updateFormData({ motherDetails: text })
                  }
                  placeholder="E.g. Homemaker, or Teacher..."
                  placeholderTextColor="#bfc9c3"
                  className="w-full rounded-lg border border-border-subtle bg-surface-white px-4 py-3 font-body text-sm text-on-surface min-h-[80px]"
                  style={inputStyle}
                />
              </View>
            </View>

            {/* Siblings & Location Block */}
            <View className="bg-surface-white p-6 rounded-xl shadow-sm border border-border-subtle gap-5">
              <View className="flex-row gap-5">
                <View className="flex-1">
                  <Text className="font-body text-xs font-semibold text-primary mb-1.5">
                    Brothers
                  </Text>
                  <Pressable className="w-full h-[52px] rounded-lg border border-border-subtle bg-surface-white px-4 flex-row items-center justify-between">
                    <Text className="font-body text-sm text-on-surface">
                      {formData.brothers || "0"}
                    </Text>
                    <Icon name="expand_more" size={20} color="#404944" />
                  </Pressable>
                </View>

                <View className="flex-1">
                  <Text className="font-body text-xs font-semibold text-primary mb-1.5">
                    Sisters
                  </Text>
                  <Pressable className="w-full h-[52px] rounded-lg border border-border-subtle bg-surface-white px-4 flex-row items-center justify-between">
                    <Text className="font-body text-sm text-on-surface">
                      {formData.sisters || "0"}
                    </Text>
                    <Icon name="expand_more" size={20} color="#404944" />
                  </Pressable>
                </View>
              </View>

              <View>
                <Text className="font-body text-xs font-semibold text-primary mb-1.5">
                  Family Location
                </Text>
                <View className="relative">
                  <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
                    <Icon name="location_on" size={20} color="#bfc9c3" />
                  </View>
                  <TextInput
                    value={formData.familyLocation}
                    onChangeText={(text) =>
                      updateFormData({ familyLocation: text })
                    }
                    placeholder="City, Country"
                    placeholderTextColor="#bfc9c3"
                    className="w-full h-[52px] pl-12 pr-4 rounded-lg border border-border-subtle bg-surface-white font-body text-sm text-on-surface"
                    style={inputStyle}
                  />
                </View>
              </View>

              <View>
                <Text className="font-body text-xs font-semibold text-primary mb-1.5">
                  Financial Status
                </Text>
                <Pressable className="w-full h-[52px] rounded-lg border border-border-subtle bg-surface-white px-4 flex-row items-center justify-between">
                  <Text
                    className={`font-body text-sm ${
                      formData.financialStatus
                        ? "text-on-surface"
                        : "text-outline-variant"
                    }`}
                  >
                    {formData.financialStatus
                      ? formData.financialStatus.charAt(0).toUpperCase() +
                        formData.financialStatus.slice(1)
                      : "Select status..."}
                  </Text>
                  <Icon name="expand_more" size={20} color="#404944" />
                </Pressable>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="mt-auto pt-8 pb-4 flex-col gap-4">
              <Pressable
                onPress={onNext}
                className="w-full h-14 bg-primary-container rounded-lg flex-row items-center justify-center gap-2 active:bg-primary active:scale-[0.98]"
              >
                <Text className="text-white font-body text-base font-medium">
                  Save Details
                </Text>
              </Pressable>
              <Pressable
                onPress={onNext}
                className="w-full h-12 rounded-lg items-center justify-center active:bg-surface-container-low"
              >
                <Text className="text-primary-container font-body text-base font-medium">
                  Skip for now
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
