import React, { useState } from "react";
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

const ALL_INTERESTS = [
  "Reading",
  "Travel",
  "Film & cinema",
  "Cooking",
  "Coffee shops",
  "Photography",
  "Hiking",
  "Art Galleries",
  "Volunteering",
  "Baking",
  "Islamic History",
  "Board Games",
  "Calligraphy",
  "Cricket",
  "Fitness",
];

export const LifestyleInterestsScreen: React.FC<Props> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const selectedInterests =
    formData.interests && formData.interests.length > 0
      ? formData.interests
      : ["Travel", "Cooking", "Islamic History"];

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      updateFormData({
        interests: selectedInterests.filter((i) => i !== interest),
      });
    } else {
      if (selectedInterests.length < 5) {
        updateFormData({ interests: [...selectedInterests, interest] });
      }
    }
  };

  const filteredInterests = ALL_INTERESTS.filter((i) =>
    i.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFields: { key: keyof UserFormData; label: string }[] = [
    { key: "eatHalalOnly", label: "Only eat halal food" },
    { key: "smoke", label: "Smoke" },
    { key: "drinkAlcohol", label: "Drink alcohol" },
    { key: "moveAbroad", label: "Would move abroad for marriage" },
    { key: "haveChildren", label: "Have children" },
  ];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Top Navigation */}
      <View className="w-full bg-background flex-row justify-between items-center px-5 h-14 border-b border-border-subtle">
        <Pressable
          onPress={onBack}
          className="p-2 rounded-full items-center justify-center active:bg-surface-container-highest active:scale-95"
        >
          <Icon name="arrow_back" size={24} color="#404944" />
        </Pressable>
        <Text className="font-display text-xl font-bold text-primary">
          Rishta
        </Text>
        <View className="w-12" />
      </View>

      {/* Progress Bar (Step 8 of 12) */}
      <View className="w-full px-5 pt-2 pb-6">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="font-body text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Step 8 of 12
          </Text>
          <Text className="font-body text-xs font-semibold text-primary">
            Lifestyle
          </Text>
        </View>
        <View className="flex-row gap-1 w-full h-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={`f-${i}`}
              className="h-full rounded-full bg-primary flex-1"
            />
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={`e-${i}`}
              className="h-full rounded-full bg-surface-container-highest flex-1"
            />
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-5 max-w-2xl mx-auto w-full">
          <View className="mb-8">
            <Text className="font-display text-2xl font-bold text-on-surface mb-2">
              Lifestyle & Interests
            </Text>
            <Text className="font-body text-sm text-on-surface-variant">
              Help potential matches understand your daily life and what you
              enjoy doing.
            </Text>
          </View>

          {/* Section 1: Lifestyle Questions */}
          <View className="mb-10 bg-surface-white rounded-xl shadow-sm border border-border-subtle p-5">
            <View className="flex-row items-center gap-2 mb-6">
              <Icon name="auto_awesome" size={24} color="#064e3b" fill />
              <Text className="font-display text-xl font-semibold text-on-surface">
                Daily Life
              </Text>
            </View>

            {/* Religious Practice Selector */}
            <View className="mb-8">
              <Text className="font-body text-xs font-semibold text-on-surface-variant mb-3">
                How do you practise your religion?
              </Text>
              <View className="gap-3">
                {[
                  {
                    id: "practising",
                    label: "Practising (Pray daily, fast, etc.)",
                  },
                  { id: "moderately", label: "Moderately practising" },
                  {
                    id: "cultural",
                    label: "Cultural / Not very practising",
                  },
                ].map((opt) => {
                  const isSelected = formData.religionPractice === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() =>
                        updateFormData({ religionPractice: opt.id })
                      }
                      className={`flex-row items-center p-4 border rounded-lg ${
                        isSelected
                          ? "border-primary-container bg-background"
                          : "border-border-subtle"
                      }`}
                    >
                      <View
                        className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                          isSelected
                            ? "border-primary-container"
                            : "border-outline"
                        }`}
                      >
                        {isSelected && (
                          <View className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                        )}
                      </View>
                      <Text className="ml-3 font-body text-base text-on-surface">
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="h-px bg-border-subtle mb-6" />

            {/* Toggle Switches */}
            <View className="gap-6">
              {toggleFields.map((item) => {
                const checked = Boolean(
                  (formData as unknown as Record<string, unknown>)[
                    item.key as string
                  ]
                );
                return (
                  <View
                    key={item.key as string}
                    className="flex-row items-center justify-between"
                  >
                    <Text className="font-body text-base text-on-surface">
                      {item.label}
                    </Text>
                    <Pressable
                      onPress={() =>
                        updateFormData({
                          [item.key]: !checked,
                        } as Partial<UserFormData>)
                      }
                      className={`w-12 h-6 rounded-full ${
                        checked ? "bg-primary-container" : "bg-surface-container-highest"
                      }`}
                    >
                      <View
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                        style={{ left: checked ? 26 : 2 }}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Section 2: Interests Tag Cloud */}
          <View className="mb-10 bg-surface-white rounded-xl shadow-sm border border-border-subtle p-5">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <Icon name="favorite" size={24} color="#064e3b" fill />
                <Text className="font-display text-xl font-semibold text-on-surface">
                  Your Interests
                </Text>
              </View>
              <Text className="font-body text-xs font-semibold text-on-surface-variant">
                {selectedInterests.length}/5 selected
              </Text>
            </View>

            {/* Search Input */}
            <View className="relative mb-6">
              <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
                <Icon name="search" size={20} color="#707974" />
              </View>
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Search interests..."
                placeholderTextColor="#bfc9c3"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-subtle bg-background font-body text-sm text-on-surface"
                style={inputStyle}
              />
            </View>

            {/* Tag Cloud */}
            <View className="flex-row flex-wrap gap-3">
              {filteredInterests.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full flex-row items-center gap-2 border ${
                      isSelected
                        ? "bg-primary-container border-primary-container"
                        : "bg-background border-border-subtle"
                    }`}
                  >
                    <Text
                      className={`font-body text-sm ${
                        isSelected ? "text-white" : "text-on-surface"
                      }`}
                    >
                      {interest}
                    </Text>
                    {isSelected && (
                      <Icon name="close" size={16} color="#ffffff" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Area */}
      <View className="w-full bg-surface-white border-t border-border-subtle p-5">
        <View className="max-w-2xl mx-auto flex-row gap-4 w-full">
          <Pressable
            onPress={onBack}
            className="w-14 h-14 rounded-lg border-2 border-outline-variant items-center justify-center active:bg-surface-container-highest"
          >
            <Icon name="arrow_back" size={24} color="#1b1c1a" />
          </Pressable>
          <Pressable
            onPress={onNext}
            className="flex-1 h-14 rounded-lg bg-primary-container flex-row items-center justify-center gap-2 active:bg-primary"
          >
            <Text className="text-white font-body text-xs uppercase tracking-wider font-semibold">
              Continue
            </Text>
            <Icon name="arrow_forward" size={20} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};
