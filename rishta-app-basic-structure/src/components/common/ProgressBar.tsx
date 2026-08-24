import React from "react";
import { View } from "react-native";

interface Props {
  /** Total number of segments to render. */
  total: number;
  /** How many segments are considered "completed / active". */
  current: number;
  /** Optional wrapper class (spacing, padding). */
  className?: string;
}

/**
 * Multi-segment progress bar used at the top of most onboarding screens.
 */
export const ProgressBar: React.FC<Props> = ({ total, current, className }) => (
  <View className={`w-full flex-row gap-1 ${className ?? ""}`}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        className={`h-1 flex-1 rounded-full ${
          i < current ? "bg-primary" : "bg-surface-container-highest"
        }`}
      />
    ))}
  </View>
);
