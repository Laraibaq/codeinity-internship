import { Pressable, Text, View } from "react-native";

import { themeColors } from "@/constants/theme-colors";

export type LoginMethod = "phone" | "email";

// Extracted from login.tsx's Phone/Email toggle (no source design exists for this control; it was
// originally built there reusing history.tsx's Completed/Cancelled tab-pill pattern) so
// forgot-password.tsx can reuse the exact same component/logic instead of duplicating it.
//
// The active/inactive segment's className is intentionally STATIC (identical on every render) --
// see login.tsx's file header comment for the full root-cause writeup, but in short: NativeWind's
// runtime lazily "upgrades" a component's implementation the first time a style feature appears in
// its resolved className that wasn't present on that component's own first render, and doing so
// remounts it. Interpolating the active-segment classes into the className string meant the
// initially-inactive segment's className changed shape the first time it became active, which
// crashed with a native-only "Couldn't find a navigation context" error. The active/inactive visual
// difference is driven entirely by a plain `style` prop instead, which bypasses that mechanism.
const activeSegmentStyle = {
  backgroundColor: themeColors.surface,
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
};

export function LoginMethodToggle({
  value,
  onChange,
}: {
  value: LoginMethod;
  onChange: (method: LoginMethod) => void;
}) {
  return (
    <View className="flex-row rounded-lg bg-surface-container-high p-1">
      {(["phone", "email"] as const).map((method) => (
        <Pressable
          key={method}
          onPress={() => onChange(method)}
          className="flex-1 items-center rounded-md px-4 py-2"
          style={value === method ? activeSegmentStyle : undefined}
        >
          <Text
            className="font-label-sm text-label-sm"
            style={{
              color: value === method ? themeColors.onSurface : themeColors.secondary,
              fontWeight: value === method ? "700" : "600",
            }}
          >
            {method === "phone" ? "Phone" : "Email"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
