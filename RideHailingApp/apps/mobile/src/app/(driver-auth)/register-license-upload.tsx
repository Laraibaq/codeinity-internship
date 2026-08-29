import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// Step indicator added (this screen previously had none): Step 6 of 10, its own unique number --
// previously shared Step 5 with register-license-details.tsx, but that sharing was fixed as a
// step-numbering bug (see register-identity-document.tsx's header comment for the full new order).
// Also wrapped in a ScrollView per this batch's scroll audit (Root Cause B): modest content today,
// but consistent with every other screen in this flow now that one's been added anyway.
//
// Flow reorder: Continue now goes to register-vehicle-type.tsx directly (was register-vehicle-info)
// -- register-vehicle-info.tsx was removed from the registration flow entirely (deleted; its Year of
// Manufacture field moved into register-vehicle-model.tsx). See register-identity-document.tsx's
// header comment for the full new order.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this batch (glyph names
//   verified against the installed glyph map; "add_photo_alternate" -> "add-photo-alternate" as
//   used elsewhere).
// - `docked full-width top-0` on the header is the same inert non-Tailwind-word artifact seen
//   elsewhere in this project -- dropped silently, zero effect either way.
// - `hover:*` / `group-hover:*` / `transition-colors` / `transition-shadow` / `duration-*` dropped
//   throughout: no hover state on touch devices, no RN equivalent for CSS transitions.
// - Each upload card is a `<label>` wrapping a hidden `<input type="file">`; rendered as a
//   Pressable per rule 2. Per this task's rule 5, these are the designated inert upload buttons --
//   no expo-image-picker wiring, no onPress handler, rendered exactly in their default "Pending"
//   appearance (the status pill is static, not conditional state).
// - The two-part status pill (dot + "Pending" label) has no interactivity in the source itself
//   (nothing ever changes it to a different status) -- rendered as-is, unconditionally.
// - This screen's Continue button is `disabled` in the source (bg-surface-container-high,
//   text-on-surface-variant, cursor-not-allowed) because in the live app it only enables once both
//   photos are uploaded -- a real-validation concern out of scope for this static UI shell.
//   Same precedent as register-profile-photo.tsx's tertiary-colored Continue button: kept the
//   literal disabled-look styling (this screen's default/pending appearance, per rule 5's explicit
//   instruction not to fake an "uploaded" state), but rendered always-tappable rather than actually
//   `disabled` so the CTA can still navigate per this task's routing table.

export default function DriverRegisterLicenseUploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 items-center bg-background">
      <View style={{ paddingTop: insets.top }} className="w-full max-w-[400px] bg-surface">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={16} color={themeColors.primary} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Driver Registration
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="w-full max-w-[400px] gap-2 px-container-margin pb-stack-sm pt-stack-md">
        <View className="flex-row items-center justify-between">
          <Text className="font-label-sm text-label-sm text-on-surface-variant">Step 6 of 10</Text>
          <Text className="font-label-sm text-label-sm font-bold text-primary">License Upload</Text>
        </View>
        <View className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <View className="h-full rounded-full bg-primary" style={{ width: "60%" }} />
        </View>
      </View>

      <ScrollView
        className="w-full max-w-[400px] flex-1"
        contentContainerClassName="flex-grow gap-stack-lg px-container-margin py-stack-md"
      >
        <View className="gap-stack-sm">
          <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Upload Driving License
          </Text>
          <Text className="font-body-md text-body-md text-on-surface-variant">
            Please provide clear photos of both the front and back of your valid driving license.
          </Text>
        </View>

        <View className="gap-stack-md">
          <Pressable className="relative items-center gap-stack-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-surface-container-low">
              <MaterialIcons name="add-photo-alternate" size={30} color={themeColors.primary} />
            </View>
            <View className="items-center">
              <Text className="font-label-sm text-label-sm text-on-surface">
                Front of License
              </Text>
              <Text className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Tap to upload or take photo
              </Text>
            </View>
            <View className="absolute right-4 top-4 flex-row items-center gap-1 rounded-full bg-surface-container-high px-3 py-1">
              <View className="h-2 w-2 rounded-full bg-outline" />
              <Text className="font-label-sm text-label-sm text-on-surface-variant">Pending</Text>
            </View>
          </Pressable>

          <Pressable className="relative items-center gap-stack-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-surface-container-low">
              <MaterialIcons name="add-photo-alternate" size={30} color={themeColors.primary} />
            </View>
            <View className="items-center">
              <Text className="font-label-sm text-label-sm text-on-surface">Back of License</Text>
              <Text className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Tap to upload or take photo
              </Text>
            </View>
            <View className="absolute right-4 top-4 flex-row items-center gap-1 rounded-full bg-surface-container-high px-3 py-1">
              <View className="h-2 w-2 rounded-full bg-outline" />
              <Text className="font-label-sm text-label-sm text-on-surface-variant">Pending</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <View className="w-full max-w-[400px] border-t border-outline-variant bg-surface p-container-margin pb-stack-lg">
        <Pressable
          onPress={() => router.push("/(driver-auth)/register-vehicle-type")}
          className="h-14 w-full items-center justify-center rounded-xl bg-surface-container-high"
        >
          <Text className="font-label-sm text-label-sm text-on-surface-variant">Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}
