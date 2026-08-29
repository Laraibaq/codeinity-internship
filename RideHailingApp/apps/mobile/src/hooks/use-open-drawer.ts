import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";

// Shared by every screen inside (driver)/(drawer)/ whose header has a menu/settings icon that
// should open the sidebar. `DrawerActions.openDrawer()` isn't handled by a Tabs navigator, so
// React Navigation bubbles it up automatically to the nearest ancestor that can handle it (the
// Drawer) -- this works the same whether the calling screen is a direct Drawer child (settings.tsx,
// history.tsx, ...) or nested one level deeper inside the Tabs (dashboard.tsx, earnings.tsx,
// account.tsx), with no manual `getParent()` walk needed either way.
export function useOpenDrawer() {
  const navigation = useNavigation();
  return () => navigation.dispatch(DrawerActions.openDrawer());
}
