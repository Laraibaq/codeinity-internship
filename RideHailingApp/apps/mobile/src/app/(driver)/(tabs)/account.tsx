import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("menu", "notifications", "edit", "star", "workspace_premium", "person", "directions_car",
//   "description", "reviews", "payments", "chevron_right") verified against the installed glyph
//   map.
// - The card's `absolute top-0 ... bg-gradient-to-b from-primary-container/30 to-transparent` top
//   accent wash is purely decorative (nothing depends on it for legibility, unlike welcome.tsx's
//   image fade or the earlier vehicle-color/vehicle-info screens' functional gradients) -- dropped
//   per this project's standing policy for non-load-bearing gradients.
// - `grid grid-cols-1 md:grid-cols-2` (the menu bento grid) resolves to a single stacked column on
//   a native phone screen (always below `md:`); "Earnings Settings"'s `md:col-span-2` is a
//   desktop-only override that's moot once the grid is already single-column on mobile -- dropped
//   as inert.
// - The avatar's edit badge (bottom-right pencil-in-circle) is left inert per rule 5, same policy
//   as the photo-picker buttons throughout this project -- no expo-image-picker wiring yet.
// - This screen's own bottom-nav-bar markup from the source is NOT reproduced here -- provided
//   once, globally, by the shared `(tabs)/_layout.tsx` Tabs navigator (this batch's Part 1), which
//   also handles which tab is "active" automatically (the source hardcodes "Account" as active
//   here, which the real Tabs navigator now does generically based on the focused route).
// - `hover:*` / `group-hover:*` / `transition-*` / `duration-*` / `focus:ring-2` dropped throughout:
//   no hover/focus-ring state on touch devices.
// - The Documents row's small red status dot (`w-2 h-2 rounded-full bg-error`) is rendered as a
//   static, unconditional indicator, same as every other "badge implies real state we don't compute
//   yet" case in this project (rule 5, UI shell only).
//
// Menu-item wiring per this task's instructions:
// - Personal Information -> register-personal-info.tsx (push)
// - Vehicle Profile -> register-vehicle-type.tsx (push) -- was register-vehicle-info.tsx, deleted
//   when it was removed from the registration flow; register-vehicle-type.tsx is now the first
//   screen of the vehicle section, so it's the closest replacement destination.
// - Documents -> verification-status.tsx (push, default "review" state), per explicit confirmation.
// - Ratings & Reviews -> left inert with a TODO; no screen built yet.
// - Earnings Settings -> left inert with a TODO; per this project's cash-only MVP1 policy, payout-
//   method configuration is explicitly deferred to MVP3 (see src/utils/currency.ts header comment).
// - Header menu icon -> settings.tsx (push).
// - Header notifications bell -> left inert; no destination specified for it anywhere in this task.

export default function DriverAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="w-full bg-surface shadow-sm">
        <View className="w-full flex-row items-center justify-between px-container-margin py-base">
          <Pressable
            onPress={() => router.push("/(driver)/settings")}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="menu" size={24} color={themeColors.primary} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Driver Portal
          </Text>
          {/* TODO: no destination specified for the notifications bell. */}
          <Pressable className="items-center justify-center rounded-full p-2 active:scale-95">
            <MaterialIcons name="notifications" size={24} color={themeColors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-md gap-stack-md px-container-margin py-stack-md pb-32 md:max-w-3xl"
      >
        <View className="items-center overflow-hidden rounded-xl border border-surface-container-highest bg-surface-container-lowest p-stack-md">
          <View className="relative mb-4">
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAF0GSWBN3SEeJvXox-yjlqsaYu_ge4r0Yoo4ksQl-tynj08njY9LW-R8fAszC59erGzQ4DKSPgSUaoNIdKwUwkyc3FnHigbhuWHZvR4wZNMvQYPLdcpTQid3TERcg0Oap8xa6j9E39ZKtoQ4qddhbahI9taSf0IkccQvgnh277w0lsWafsdakhfdFm7dwnVNDGu3-2wO3F_JsZrgi3IAlLIR2Z0cB0gfMruh33yjDJLQxv8z-KXKz6",
              }}
              resizeMode="cover"
              className="h-28 w-28 rounded-full border-4 border-surface-container-lowest"
            />
            <View className="absolute bottom-0 right-0 rounded-full border border-surface-container-highest bg-surface-container-lowest p-1">
              <Pressable className="h-8 w-8 items-center justify-center rounded-full bg-primary">
                <MaterialIcons name="edit" size={16} color={themeColors.onPrimary} />
              </Pressable>
            </View>
          </View>
          <Text className="mb-2 text-center font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">
            Marcus T.
          </Text>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center rounded-full border border-primary-fixed bg-surface-container px-3 py-1.5">
              <MaterialIcons
                name="star"
                size={16}
                color={themeColors.primary}
                style={{ marginRight: 4 }}
              />
              <Text className="font-label-sm text-label-sm text-primary">4.9</Text>
            </View>
            <View className="flex-row items-center rounded-full border border-secondary-fixed bg-secondary-container px-3 py-1.5">
              <MaterialIcons
                name="workspace-premium"
                size={16}
                color={themeColors.onSecondaryContainer}
                style={{ marginRight: 4 }}
              />
              <Text className="font-label-sm text-label-sm font-bold text-on-secondary-container">
                Gold Tier
              </Text>
            </View>
          </View>
        </View>

        <View className="gap-gutter">
          <Pressable
            onPress={() => router.push("/(driver-auth)/register-personal-info")}
            className="w-full flex-row items-center justify-between rounded-xl border border-surface-container-highest bg-surface-container-lowest p-4 shadow-sm active:scale-[0.98]"
          >
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-container">
                <MaterialIcons name="person" size={24} color={themeColors.primary} />
              </View>
              <View>
                <Text className="font-body-md text-body-md font-semibold text-on-surface">
                  Personal Information
                </Text>
                <Text className="font-label-sm text-label-sm font-normal text-on-surface-variant">
                  Update details &amp; contacts
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={themeColors.outline} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/(driver-auth)/register-vehicle-type")}
            className="w-full flex-row items-center justify-between rounded-xl border border-surface-container-highest bg-surface-container-lowest p-4 shadow-sm active:scale-[0.98]"
          >
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-container">
                <MaterialIcons name="directions-car" size={24} color={themeColors.primary} />
              </View>
              <View>
                <Text className="font-body-md text-body-md font-semibold text-on-surface">
                  Vehicle Profile
                </Text>
                <Text className="font-label-sm text-label-sm font-normal text-on-surface-variant">
                  Manage your rides
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={themeColors.outline} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/(driver)/verification-status")}
            className="w-full flex-row items-center justify-between rounded-xl border border-surface-container-highest bg-surface-container-lowest p-4 shadow-sm active:scale-[0.98]"
          >
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-container">
                <MaterialIcons name="description" size={24} color={themeColors.primary} />
              </View>
              <View>
                <Text className="font-body-md text-body-md font-semibold text-on-surface">
                  Documents
                </Text>
                <Text className="font-label-sm text-label-sm font-normal text-on-surface-variant">
                  License &amp; registration
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-error" />
              <MaterialIcons name="chevron-right" size={24} color={themeColors.outline} />
            </View>
          </Pressable>

          {/* TODO: no screen built yet for ratings/reviews. */}
          <Pressable className="w-full flex-row items-center justify-between rounded-xl border border-surface-container-highest bg-surface-container-lowest p-4 shadow-sm active:scale-[0.98]">
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-container">
                <MaterialIcons name="reviews" size={24} color={themeColors.primary} />
              </View>
              <View>
                <Text className="font-body-md text-body-md font-semibold text-on-surface">
                  Ratings &amp; Reviews
                </Text>
                <Text className="font-label-sm text-label-sm font-normal text-on-surface-variant">
                  Rider feedback
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={themeColors.outline} />
          </Pressable>

          {/* TODO: payout-method configuration -- explicitly deferred to MVP3 per the cash-only
              policy (see src/utils/currency.ts header comment). */}
          <Pressable className="w-full flex-row items-center justify-between rounded-xl border border-surface-container-highest bg-surface-container-lowest p-4 shadow-sm active:scale-[0.98]">
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-container">
                <MaterialIcons name="payments" size={24} color={themeColors.primary} />
              </View>
              <View>
                <Text className="font-body-md text-body-md font-semibold text-on-surface">
                  Earnings Settings
                </Text>
                <Text className="font-label-sm text-label-sm font-normal text-on-surface-variant">
                  Payout methods &amp; statements
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={themeColors.outline} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
