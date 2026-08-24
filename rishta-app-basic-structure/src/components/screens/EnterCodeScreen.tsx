import React, { useState, useEffect, useRef } from "react";
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

export const EnterCodeScreen: React.FC<Props> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
}) => {
  const [code, setCode] = useState<string[]>(
    formData.otpCode.length === 6 ? formData.otpCode : ["", "", "", "7", "3", "9"]
  );
  const [hasError, setHasError] = useState(true);
  const [timeLeft, setTimeLeft] = useState(57);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleInputChange = (index: number, value: string) => {
    if (hasError) setHasError(false);
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    updateFormData({ otpCode: newCode });

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setTimeLeft(59);
    setCanResend(false);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Top App Bar */}
      <View className="w-full bg-background px-5 h-14 flex-row items-center pt-2">
        <Pressable
          onPress={onBack}
          accessibilityLabel="Go back"
          className="h-12 w-12 items-start justify-center active:scale-95"
        >
          <Icon name="arrow_back" size={24} color="#404944" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pb-8 w-full max-w-md self-center">
          {/* Progress Bar (Segment 1 Active) */}
          <View className="w-full flex-row gap-1 pt-2 pb-6">
            <View className="bg-primary h-1 flex-1 rounded-full" />
            <View className="bg-surface-container-highest h-1 flex-1 rounded-full" />
            <View className="bg-surface-container-highest h-1 flex-1 rounded-full" />
            <View className="bg-surface-container-highest h-1 flex-1 rounded-full" />
          </View>

          {/* Header Content */}
          <View className="mb-8">
            <Text className="font-display text-2xl font-bold text-primary mb-2">
              Enter the code
            </Text>
            <Text className="font-body text-sm text-on-surface-variant">
              We sent a 6-digit code to
            </Text>
            <Text className="font-body text-base font-medium text-on-surface mt-1">
              {formData.phoneNumber || "+92 ••• •••• 842"}
            </Text>
          </View>

          {/* Code Input Area */}
          <View className="mb-6 flex-row justify-between gap-2">
            {code.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(ref) => {
                  inputRefs.current[idx] = ref;
                }}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(value) => handleInputChange(idx, value)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(idx, nativeEvent.key)
                }
                className={`w-12 h-14 text-center font-display text-2xl bg-surface-white border rounded-lg text-on-surface ${
                  hasError && idx >= 3
                    ? "border-error"
                    : "border-border-subtle"
                }`}
                style={
                  Platform.OS === "web"
                    ? ({ outlineStyle: "none" } as unknown as object)
                    : undefined
                }
              />
            ))}
          </View>

          {/* Error Message */}
          {hasError && (
            <View className="flex-row items-center gap-2 mb-6">
              <Icon name="error" size={16} color="#ba1a1a" fill />
              <Text className="font-body text-xs font-semibold text-error">
                Incorrect code. Please try again.
              </Text>
            </View>
          )}

          {/* Resend Logic */}
          <View className="mb-auto">
            {!canResend ? (
              <View className="flex-row items-center justify-center py-2 h-12">
                <Text className="font-body text-sm text-on-surface-variant">
                  Resend code in{" "}
                </Text>
                <Text className="font-body text-sm font-medium text-primary">
                  0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={handleResend}
                className="w-full h-12 items-center justify-center rounded-full active:bg-surface-container-high"
              >
                <Text className="font-body text-xs font-semibold text-primary">
                  Resend code
                </Text>
              </Pressable>
            )}
          </View>

          <View className="flex-1" />

          {/* Primary CTA */}
          <View className="mt-8 mb-6">
            <Pressable
              onPress={onNext}
              className="w-full h-14 bg-primary-container active:bg-primary rounded-full items-center justify-center active:scale-[0.98]"
            >
              <Text className="text-white font-body text-base font-medium">
                Verify
              </Text>
            </Pressable>
          </View>

          {/* Trust Marker */}
          <View
            className="flex-row justify-center items-center pb-4"
            pointerEvents="none"
            style={{ opacity: 0.5 }}
          >
            <Icon name="verified" size={16} color="#B45309" fill />
            <Text className="ml-1 font-body text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
              Secure Setup
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
