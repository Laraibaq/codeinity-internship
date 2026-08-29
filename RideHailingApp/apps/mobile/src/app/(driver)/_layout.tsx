import { Stack } from "expo-router";

// counter-offer.tsx presents as a modal (card-style overlay) -- every other screen in this stack
// keeps the default push presentation.
//
// go-online-confirm.tsx and go-offline-confirm.tsx (both formerly registered here as modals) have
// been deleted entirely: dashboard.tsx's Go Online/Go Offline buttons now flip `status` directly
// with no confirmation step, per explicit instruction (their removal was a pure UX simplification --
// they were investigated and confirmed NOT the cause of a native crash that prompted a separate,
// earlier pass over these same two files).
//
// ride-request-notification.tsx uses "transparentModal" instead of "modal": per explicit
// instruction, its own dark scrim/backdrop-blur was removed so the request card appears to float
// directly on top of the (still fully visible, undimmed) dashboard rather than over a separate
// dimmed screen -- "modal" is opaque and would just show this screen's own flat background color
// where the scrim used to be, not the dashboard underneath. `contentStyle` is set transparent to
// match; the screen's own root view has no opaque background class for the same reason.
export default function DriverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ride-request-notification"
        options={{ presentation: "transparentModal", contentStyle: { backgroundColor: "transparent" } }}
      />
      <Stack.Screen name="counter-offer" options={{ presentation: "modal" }} />
    </Stack>
  );
}
