import { Image, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// Source: "Active Ride" (Part 6). Reached by pushing from navigate-to-pickup.tsx's "I've Arrived".
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("menu", "security", "navigation", "schedule", "directions", "chat", "call", "star",
//   "chevron_right") verified against the installed glyph map.
// - The map's top gradient (`.map-gradient`, ensuring header legibility over a busy map) is
//   functional, not decorative -- substituted with `expo-linear-gradient`'s <LinearGradient>, same
//   policy as this project's other load-bearing gradients.
// - `animate-ping` (driver location marker) has no equivalent without animation code beyond a
//   mechanical conversion; renders in its static resting frame.
// - `hover:*` / `transition-*` / `duration-*` dropped throughout: no hover state on touch devices.
//
// The header's "security" icon (shield) is wired to safety-center.tsx -- this is the SOS entry
// point that screen's own header comment flagged as "not built yet" when it was created; it now
// exists. The "menu" icon on the opposite side is left inert with a TODO: no destination was
// specified for it, and unlike the (tabs) screens' hamburger-> settings.tsx convention, this is a
// focused mid-ride screen, not a tab root, so guessing the same destination isn't a safe carryover.
//
// Rule 5 approved presentation state / left inert (not guessed):
// - The map is a static placeholder image, not real GPS/routing -- separate backend/Mapbox wiring.
// - The "directions" icon button (route header) is inert with a TODO: no alternate-route action
//   exists yet.
// - Chat/Call buttons are inert with TODOs: no messaging screen or telephony wired, same as
//   navigate-to-pickup.tsx.
//
// "Swipe to Start Ride" per this batch's explicit instruction: the source drags a handle via mouse/
// touch events with no RN equivalent without `react-native-gesture-handler` (installed, but wiring
// a real pan gesture is out of scope for this pass) -- rendered as a static, visually-identical
// control that's TAPPABLE instead of swipeable. TODO: replace with real gesture-handler swipe logic.
//
// On tap it goes straight to ride-completed.tsx. This is a deliberate, flagged shortcut: there's no
// "trip in progress / navigating to dropoff" screen in this app yet, so a real product would need
// that state between "ride started" and "ride completed." Skipping straight to completion here is
// for demo/testing purposes only, not a real product decision -- the missing screen still needs to
// be designed and built.
export default function ActiveRideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="h-screen w-full flex-1 bg-background">
      {/* Fixed (global safe-area audit): was pinned at `top-0` with only `py-base` (8px) of its own
          padding, which sat under the status bar/notch on real devices. */}
      <View
        style={{ paddingTop: insets.top }}
        className="absolute left-0 top-0 z-50 w-full flex-row items-center justify-between px-container-margin py-base"
      >
        {/* This screen sits outside the Dashboard/Earnings/Account drawer entirely (a focused
            mid-ride flow, not part of that navigator's tree), so this icon can't literally open
            that sidebar from here -- there's no ancestor path for the action to bubble to. Wired
            to return to the Dashboard instead (same real-world intent as "menu": step out of this
            focused screen back to the main app shell), rather than leaving it dead. */}
        <Pressable
          onPress={() =>
            router.dismissTo({ pathname: "/(driver)/(drawer)/(tabs)/dashboard", params: { status: "online" } })
          }
          className="h-10 w-10 items-center justify-center rounded-full bg-surface shadow-md active:scale-95"
        >
          <MaterialIcons name="menu" size={24} color={themeColors.onSurface} />
        </Pressable>
        <View className="flex-row items-center gap-2 rounded-full bg-surface px-4 py-2 shadow-md">
          <View className="h-2 w-2 rounded-full bg-primary" />
          <Text className="font-label-sm text-label-sm uppercase text-primary">Online</Text>
        </View>
        <Pressable
          onPress={() => router.push("/(driver)/safety-center")}
          className="h-10 w-10 items-center justify-center rounded-full bg-error-container shadow-md active:scale-95"
        >
          <MaterialIcons name="security" size={24} color={themeColors.onErrorContainer} />
        </Pressable>
      </View>

      <View className="relative z-0 flex-1">
        <View className="absolute inset-0 items-center justify-center overflow-hidden bg-surface-variant">
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgA_JMRXxqsIiwuFN4FCYeYLbhV8nUpLSb4eR69v2UvSWj7iZe6SW9oDnX9BrBSg43rZN-6ujyEkM_cRmDfCnS7PqMldz34Mt88pF1LsJAicrTATPLFJHrLRGPieP4zYe05sV1MHZgHb5zrUqy_-ksBWi7FR6Zw2eKcXFNzpNJWGrH9kdW3Me4ZK4oGr1iwk4kIXdRK5C9irqzgIClPZ10PQwn0fsfTEjieabPOXRkvxqebEaq-iO6",
              }}
              resizeMode="cover"
              className="h-full w-full opacity-60"
          />

          <View className="absolute left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-surface shadow-lg">
              <MaterialIcons
                name="navigation"
                size={18}
                color={themeColors.primary}
                style={{ transform: [{ rotate: "45deg" }] }}
              />
            </View>
          </View>

          <View className="absolute left-2/3 top-1/4 -translate-x-1/2 -translate-y-1/2 items-center">
            <View className="mb-2 flex-row items-center gap-1 rounded-full bg-inverse-surface px-3 py-1 shadow-md">
              <MaterialIcons name="schedule" size={14} color={themeColors.inverseOnSurface} />
              <Text className="font-label-sm text-label-sm text-inverse-on-surface">12 min</Text>
            </View>
            <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-inverse-surface bg-surface shadow-lg">
              <View className="h-3 w-3 rounded-sm bg-inverse-surface" />
            </View>
          </View>

          <LinearGradient
            colors={["rgba(249,249,255,0.8)", "rgba(249,249,255,0)"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: 128 }}
            pointerEvents="none"
          />
        </View>
      </View>

      <View className="absolute bottom-0 left-0 z-40 w-full md:bottom-container-margin md:left-container-margin md:w-[400px]">
        <View className="flex-col overflow-hidden rounded-t-3xl border border-outline-variant/30 bg-surface shadow-lg md:rounded-3xl">
          <View className="w-full items-center pb-1 pt-3">
            <View className="h-1 w-10 rounded-full bg-outline-variant/50" />
          </View>

          <View className="border-b border-surface-container-highest px-container-margin pb-4 pt-4">
            <View className="mb-1 flex-row items-start justify-between">
              <View>
                <Text className="mb-1 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                  Heading to Pier 39
                </Text>
                <View className="flex-row items-center gap-1">
                  <Text className="font-bold text-primary">12 mins</Text>
                  <Text className="font-body-md text-body-md text-on-surface-variant"> • 2.4 miles</Text>
                </View>
              </View>
              {/* TODO: no alternate-route action exists yet. */}
              <Pressable className="h-12 w-12 items-center justify-center rounded-full bg-surface-container active:scale-95">
                <MaterialIcons name="directions" size={24} color={themeColors.onSurface} />
              </Pressable>
            </View>
          </View>

          <View className="flex-row items-center justify-between border-b border-surface-container-highest px-container-margin py-4">
            <View className="flex-row items-center gap-3">
              <View className="relative">
                <View className="h-12 w-12 overflow-hidden rounded-full bg-surface-container-highest">
                  <Image
                    source={{
                      uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxq8Ir_o7W7dYfiUDv1x5v6bZLkKkVxsyfdnOxvdUy--SiXR_0o52tdnJFfncf_w31l7O1lwOShJws6jYK5xq-fKtd7fXXSMykjyS-u8d5eTHoXDtP7AX5pA2XsA-oTfecEpK2lu8llL8oJv-5_6ol4mkNpSJPQy1LI1dGMbMa9wMQgItzOTXg1W3CZJ_a_ZYkozUSJRJaymudRu0EZFZeHNR5b5JEip2nq3lOLSm20JS7ejq9RjHm",
                    }}
                    resizeMode="cover"
                    className="h-full w-full"
                  />
                </View>
                <View className="absolute -bottom-1 -right-1 h-5 w-5 items-center justify-center rounded-full bg-surface shadow-sm">
                  <MaterialIcons name="star" size={12} color={themeColors.tertiary} />
                </View>
              </View>
              <View>
                <Text className="text-[16px] font-label-sm leading-tight text-on-surface">
                  Alex M.
                </Text>
                <View className="mt-0.5 flex-row items-center gap-1 text-on-surface-variant">
                  <Text className="text-[12px] font-medium">4.9</Text>
                  <View className="h-1 w-1 rounded-full bg-outline-variant" />
                  <Text className="text-[12px]">Comfort</Text>
                </View>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              {/* TODO: no in-app messaging screen exists yet. */}
              <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-outline-variant/50 bg-surface-container-low active:scale-95">
                <MaterialIcons name="chat" size={20} color={themeColors.onSurface} />
              </Pressable>
              {/* TODO: no telephony wired. */}
              <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-outline-variant/50 bg-surface-container-low active:scale-95">
                <MaterialIcons name="call" size={20} color={themeColors.onSurface} />
              </Pressable>
            </View>
          </View>

          <View className="bg-surface-bright px-container-margin py-stack-md">
            {/* Fixed, per explicit request: was a fake "swipe" control (a static tap-target
                standing in for a real drag gesture that was never built) -- now a real button,
                same as every other primary action in this app. Tapping this still skips a "trip in
                progress" state that doesn't exist yet as a screen; that shortcut is unchanged, only
                the swipe pretense is gone. */}
            <Pressable
              onPress={() => router.push("/(driver)/ride-completed")}
              className="h-14 w-full flex-row items-center justify-center gap-2 rounded-full bg-primary shadow-md active:scale-[0.98]"
            >
              <MaterialIcons name="play-arrow" size={22} color={themeColors.onPrimary} />
              <Text className="font-label-sm text-[14px] uppercase tracking-widest text-on-primary">
                Start Ride
              </Text>
            </Pressable>
            <Text className="mt-3 text-center font-body-md text-[13px] text-on-surface-variant">
              Passenger has been notified of your arrival.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
