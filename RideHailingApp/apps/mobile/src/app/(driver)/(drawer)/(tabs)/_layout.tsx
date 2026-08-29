import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { Pressable } from "react-native";

import { themeColors } from "@/constants/theme-colors";

// Bottom tab bar trimmed to the 3 screens a driver checks constantly -- Dashboard (map/status),
// Earnings (money), Account (profile). History moved out to the sidebar (this group's parent
// Drawer, see (drawer)/_layout.tsx): it's a look-back action, not something checked every few
// minutes the way these three are, so it fits better as a menu item than a 4th persistent tab.
//
// Rule 3 substitution: React Navigation's built-in `tabBarActiveBackgroundColor` only fills the
// entire rectangular tab slot, with no way to scope a rounded pill to just the icon+label; a
// custom `tabBarButton` reproduces that pill shape instead.
//
// className below is static (not interpolated into a template literal): a conditionally-shaped
// className triggers a lazy component "upgrade" + remount that crashes native navigation, the same
// NativeWind runtime anti-pattern root-caused on login.tsx's phone/email toggle. The
// focused-dependent background/margin/radius moves to a plain `style` prop instead.
const focusedTabStyle = {
  marginHorizontal: 8,
  borderRadius: 9999,
  backgroundColor: themeColors.primaryContainer,
};

function TabBarButton({ children, onPress, accessibilityState }: BottomTabBarButtonProps) {
  const focused = accessibilityState?.selected ?? false;
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={accessibilityState}
      className="flex-1 items-center justify-center py-1 active:scale-90"
      style={focused ? focusedTabStyle : undefined}
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
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
