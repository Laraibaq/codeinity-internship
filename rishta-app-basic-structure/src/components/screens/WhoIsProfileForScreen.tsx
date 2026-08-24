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

export const WhoIsProfileForScreen: React.FC<Props> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
}) => {
  const selected = formData.profileFor;

  const handleSelect = (val: UserFormData["profileFor"]) => {
    updateFormData({ profileFor: val });
  };

  const isFamily = selected !== "" && selected !== "myself";

  const familyItems: {
    id: UserFormData["profileFor"];
    label: string;
    icon: string;
  }[] = [
    { id: "son", label: "My son", icon: "face" },
    { id: "daughter", label: "My daughter", icon: "face_3" },
    { id: "brother", label: "My brother", icon: "face_6" },
    { id: "sister", label: "My sister", icon: "face_4" },
  ];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Top Navigation */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-4 bg-background">
        <Pressable
          onPress={onBack}
          accessibilityLabel="Go back"
          className="w-10 h-10 items-center justify-center rounded-full bg-surface-container-low active:bg-surface-container-highest"
        >
          <Icon name="arrow_back" size={24} color="#1b1c1a" />
        </Pressable>

        {/* Progress Bar: Segment 2 Active */}
        <View className="flex-1 flex-row justify-center items-center gap-1.5 px-6 max-w-[200px] mx-auto">
          <View className="h-1.5 w-full rounded-full bg-primary" />
          <View className="h-1.5 w-full rounded-full bg-primary-container" />
          <View className="h-1.5 w-full rounded-full bg-surface-container-highest" />
          <View className="h-1.5 w-full rounded-full bg-surface-container-highest" />
          <View className="h-1.5 w-full rounded-full bg-surface-container-highest" />
        </View>

        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-5 pt-4 pb-8 w-full max-w-lg self-center">
          {/* Headers */}
          <View className="mb-8">
            <Text className="font-display text-2xl font-bold text-primary mb-3">
              Who is this profile for?
            </Text>
            <Text className="font-body text-base text-on-surface-variant">
              You'll manage the profile on their behalf.
            </Text>
          </View>

          {/* Selection */}
          <View className="flex-col gap-4">
            {/* Primary Option: Myself */}
            <Pressable
              onPress={() => handleSelect("myself")}
              className={`relative flex-row items-center p-5 rounded-2xl border ${
                selected === "myself"
                  ? "border-primary bg-surface-container-low"
                  : "border-border-subtle bg-surface-white"
              }`}
            >
              <View
                className={`items-center justify-center w-14 h-14 rounded-full mr-5 ${
                  selected === "myself" ? "bg-primary" : "bg-surface-container"
                }`}
              >
                <Icon
                  name="person"
                  size={28}
                  color={selected === "myself" ? "#ffffff" : "#1b1c1a"}
                />
              </View>
              <View className="flex-1">
                <Text className="font-display text-xl font-semibold text-on-surface mb-0.5">
                  Myself
                </Text>
                <Text className="font-body text-xs text-on-surface-variant">
                  I am looking for a partner
                </Text>
              </View>
              <View
                className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                  selected === "myself"
                    ? "border-primary bg-primary"
                    : "border-outline-variant"
                }`}
              >
                {selected === "myself" && (
                  <Icon name="check" size={14} color="#ffffff" strokeWidth={3} />
                )}
              </View>
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center gap-4 py-3">
              <View className="h-px bg-border-subtle flex-1" />
              <Text className="font-body text-xs font-semibold text-outline uppercase tracking-widest">
                Family Members
              </Text>
              <View className="h-px bg-border-subtle flex-1" />
            </View>

            {/* Grid Options */}
            <View className="flex-row flex-wrap -mx-1.5">
              {familyItems.map((item) => {
                const isItemChecked = selected === item.id;
                return (
                  <View key={item.id} className="w-1/2 px-1.5 mb-3">
                    <Pressable
                      onPress={() => handleSelect(item.id)}
                      className={`items-center justify-center p-5 rounded-2xl border ${
                        isItemChecked
                          ? "border-primary bg-surface-container-low"
                          : "border-border-subtle bg-surface-white"
                      } active:scale-[0.98]`}
                    >
                      <View
                        className={`w-12 h-12 mb-3 rounded-full items-center justify-center ${
                          isItemChecked ? "bg-primary" : "bg-surface-container"
                        }`}
                      >
                        <Icon
                          name={item.icon}
                          size={24}
                          color={isItemChecked ? "#ffffff" : "#1b1c1a"}
                        />
                      </View>
                      <Text
                        className={`font-display text-base font-semibold ${
                          isItemChecked ? "text-primary" : "text-on-surface"
                        }`}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Contextual Information Note for Family Selection */}
            {isFamily && (
              <View className="mt-4 flex-row items-start gap-3 p-4 rounded-xl bg-surface-container border border-border-subtle">
                <View className="items-center justify-center shrink-0 w-6 h-6 mt-0.5">
                  <Icon name="shield_person" size={20} color="#B45309" fill />
                </View>
                <Text className="font-body text-[13px] leading-relaxed text-on-surface-variant flex-1">
                  You'll create and manage their rishta profile. A{" "}
                  <Text className="text-on-surface font-medium">
                    "Managed by family"
                  </Text>{" "}
                  badge will be displayed to maintain trust and transparency
                  with potential matches.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Area */}
      <View className="w-full bg-background pt-4 pb-6 px-5 border-t border-border-subtle">
        <View className="max-w-lg mx-auto w-full">
          <Pressable
            onPress={onNext}
            disabled={!selected}
            className={`w-full h-14 rounded-full items-center justify-center active:scale-[0.98] ${
              selected
                ? "bg-primary active:bg-primary-container"
                : "bg-surface-container-highest"
            }`}
          >
            <Text
              className={`font-body text-base font-semibold uppercase tracking-wide ${
                selected ? "text-white" : "text-on-surface-variant"
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
