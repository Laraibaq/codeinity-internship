import { Stack } from "expo-router";

import "../global.css";

// `headerShown: false` here, not just on the (driver-auth)/(driver) nested Stacks: a nested Stack's
// own screenOptions only hide headers for screens INSIDE that nested Stack. This root Stack renders
// each route group as its own single screen (its header is a separate, outer header on top of
// whatever the group's own nested Stack renders), so without this, every screen in the app showed a
// second header reading the literal segment name ("(driver-auth)" / "(driver)").
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
