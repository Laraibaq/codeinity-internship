import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// Entry point: active-ride.tsx's header "security" (shield) icon, per that screen's ride-flow
// batch -- this was previously reachable only via manual URL/deep-link before that screen existed.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("menu", "notifications", "warning", "arrow_forward", "contacts", "share_location",
//   "person_off", "lightbulb") verified against the installed glyph map.
// - The desktop nav drawer (`hidden md:flex`) is dropped: always below the `md:` breakpoint on a
//   native phone screen, same treatment as every screen in this project with a mobile/desktop
//   split.
// - This screen assumes the same persistent hamburger-drawer navigation shell as every other
//   screen in this batch's source, which this app doesn't have (no drawer navigator exists). Per
//   explicit correction, the header's menu icon is now a real back arrow calling `router.back()`
//   instead: this screen is reached via push (not a drawer toggle), so a menu icon implying a
//   drawer was a genuine UX mismatch, not just a fidelity gap -- unlike the earlier call to keep it
//   literal, this one's a real functional fix. Same treatment applied to settings.tsx.
// - The source's bottom nav bar (which its own HTML comment says deliberately "replaced Account
//   with Safety" to show this screen as active) is removed entirely, not reproduced: Safety Center
//   is a Stack screen OUTSIDE the (tabs) group, not a 5th real tab, so every item in that bar would
//   have been inert dead chrome. The back arrow is this screen's only navigation now.
// - `animate-pulse-red`/`.slide-glow` (the SOS thumb's pulsing glow) and the drag-to-slide `<script>`
//   have no RN equivalent without Reanimated/gesture-handler (not installed for this); per rule 5
//   and this task's explicit instruction, the slider renders as a static element at its resting
//   (undragged) position, with a TODO for the real slide-gesture + telephony wiring.
// - `hover:*` / `group-hover:*` / `transition-*` / `duration-*` / `hover:-translate-y-1` dropped
//   throughout: no hover state on touch devices.

export default function DriverSafetyCenterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="w-full bg-surface shadow-sm">
        <View className="w-full flex-row items-center justify-between px-container-margin py-base">
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurfaceVariant} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Safety Center
          </Text>
          {/* TODO: no destination specified for the notifications bell. */}
          <Pressable className="items-center justify-center rounded-full p-2 active:scale-95">
            <MaterialIcons name="notifications" size={24} color={themeColors.onSurfaceVariant} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-2xl gap-stack-md px-container-margin py-stack-md pb-32"
      >
        <View className="items-center justify-center rounded-xl border border-error/20 bg-error-container p-6 shadow-sm">
          <View className="mb-stack-sm items-center">
            <MaterialIcons
              name="warning"
              size={36}
              color={themeColors.error}
              style={{ marginBottom: 8 }}
            />
            <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-error-container">
              Emergency SOS
            </Text>
            <Text className="mt-1 text-center font-body-md text-body-md text-on-error-container">
              Slide to alert authorities and safety team.
            </Text>
          </View>

          {/* TODO: real slide-gesture + telephony (call 911) wiring needed; static placeholder for
              now, per explicit instruction. */}
          <View className="h-16 w-full max-w-sm flex-row items-center rounded-full border border-error/10 bg-surface-container-lowest p-2">
            <View className="absolute left-2 h-12 w-12 items-center justify-center rounded-full bg-error shadow-md">
              <MaterialIcons name="arrow-forward" size={24} color={themeColors.onError} />
            </View>
            <View className="flex-1 items-center" pointerEvents="none">
              <Text
                className="pl-10 font-label-sm text-label-sm uppercase tracking-widest text-error"
                style={{ opacity: 0.6 }}
              >
                Slide to Call 911
              </Text>
            </View>
          </View>
        </View>

        <Text className="px-2 pt-4 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
          Safety Tools
        </Text>

        <View className="gap-gutter">
          {/* TODO: no screen built yet for Emergency Contacts. */}
          <Pressable className="gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-container">
              <MaterialIcons name="contacts" size={24} color={themeColors.primary} />
            </View>
            <View>
              <Text className="mb-1 text-[20px] font-bold text-on-surface">
                Emergency Contacts
              </Text>
              <Text className="font-body-md text-body-md text-secondary">
                2 contacts set. We&apos;ll notify them if an issue is detected.
              </Text>
            </View>
          </Pressable>

          {/* TODO: no screen built yet for Share Trip Status. */}
          <Pressable className="gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-variant">
              <MaterialIcons name="share-location" size={24} color={themeColors.onSurfaceVariant} />
            </View>
            <View>
              <Text className="mb-1 text-[20px] font-bold text-on-surface">
                Share Trip Status
              </Text>
              <Text className="font-body-md text-body-md text-secondary">
                Live share your route and ETA with trusted contacts.
              </Text>
            </View>
          </Pressable>

          {/* TODO: no screen built yet for Report a Passenger. */}
          <Pressable className="gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-variant">
              <MaterialIcons name="person-off" size={24} color={themeColors.onSurfaceVariant} />
            </View>
            <View>
              <Text className="mb-1 text-[20px] font-bold text-on-surface">
                Report a Passenger
              </Text>
              <Text className="font-body-md text-body-md text-secondary">
                Discreetly log an incident or uncomfortable behavior.
              </Text>
            </View>
          </Pressable>

          {/* TODO: no screen built yet for Safety Tips. */}
          <Pressable className="gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-variant">
              <MaterialIcons name="lightbulb" size={24} color={themeColors.onSurfaceVariant} />
            </View>
            <View>
              <Text className="mb-1 text-[20px] font-bold text-on-surface">Safety Tips</Text>
              <Text className="font-body-md text-body-md text-secondary">
                Best practices for late-night driving and secure pickups.
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
