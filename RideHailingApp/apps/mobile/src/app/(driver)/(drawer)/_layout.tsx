import { MaterialIcons } from "@expo/vector-icons";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// Sidebar for the driver app. Everything that isn't one of the 3 primary bottom tabs (Dashboard,
// Earnings, Account -- see (tabs)/_layout.tsx) lives here as a real menu item instead of being
// buried behind a chain of pushes: History, Ratings & Reviews, Notifications, Help Center,
// Settings. Documents (verification-status.tsx) and the profile sub-editors
// (edit-personal-info.tsx, vehicle-profile.tsx) stay reached via Account, same as before -- they're
// profile actions, not global nav destinations, and verification-status.tsx is also used as a
// linear step right after registration, so it stays outside this group rather than becoming a
// drawer-only screen.
//
// Every screen inside this group opens the drawer via `navigation.dispatch(DrawerActions.
// openDrawer())` from its own header icon. That action isn't handled by the Tabs navigator the 3
// tab screens sit inside, so React Navigation bubbles it up to this Drawer automatically -- no
// need to manually reach through `getParent()` from the nested tab screens.

const MENU_ITEMS: {
  route: "history" | "ratings-reviews" | "notifications" | "help-center" | "settings";
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { route: "history", label: "Ride History", icon: "history" },
  { route: "ratings-reviews", label: "Ratings & Reviews", icon: "reviews" },
  { route: "notifications", label: "Notifications", icon: "notifications" },
  { route: "help-center", label: "Help Center", icon: "help-center" },
  { route: "settings", label: "Settings", icon: "settings" },
];

function DriverDrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-surface">
      <View className="gap-1 border-b border-outline-variant/30 px-container-margin pb-stack-md pt-stack-lg">
        <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
          Driver Portal
        </Text>
        <Text className="font-label-sm text-label-sm text-on-surface-variant">Marcus T.</Text>
      </View>

      <View className="gap-1 px-2 pt-stack-sm">
        <Pressable
          onPress={() => navigation.navigate("(tabs)")}
          className={`flex-row items-center gap-4 rounded-lg px-4 py-3 ${
            activeRouteName === "(tabs)" ? "bg-primary-container" : ""
          }`}
        >
          <MaterialIcons name="dashboard" size={22} color={themeColors.primary} />
          <Text className="font-body-md text-body-md font-medium text-on-surface">Dashboard</Text>
        </Pressable>

        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => navigation.navigate(item.route)}
            className={`flex-row items-center gap-4 rounded-lg px-4 py-3 ${
              activeRouteName === item.route ? "bg-primary-container" : ""
            }`}
          >
            <MaterialIcons name={item.icon} size={22} color={themeColors.primary} />
            <Text className="font-body-md text-body-md font-medium text-on-surface">
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function DriverDrawerLayout() {
  return (
    <Drawer
      initialRouteName="(tabs)"
      screenOptions={{ headerShown: false }}
      drawerContent={(props) => <DriverDrawerContent {...props} />}
    >
      <Drawer.Screen name="(tabs)" />
      <Drawer.Screen name="history" />
      <Drawer.Screen name="ratings-reviews" />
      <Drawer.Screen name="notifications" />
      <Drawer.Screen name="help-center" />
      <Drawer.Screen name="settings" />
    </Drawer>
  );
}
