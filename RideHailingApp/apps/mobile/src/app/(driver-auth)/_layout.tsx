import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { themeColors } from "@/constants/theme-colors";

export default function DriverAuthLayout() {
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);
  const verificationStatus = useAuthStore((s) => s.verificationStatus);

  if (isHydrating) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  if (isAuthenticated && role === "driver") {
    if (verificationStatus === "approved") {
      return <Redirect href="/(driver)/(drawer)/(tabs)/dashboard" />;
    }
    return <Redirect href="/(driver)/verification-status" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
