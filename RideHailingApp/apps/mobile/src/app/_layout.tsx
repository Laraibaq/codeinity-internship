import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import "../global.css";

// `headerShown: false` here, not just on the (driver-auth)/(driver) nested Stacks: a nested Stack's
// own screenOptions only hide headers for screens INSIDE that nested Stack. This root Stack renders
// each route group as its own single screen (its header is a separate, outer header on top of
// whatever the group's own nested Stack renders), so without this, every screen in the app showed a
// second header reading the literal segment name ("(driver-auth)" / "(driver)").
//
// GestureHandlerRootView wrapper added for navigate-to-pickup.tsx's PanGestureHandler-driven bottom
// sheet: react-native-gesture-handler was already a project dependency but had never actually been
// wired up anywhere (only referenced in a few "no RN equivalent without this package" comments) --
// this is the first screen to use it. Gesture Handler requires the app's root view to be wrapped in
// GestureHandlerRootView for its gesture recognizers to work correctly (most critically on Android),
// so it belongs here at the top of the tree rather than on the one screen that happens to need it.
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
