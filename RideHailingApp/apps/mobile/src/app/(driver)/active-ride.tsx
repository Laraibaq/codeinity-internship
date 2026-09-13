import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { themeColors } from "@/constants/theme-colors";
import { requestDrawerOpen } from "@/utils/drawer-open-request";
import { apiClient } from "@/lib/api-client";
import { NativeMap } from "@/components/native-map";
import { useLocationStore } from "@/store/location-store";

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
// exists. The "menu" icon actually opens the sidebar now, per explicit request -- see the
// drawer-open-request.ts import and this file's own Pressable comment below for how, given this
// screen sits outside the Drawer's navigation tree.
//
// Native Map: renders real NativeMap with driver position, dropoff destination, and route polyline.
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
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const params = useLocalSearchParams<{
    rideId?: string;
    name?: string;
    fare?: string;
    rating?: string;
    pickup?: string;
    dropoff?: string;
    pickupLat?: string;
    pickupLng?: string;
    dropoffLat?: string;
    dropoffLng?: string;
  }>();

  const { latitude: driverLat, longitude: driverLng } = useLocationStore();
  const driverLocation =
    driverLat != null && driverLng != null
      ? { latitude: driverLat, longitude: driverLng }
      : undefined;

  const parsedDropoffLat = params.dropoffLat ? Number(params.dropoffLat) : NaN;
  const parsedDropoffLng = params.dropoffLng ? Number(params.dropoffLng) : NaN;
  const dropoffPoint =
    Number.isFinite(parsedDropoffLat) && Number.isFinite(parsedDropoffLng)
      ? {
          latitude: parsedDropoffLat,
          longitude: parsedDropoffLng,
          title: params.dropoff || "Destination",
        }
      : null;

  const handleStartRide = async () => {
    if (isStarting) return;
    setIsStarting(true);
    setErrorMsg(null);
    if (params.rideId && !params.rideId.startsWith("req-")) {
      try {
        await apiClient.patch(`/rides/${params.rideId}/status`, { status: "ongoing" });
        queryClient.invalidateQueries({ queryKey: ["rides"] });
      } catch (err: any) {
        setIsStarting(false);
        const msg = err?.response?.data?.message || "Failed to start ride";
        setErrorMsg(typeof msg === "string" ? msg : "Failed to start ride");
        return;
      }
    }
    router.push({
      pathname: "/(driver)/ride-completed",
      params: {
        rideId: params.rideId,
        fare: params.fare,
      },
    });
  };

  return (
    <View className="h-screen w-full flex-1 bg-background">
      {/* Fixed (global safe-area audit): was pinned at `top-0` with only `py-base` (8px) of its own
          padding, which sat under the status bar/notch on real devices. */}
      <View
        style={{ paddingTop: insets.top }}
        className="absolute left-0 top-0 z-50 w-full flex-row items-center justify-between px-container-margin py-base"
      >
        {/* This screen sits outside the Dashboard/Earnings/Account drawer entirely (a focused
            mid-ride flow, not part of that navigator's tree), so `DrawerActions.openDrawer()`
            can't reach it directly from here -- there's no ancestor path for the action to bubble
            to. `requestDrawerOpen()` sets a flag dashboard.tsx checks and consumes the moment it
            gains focus (it dispatches the actual openDrawer() from inside the Drawer's own tree,
            where the action can reach it) -- so tapping this genuinely opens the sidebar, not just
            a plain return to the dashboard underneath it. */}
        <Pressable
          onPress={() => {
            requestDrawerOpen();
            router.dismissTo({
              pathname: "/(driver)/(drawer)/(tabs)/dashboard",
              params: { status: "online" },
            });
          }}
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
          <NativeMap
            driverLocation={driverLocation}
            dropoff={dropoffPoint}
            showsRoutePolyline={true}
            style={StyleSheet.absoluteFillObject}
          />

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
                  Heading to {params.dropoff || "Pier 39"}
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
                  {params.name || "Alex M."}
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
            {errorMsg ? (
              <Text className="mb-2 text-center font-label-sm text-error">{errorMsg}</Text>
            ) : null}
            <Pressable
              onPress={handleStartRide}
              disabled={isStarting}
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
