import React from "react";
import { View, TextInput, Pressable, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

export interface LocationSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}

export function LocationSearch({
  value,
  onChangeText,
  placeholder = "Search destination or address...",
  onClear,
  onSubmit,
  autoFocus = false,
}: LocationSearchProps) {
  return (
    <View className="flex-row items-center bg-surface-container rounded-2xl px-3 py-2 border border-outline-variant/30">
      <MaterialIcons name="search" size={22} color={themeColors.secondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={themeColors.secondary}
        autoFocus={autoFocus}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        className="flex-1 ml-2 text-on-surface text-base py-1"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => {
            onChangeText("");
            onClear?.();
          }}
          className="p-1 active:scale-90"
        >
          <MaterialIcons name="close" size={18} color={themeColors.secondary} />
        </Pressable>
      )}
    </View>
  );
}
