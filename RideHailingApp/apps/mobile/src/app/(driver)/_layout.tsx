import { Stack } from "expo-router";

// go-online-confirm.tsx and go-offline-confirm.tsx (both formerly registered here as modals) have
// been deleted entirely: dashboard.tsx's Go Online/Go Offline buttons now flip `status` directly
// with no confirmation step, per explicit instruction (their removal was a pure UX simplification --
// they were investigated and confirmed NOT the cause of a native crash that prompted a separate,
// earlier pass over these same two files).
//
// ride-request-notification.tsx and ride-request-detail.tsx have also been deleted entirely: their
// content (passenger info, offer, pickup/dropoff, Accept/Counter/Reject) now renders as inline cards
// directly on dashboard.tsx's "online" state instead of a separate popup + pushed detail screen.
//
// nearby-requests.tsx has also been deleted entirely, fully superseded by those same inline request
// cards -- it never had a Stack.Screen entry here (plain push presentation), so there was no
// registration to remove, only the file and dashboard.tsx's "Nearby" button that opened it.
//
// counter-offer.tsx uses "transparentModal" instead of "modal": per explicit instruction, it should
// render as ONLY its bottom-sheet card with no header/screen chrome, showing whichever screen opened
// it (now dashboard.tsx's inline request cards) dimmed behind it rather than a blank opaque
// background. `contentStyle` is set transparent to match; the screen itself draws its own dark scrim
// over the transparent gap so the dashboard reads as dimmed, not fully undimmed.
export default function DriverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="counter-offer"
        options={{ presentation: "transparentModal", contentStyle: { backgroundColor: "transparent" } }}
      />
    </Stack>
  );
}
