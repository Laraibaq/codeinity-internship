import React from "react";
import { View, Text, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

export interface PhoneInputProps {
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (number: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  error?: string | null;
  variant?: "filled" | "outline";
  showIcon?: boolean;
  editable?: boolean;
  containerClassName?: string;
  inputHeight?: number;
  autoFocus?: boolean;
}

export function PhoneInput({
  countryCode,
  onCountryCodeChange,
  phoneNumber,
  onPhoneNumberChange,
  placeholder = "Phone number",
  placeholderTextColor = themeColors.outline,
  error,
  variant = "filled",
  showIcon = true,
  editable = true,
  containerClassName = "",
  inputHeight,
  autoFocus = false,
}: PhoneInputProps) {
  const isFilled = variant === "filled";

  // Base styling for each container part
  const boxBg = isFilled
    ? "bg-surface-container-low border border-transparent"
    : "bg-surface border border-outline-variant";

  const heightStyle = inputHeight ? { height: inputHeight } : undefined;

  const handleCountryCodeChange = (text: string) => {
    // Keep only digits, max 4 chars
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    onCountryCodeChange(cleaned);
  };

  const handlePhoneNumberChange = (text: string) => {
    // If user pasted a number with a leading "+", extract country code if present
    if (text.startsWith("+")) {
      const allDigits = text.slice(1).replace(/\D/g, "");
      if (allDigits.length > 10) {
        // e.g. +923001234567 -> country code 92 (2 digits), rest phone
        // or +15551234567 -> country code 1, rest phone
        if (allDigits.startsWith("1") && allDigits.length === 11) {
          onCountryCodeChange("1");
          onPhoneNumberChange(allDigits.slice(1));
          return;
        } else if (allDigits.length >= 11) {
          // guess 2-digit country code
          onCountryCodeChange(allDigits.slice(0, 2));
          onPhoneNumberChange(allDigits.slice(2));
          return;
        }
      }
    }
    onPhoneNumberChange(text);
  };

  return (
    <View className={`w-full ${containerClassName}`}>
      <View className="flex-row items-center gap-2">
        {/* Country Code on the Left */}
        <View
          style={heightStyle}
          className={`h-[52px] min-w-[88px] flex-row items-center justify-center rounded-lg px-3 ${boxBg}`}
        >
          {showIcon ? (
            <MaterialIcons
              name="call"
              size={16}
              color={themeColors.onSurfaceVariant}
              style={{ marginRight: 6 }}
            />
          ) : null}
          <Text className="font-body-md text-body-md font-bold text-on-surface-variant mr-0.5">
            +
          </Text>
          <TextInput
            className="font-body-md text-body-md font-semibold text-on-surface min-w-[28px] p-0"
            value={countryCode}
            onChangeText={handleCountryCodeChange}
            placeholder="1"
            placeholderTextColor={placeholderTextColor}
            keyboardType="phone-pad"
            maxLength={4}
            editable={editable}
            accessibilityLabel="Country code"
          />
        </View>

        {/* Local/National Phone Number on the Right */}
        <View
          style={heightStyle}
          className={`h-[52px] flex-1 flex-row items-center rounded-lg px-4 ${boxBg}`}
        >
          <TextInput
            className="h-full flex-1 font-body-md text-body-md text-on-surface p-0"
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            placeholder={placeholder}
            placeholderTextColor={placeholderTextColor}
            keyboardType="phone-pad"
            editable={editable}
            autoFocus={autoFocus}
            accessibilityLabel="Phone number"
          />
        </View>
      </View>

      {error ? (
        <Text className="mt-1 font-label-sm text-label-sm text-error">{error}</Text>
      ) : null}
    </View>
  );
}
