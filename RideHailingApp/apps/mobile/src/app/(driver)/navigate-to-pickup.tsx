import { Image, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// Source: "Navigate to Pickup" (Part 5). No header/back button exists in this source at all -- the
// turn-instruction bar at the top is an overlay on the map, not a navigational app bar -- so none is
// added here either.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("turn_right", "my_location", "volume_up", "chat", "call", "arrow_forward", "star") verified
//   against the installed glyph map.
// - The source's SVG route (`<svg><path>` curve + circle markers) has no equivalent without adding
//   `react-native-svg` (not installed); substituted with a simplified static rotated line between
//   two marker dots, same pattern used on ride-request-detail.tsx.
// - `animate-ping` (user location marker) has no equivalent without animation code beyond a
//   mechanical conversion; renders in its static resting frame.
// - `hover:*` / `transition-*` / `duration-*` / `backdrop-blur-md` (on the turn-instruction bar,
//   purely decorative against a busy map) dropped throughout, matching this project's policy for
//   non-load-bearing blur/hover treatments.
//
// Rule 5 approved presentation state / left inert (not guessed):
// - The map itself is a static placeholder image, not a real map/GPS integration -- that's separate
//   backend/Mapbox wiring per this task's instructions.
// - The call icon button is inert with a TODO: no telephony wired.
// - The chat icon button is inert with a TODO: no in-app messaging screen exists yet.
//
// "I've Arrived" -> active-ride.tsx, per this batch's Part 5 instructions.
//
// Fixed (global safe-area audit): the turn-instruction card's top offset was a fixed `pt-12` (48px),
// which could sit under the status bar/notch on real devices -- offset by `insets.top` too.
export default function NavigateToPickupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="h-screen w-screen flex-1 bg-surface">
      <View className="absolute inset-0 z-0 overflow-hidden bg-surface-container-low">
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaF5Vw6-0J3pkCMtIMeMNEh1CIz-rpi78pRN_V8_3mA9u8hJTwOyCOZPRn6QRKRoNEcTC6Z_BCNaMA-6WLDUC72gNOwuQak0tL2toSqZ2o4pP9DsYAGvcIHw_wFyUmNxB4q52xJQ2Ug85axd50Pa0BcIrVo66SAt1YTPTt4wMezKpTwzk1tc372E2D933dfxt5o4cgPUn4msn-VbwWh1UC7DwtOqOKm9_HrxolBhAt_M3zIX6vd6ih",
          }}
          resizeMode="cover"
          className="h-full w-full opacity-60"
        />
        <View className="absolute bottom-[20%] left-[20%] h-3 w-3 rounded-full border-[0.5px] border-primary bg-white" />
        <View
          className="absolute bottom-[20%] left-[20%] h-0.5 w-[60%] border border-dashed border-primary"
          style={{ transform: [{ rotate: "-30deg" }, { translateY: -60 }] }}
        />
        <View className="absolute right-[20%] top-[20%] h-3 w-3 items-center justify-center rounded-full bg-on-surface" />
      </View>

      <View
        style={{ paddingTop: 48 + insets.top }}
        className="absolute left-0 top-0 z-20 w-full px-4 pb-4"
      >
        <View className="mx-auto max-w-md flex-row items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-lowest bg-opacity-90 p-4 shadow-lg">
          <View className="flex-row items-center gap-4">
            <View className="rounded-full bg-primary-container p-3">
              <MaterialIcons name="turn-right" size={24} color={themeColors.onPrimaryContainer} />
            </View>
            <View>
              <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Turn right
              </Text>
              <Text className="mt-1 font-body-md text-body-md text-on-surface-variant">
                on Market St
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="font-fare-display text-fare-display text-primary">0.2</Text>
            <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              mi
            </Text>
          </View>
        </View>
      </View>

      <View className="absolute right-4 top-1/2 z-20 -translate-y-1/2 gap-4">
        <Pressable className="h-12 w-12 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-lowest shadow-sm active:scale-95">
          <MaterialIcons name="my-location" size={24} color={themeColors.onSurface} />
        </Pressable>
        <Pressable className="h-12 w-12 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-lowest shadow-sm active:scale-95">
          <MaterialIcons name="volume-up" size={24} color={themeColors.onSurface} />
        </Pressable>
      </View>

      <View className="absolute bottom-0 left-0 z-30 w-full">
        <View className="mx-auto max-w-md overflow-hidden rounded-t-3xl border-x border-t border-outline-variant/30 bg-surface-container-lowest px-4 pb-6 pt-2 shadow-lg md:px-6">
          <View className="mx-auto mb-4 h-1 w-10 rounded-full bg-outline-variant/50" />

          <View className="mb-6 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-primary" />
              <Text className="font-fare-display text-fare-display text-on-surface">4 min</Text>
              <Text className="font-body-md text-body-md text-on-surface-variant">away</Text>
            </View>
            <Text className="font-body-md text-body-md text-on-surface-variant">1.2 mi</Text>
          </View>

          <View className="mb-6 flex-row items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <View className="flex-row items-center gap-4">
              <View className="relative">
                <Image
                  source={{
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDKFxyUMeviViwYvb1D85npTLjp3fiS3loR6fzX1-fQ_1pH-I8EKhjQYAP5qRC0lIzzlbGGPPnnlJ24NrxH7K89R-ocr7yCDSp6xl9uH4gXgmeKFUawardSxvuDppBG7EMrQwWIPvWKpaCicjq_MS-XzEmBelbkQSjlKAVnYo7hAHPrBoaR3CCLtcG2B-j2npsLd5Hnm57C5yFg_Qb6udmdwLIUVIv0i_ytgW4RUPLKUV-m92SAygr",
                  }}
                  resizeMode="cover"
                  className="h-14 w-14 rounded-full border-2 border-surface-container-lowest"
                />
                <View className="absolute -bottom-1 -right-1 rounded-full border border-outline-variant/20 bg-surface-container-lowest p-0.5">
                  <MaterialIcons name="star" size={14} color={themeColors.primary} />
                </View>
              </View>
              <View>
                <Text className="text-xl font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                  Sarah
                </Text>
                <View className="flex-row items-center gap-1 text-on-surface-variant">
                  <Text className="font-label-sm text-label-sm text-primary">4.9</Text>
                  <Text className="text-sm text-on-surface-variant opacity-60">•</Text>
                  <Text className="text-sm text-on-surface-variant">Pickup</Text>
                </View>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              {/* TODO: no in-app messaging screen exists yet. */}
              <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-lowest shadow-sm active:scale-95">
                <MaterialIcons name="chat" size={20} color={themeColors.onSurface} />
              </Pressable>
              {/* TODO: no telephony wired. */}
              <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-lowest shadow-sm active:scale-95">
                <MaterialIcons name="call" size={20} color={themeColors.onSurface} />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/(driver)/active-ride")}
            className="w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4 shadow-lg active:scale-[0.98]"
          >
            <Text className="text-lg font-headline-lg-mobile text-headline-lg-mobile text-on-primary">
              I&apos;ve Arrived
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color={themeColors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
