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
import { PatternOverlay } from "../common/PatternOverlay";
import { ProgressBar } from "../common/ProgressBar";
import type { UserFormData } from "../../types";

interface Props {
  formData: UserFormData;
  updateFormData: (fields: Partial<UserFormData>) => void;
  onNext: () => void;
}

export const PhoneVerificationScreen: React.FC<Props> = ({
  formData,
  updateFormData,
  onNext,
}) => {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="flex-1 relative">
        <PatternOverlay />

        <ScrollView
          className="flex-1 relative z-10"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Onboarding Header */}
          <View className="w-full items-center pt-8 pb-4 px-5">
            <Text className="font-display text-3xl font-bold text-primary tracking-tight">
              Rishta
            </Text>
          </View>

          {/* Progress */}
          <View className="w-full px-5">
            <ProgressBar total={12} current={1} />
          </View>

          {/* Main Content */}
          <View className="flex-1 px-5 pt-10 pb-8 w-full max-w-md self-center">
            <Text className="font-display text-3xl font-bold text-on-surface mb-2">
              Let's get started
            </Text>
            <Text className="font-body text-base text-on-surface-variant mb-10">
              We'll text you a code to verify your number.
            </Text>

            {/* Form Row */}
            <View className="flex-row gap-3">
              {/* Country Code */}
              <Pressable className="flex-row items-center justify-between h-14 min-w-[100px] bg-surface-white border border-border-subtle rounded-lg px-3 active:scale-95">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl">🇵🇰</Text>
                  <Text className="font-body text-base text-on-surface font-medium">
                    +92
                  </Text>
                </View>
                <Icon name="arrow_drop_down" size={20} color="#707974" />
              </Pressable>

              {/* Phone Input */}
              <View className="relative flex-1 h-14 bg-surface-white border border-border-subtle rounded-lg">
                <View className="absolute -top-2 left-3 bg-surface-white px-1 z-10">
                  <Text className="font-body text-xs font-semibold text-outline">
                    Phone Number
                  </Text>
                </View>
                <TextInput
                  value={formData.phoneNumber}
                  onChangeText={(text) => updateFormData({ phoneNumber: text })}
                  placeholder="03XX XXXXXXX"
                  placeholderTextColor="#bfc9c3"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  className="w-full h-full px-4 font-body text-base text-on-surface"
                  style={
                    Platform.OS === "web"
                      ? ({ outlineStyle: "none" } as unknown as object)
                      : undefined
                  }
                />
              </View>
            </View>

            <View className="flex-1" />

            {/* Actions */}
            <View className="mt-12 gap-6">
              <Pressable
                onPress={onNext}
                className="w-full h-14 bg-primary-container active:bg-primary rounded-full items-center justify-center active:scale-[0.98]"
              >
                <Text className="text-white font-body text-base font-medium">
                  Send OTP
                </Text>
              </Pressable>
              <Text className="text-center font-body text-sm text-on-surface-variant px-2">
                By continuing, you agree to our{" "}
                <Text className="text-primary-container font-medium underline">
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text className="text-primary-container font-medium underline">
                  Privacy Policy
                </Text>
                .
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};
