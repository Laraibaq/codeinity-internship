import { Stack } from "expo-router";

// ride-request-notification.tsx, counter-offer.tsx, go-online-confirm.tsx, and
// go-offline-confirm.tsx present as modals (card-style overlays) -- every other screen in this
// stack keeps the default push presentation.
export default function DriverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ride-request-notification" options={{ presentation: "modal" }} />
      <Stack.Screen name="counter-offer" options={{ presentation: "modal" }} />
      <Stack.Screen name="go-online-confirm" options={{ presentation: "modal" }} />
      <Stack.Screen name="go-offline-confirm" options={{ presentation: "modal" }} />
    </Stack>
  );
}
