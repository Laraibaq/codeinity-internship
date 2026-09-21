import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { themeColors } from "@/constants/theme-colors";

export default function PassengerLayout() {
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

  // If not authenticated, redirect to passenger auth
  if (!isAuthenticated) {
    return <Redirect href="/(passenger-auth)/welcome" />;
  }

  // Strict isolation: if a driver attempts to access passenger screens, send them to driver app
  if (role === "driver") {
    return <Redirect href="/(driver)/(drawer)/(tabs)/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
