import { useNavigation } from "expo-router";

// Shared by every screen inside (driver)/(drawer)/ whose header has a menu/settings icon that
// should open the sidebar. Dispatches the OPEN_DRAWER action which isn't handled by a Tabs navigator,
// so Expo Router bubbles it up automatically to the nearest ancestor that can handle it (the
// Drawer) -- this works the same whether the calling screen is a direct Drawer child (settings.tsx,
// history.tsx, ...) or nested one level deeper inside the Tabs (dashboard.tsx, earnings.tsx,
// account.tsx), with no manual getParent() walk needed either way.
export function useOpenDrawer() {
  const navigation = useNavigation();
  return () => navigation.dispatch({ type: "OPEN_DRAWER" });
}
