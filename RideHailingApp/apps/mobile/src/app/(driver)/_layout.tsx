import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { themeColors } from "@/constants/theme-colors";

export default function DriverLayout() {
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

  if (!isAuthenticated || role !== "driver") {
    return <Redirect href="/(driver-auth)/welcome" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="counter-offer"
        options={{ presentation: "transparentModal", contentStyle: { backgroundColor: "transparent" } }}
      />
    </Stack>
  );
}
