import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { Pressable } from "react-native";

import { themeColors } from "@/constants/theme-colors";

// Tab bar visual style matches the bottom nav shown consistently across this batch's source HTML
// (Earnings Dashboard, Ride History, Driver Profile): 4 tabs -- Dashboard, Earnings, History,
// Account -- each an icon+label column, with the ACTIVE tab additionally wrapped in a
// `bg-primary-container rounded-full px-5 py-1` pill (inactive tabs are plain `text-secondary`).
//
// Rule 3 substitution: React Navigation's built-in `tabBarActiveBackgroundColor` only fills the
// entire rectangular tab slot, with no way to scope a rounded pill to just the icon+label; a
// custom `tabBarButton` reproduces the source's exact pill shape instead.
//
// The source also gives the active tab's icon `font-variation-settings: 'FILL' 1` (a bolder/filled
// glyph) on top of the pill and color change. The classic Material Icons font MaterialIcons wraps
// has no variable fill weight (unlike Material Symbols) -- every glyph is a single fixed style --
// so that part of the source's active-state treatment has no equivalent here; the pill background
// and tint-color swap (already implemented) carry the "active" signal on their own instead.
function TabBarButton({ children, onPress, accessibilityState }: BottomTabBarButtonProps) {
  const focused = accessibilityState?.selected ?? false;
  return (
    // Only children/onPress/accessibilityState are forwarded (not the rest of
    // BottomTabBarButtonProps): it's typed against PlatformPressable, whose `ref` type doesn't
    // match plain RN Pressable's, so spreading the remaining props onto Pressable fails to typecheck.
    <Pressable
      onPress={onPress}
      accessibilityState={accessibilityState}
      className={`flex-1 items-center justify-center py-1 active:scale-90 ${
        focused ? "mx-2 rounded-full bg-primary-container" : ""
      }`}
    >
      {children}
    </Pressable>
  );
}

export default function DriverTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.onPrimaryContainer,
        tabBarInactiveTintColor: themeColors.secondary,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600", letterSpacing: 0.6 },
        tabBarStyle: {
          backgroundColor: themeColors.surface,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          height: 64,
          paddingTop: 8,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarButton: (props) => <TabBarButton {...props} />,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color }) => <MaterialIcons name="payments" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <MaterialIcons name="history" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
