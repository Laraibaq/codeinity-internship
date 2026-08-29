import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { formatCurrency } from "@/utils/currency";

// Source: "Ride Request Detail". A regular pushed screen (Part 3), not a modal.
//
// Reached only by tapping the request card on ride-request-notification.tsx, which uses `replace`
// (not `push`) to get here -- so this screen sits at the same stack depth the modal occupied,
// directly on top of dashboard.tsx. That's what makes a plain `router.back()` (both the header's
// back arrow and the "Decline" button below) land correctly back on dashboard.tsx instead of
// re-surfacing the notification modal: `replace` already removed the modal from the stack, so
// there's nothing left to pop back into.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("arrow_back", "star", "trip_origin", "location_on") verified against the installed glyph map.
// - The source's dashed curved route `<svg><path>` has no equivalent without adding
//   `react-native-svg` (not installed for this project); substituted with a simplified static
//   rotated dashed line between the two markers, per rule 3's "closest RN pattern" fallback.
// - `radar-pulse`/`animate-pulse` (pickup marker) has no equivalent without animation code beyond a
//   mechanical conversion; renders in its static resting frame.
// - `hover:*` / `transition-*` / `duration-*` dropped throughout: no hover state on touch devices.
//
// Navigation:
// - Accept Ride -> navigate-to-pickup.tsx directly. passenger-accepted.tsx (a brief celebratory
//   hand-off screen this used to go through first) has been deleted -- its content is now folded
//   into navigate-to-pickup.tsx's bottom sheet's collapsed "peek" state instead of being its own
//   screen.
// - Counter -> counter-offer.tsx (modal, shared with the notification screen's Counter button).
// - Decline -> reject-reason.tsx (push), per that screen's batch -- previously called
//   `router.back()` directly (see stack-depth note above for why that landed correctly on
//   dashboard.tsx); reject-reason.tsx's own "Submit Feedback" now does that same dismiss, after
//   collecting a reason first.
//
// Fixed (Root Cause B of this batch): this bottom sheet had no maxHeight and no ScrollView, so on a
// shorter device its content (fare/ETA row, passenger card, 2 trip-detail rows, 3 action buttons)
// could grow taller than the screen and extend above the top edge with no way to reach it. Capped
// at 85% of the screen height and made the middle content scrollable within that cap; the action
// buttons stay pinned below the scrollable area, always visible.
export default function RideRequestDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="bg-surface shadow-sm">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin py-base">
        <Pressable
          onPress={() => router.back()}
          className="items-center justify-center rounded-full p-2 active:scale-95"
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurfaceVariant} />
        </Pressable>
        <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
          Ride Request
        </Text>
        <View className="w-10" />
        </View>
      </View>

      <View className="relative flex-1">
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOpqaDHBoxfEEAoVXNjD9KmLo0WyaYGIwagcCPRC1vAIj_iRV7q80rKH8tjH3vxCJY12aw8mJ0DOrw-d2u_LtrOSR2t8uFLb6NQHtS7rO5RSWiVtHtPy6zpVGMuP9Vd1TtXhfkPQ0fSCuO_jCr7YWORxSPs192eNVFsvmP-RDxB-Vlym8JbsKMy3DLE7HBBJDMJjle5JNS6KMLxPq9d2ChVQif6CWJgNTdppuawBGLoCpukOTJxrWV",
          }}
          resizeMode="cover"
          className="absolute inset-0 h-full w-full"
        />

        <View className="absolute left-[33%] top-[33%] h-4 w-4 items-center justify-center rounded-full border-2 border-surface bg-primary shadow-lg" />
        <View className="absolute left-[66%] top-1/2 h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-on-surface shadow-lg">
          <View className="h-2 w-2 rounded-full bg-surface" />
        </View>
        <View
          className="absolute left-[38%] top-[38%] h-0.5 w-[35%] border border-dashed border-primary"
          style={{ transform: [{ rotate: "35deg" }] }}
        />

        <View
          className="absolute bottom-0 w-full rounded-t-3xl bg-surface px-container-margin pb-6 pt-2 shadow-lg"
          style={{ maxHeight: "85%" }}
        >
          <View className="mx-auto mb-4 h-1 w-10 rounded-full bg-outline-variant" />

          <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mb-6 flex-row items-end justify-between">
            <View>
              <Text className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Estimated Fare
              </Text>
              <Text className="font-fare-display text-fare-display text-on-surface">
                {formatCurrency(15)}
              </Text>
            </View>
            <View className="flex-row gap-3">
              <View className="items-end rounded-full bg-surface-container-low px-3 py-1">
                <Text className="font-label-sm text-label-sm text-on-surface-variant">ETA</Text>
                <Text className="font-bold text-primary">8 mins</Text>
              </View>
              <View className="items-end rounded-full bg-surface-container-low px-3 py-1">
                <Text className="font-label-sm text-label-sm text-on-surface-variant">Dist</Text>
                <Text className="font-bold text-on-surface">2.5 mi</Text>
              </View>
            </View>
          </View>

          <View className="mb-6 flex-row items-center rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA2uUR3sIw9wLUAV0Ig8JM1cWmdzAgZOKGO-n8ZkKdCp4vo10PCXC4wEmV_lhsLnnJVpds_qoJ23izHR-2Yoe_1mDSIZaLWRQnrrmTLuMpOCV-G7CCcPBaTz15yxfrqmLCppOZ2L-HajIUOEfOZiIUgCeJfgW41JxKXHDSVR_fuZQuGPJCL3G2IxsAazdPgaou0S0EFz142PoDaPKmQW0XP5VO1DV656OX2bIzCvQJRS2KqExbgP48S",
              }}
              resizeMode="cover"
              className="mr-4 h-14 w-14 rounded-full"
            />
            <View className="flex-1">
              <Text className="text-lg font-bold text-on-surface">Alex Johnson</Text>
              <View className="mt-1 flex-row items-center text-on-surface-variant">
                <MaterialIcons
                  name="star"
                  size={14}
                  color={themeColors.onSurfaceVariant}
                  style={{ marginRight: 4 }}
                />
                <Text className="font-label-sm text-label-sm text-on-surface-variant">4.92</Text>
                <Text className="mx-2 text-outline-variant">•</Text>
                <Text className="font-label-sm text-label-sm text-on-surface-variant">
                  New Rider
                </Text>
              </View>
            </View>
          </View>

          <View className="mb-8 gap-4">
            <View className="flex-row items-start">
              <MaterialIcons
                name="trip-origin"
                size={20}
                color={themeColors.primary}
                style={{ marginTop: 2, marginRight: 12 }}
              />
              <View>
                <Text className="font-label-sm text-label-sm text-on-surface-variant">Pickup</Text>
                <Text className="font-medium text-on-surface">123 Market St.</Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <MaterialIcons
                name="location-on"
                size={20}
                color={themeColors.onSurface}
                style={{ marginTop: 2, marginRight: 12 }}
              />
              <View>
                <Text className="font-label-sm text-label-sm text-on-surface-variant">Dropoff</Text>
                <Text className="font-medium text-on-surface">456 Embarcadero</Text>
              </View>
            </View>
          </View>
          </ScrollView>

          <View className="mt-auto flex-row flex-wrap gap-3">
            <Pressable
              onPress={() => router.push("/(driver)/navigate-to-pickup")}
              className="w-full items-center justify-center rounded-xl bg-primary py-4 shadow-md active:scale-95"
            >
              <Text className="font-bold text-on-primary">Accept Ride</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(driver)/counter-offer")}
              className="flex-1 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-high py-3 active:scale-95"
            >
              <Text className="font-semibold text-on-surface">Counter</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(driver)/reject-reason")}
              className="flex-1 items-center justify-center rounded-xl bg-error-container py-3 active:scale-95"
            >
              <Text className="font-semibold text-on-error-container">Decline</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
