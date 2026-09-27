import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useAuthStore } from "@/store/auth-store";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import "../global.css";

// React Native 0.86 removed StyleSheet.absoluteFillObject in favor of StyleSheet.absoluteFill.
// Polyfill it globally to prevent runtime undefined spread issues.
if (!(StyleSheet as any).absoluteFillObject) {
  (StyleSheet as any).absoluteFillObject = StyleSheet.absoluteFill;
}

function NotificationManager() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 5000,
          },
        },
      }),
  );

  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NotificationManager />
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
