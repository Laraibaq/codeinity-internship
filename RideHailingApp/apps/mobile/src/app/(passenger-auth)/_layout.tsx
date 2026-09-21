import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { themeColors } from "@/constants/theme-colors";

export default function PassengerAuthLayout() {
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  if (isHydrating) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  // If already authenticated as passenger, go to passenger app
  if (isAuthenticated && role === "passenger") {
    return <Redirect href="/(passenger)/home" />;
  }

  // If already authenticated as driver, redirect back to driver app
  if (isAuthenticated && role === "driver") {
    return <Redirect href="/(driver)/(drawer)/(tabs)/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
