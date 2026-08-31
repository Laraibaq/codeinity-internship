import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { useDocumentUpload } from "@/hooks/use-document-upload";

// Flow reorder: Continue now goes to register-identity-document.tsx (was
// register-license-details.tsx) -- Identity Document moved earlier in the registration sequence,
// ahead of License Details/Upload. See register-identity-document.tsx's header comment for the
// full new order.
//
// Fixed (global safe-area audit): the header now carries top-safe-area padding via
// `useSafeAreaInsets()` -- see _layout.tsx's header comment for why this became necessary.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this batch. Explicit
//   text-size classes map directly (text-6xl -> 60, text-3xl -> 30, text-xl -> 20); the checklist
//   icons have no explicit size class and inherit the <ul>'s text-body-md (16px) context.
// - `sticky top-0` on the header (not `fixed`, unlike the Personal Info screen) has no RN
//   equivalent; substituted the same way as register.tsx: kept as a normal sibling above a
//   <ScrollView> rather than absolutely positioned, since the source's own `main` has
//   `overflow-y-auto` (a genuinely scrollable region: stepper + text + photo + guidelines card +
//   two action rows can exceed a phone viewport).
// - `md:shadow-none` / `sm:flex-row` dropped: breakpoint overrides with no equivalent on a native
//   phone screen already below those breakpoints; kept the base mobile values (`shadow-sm`,
//   `flex-col`).
// - The photo circle's `group-hover:opacity-100` edit overlay has no hover state on touch devices,
//   so it renders in its resting (opacity: 0, invisible) state -- same policy as every other
//   `hover:`/`group-hover:` case in this batch. Worth flagging specifically here (rather than just
//   noting and moving on) because this hover effect is the *only* way the source conveys "tap the
//   photo to edit it" -- on a touch device that affordance is simply never shown. It isn't a total
//   loss of function though: the always-visible camera badge button below the circle is a separate,
//   non-hover-gated way to trigger the same action.
// - The "Continue" button uses `bg-tertiary-container`/`text-on-tertiary-container`, not the
//   `bg-primary` used by every other primary CTA in this batch, plus `disabled:opacity-50
//   disabled:cursor-not-allowed` styling -- this reads as intentional (the button appears designed
//   to start disabled until a photo is picked), not a mistake, so its literal tertiary coloring is
//   kept as specified. The `disabled:` state itself isn't implemented: doing so would require
//   tracking whether a photo was picked, which is real validation/state out of scope for this
//   static UI shell (rule 5) -- rendered always-enabled instead.

export default function DriverRegisterProfilePhotoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { uri, uploading, uploaded, error, pickFromLibrary, pickFromCamera } =
    useDocumentUpload("profile_photo");

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="bg-surface shadow-sm">
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

      <ScrollView
        className="w-full flex-1"
        contentContainerClassName="mx-auto w-full max-w-2xl items-center px-container-margin py-stack-lg"
      >
        <View className="mb-stack-lg w-full">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-label-sm text-label-sm text-on-surface-variant">
              Step 3 of 10
            </Text>
            <Text className="font-label-sm text-label-sm text-on-surface-variant">
              Profile Photo
            </Text>
          </View>
          <View className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
            <View className="h-full rounded-full bg-primary" style={{ width: "30%" }} />
          </View>
        </View>

        <View className="mb-stack-md w-full items-center">
          <Text className="mb-2 text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Upload Profile Photo
          </Text>
          <Text className="text-center font-body-md text-body-md text-on-surface-variant">
            This photo helps riders identify you. Ensure it is clear and professional.
          </Text>
        </View>

        <View className="relative mb-stack-lg">
          <View className="relative h-48 w-48 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-surface-container-high shadow-lg">
            {uri ? (
              <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <MaterialIcons name="person" size={60} color={themeColors.outlineVariant} />
            )}
            {uploading ? (
              <View
                className="absolute inset-0 items-center justify-center"
                style={{ backgroundColor: "rgba(21,28,39,0.4)" }}
              >
                <ActivityIndicator color={themeColors.onPrimary} />
              </View>
            ) : null}
            {uploaded ? (
              <View className="absolute bottom-1 right-1 rounded-full bg-primary p-1">
                <MaterialIcons name="check" size={16} color={themeColors.onPrimary} />
              </View>
            ) : null}
          </View>
          <Pressable
            onPress={pickFromCamera}
            className="absolute bottom-2 right-2 items-center justify-center rounded-full bg-primary p-3 shadow-md active:scale-95"
          >
            <MaterialIcons name="photo-camera" size={20} color={themeColors.onPrimary} />
          </Pressable>
        </View>

        {error ? (
          <Text className="mb-stack-md text-center font-label-sm text-label-sm text-error">
            {error}
          </Text>
        ) : null}

        <View className="mb-stack-lg w-full rounded-xl border border-surface-variant bg-surface-container-lowest p-6 shadow-sm">
          <Text className="mb-4 font-label-sm text-label-sm uppercase tracking-wider text-on-surface">
            Photo Guidelines
          </Text>
          <View className="gap-4">
            <View className="flex-row items-start gap-3">
              <MaterialIcons
                name="check-circle"
                size={16}
                color={themeColors.primary}
                style={{ marginTop: 2 }}
              />
              <Text className="flex-1 font-body-md text-body-md text-on-surface-variant">
                Face the camera directly with a neutral expression or natural smile.
              </Text>
            </View>
            <View className="flex-row items-start gap-3">
              <MaterialIcons
                name="wb-sunny"
                size={16}
                color={themeColors.primary}
                style={{ marginTop: 2 }}
              />
              <Text className="flex-1 font-body-md text-body-md text-on-surface-variant">
                Ensure good lighting; avoid heavy shadows on your face.
              </Text>
            </View>
            <View className="flex-row items-start gap-3">
              <MaterialIcons
                name="block"
                size={16}
                color={themeColors.primary}
                style={{ marginTop: 2 }}
              />
              <Text className="flex-1 font-body-md text-body-md text-on-surface-variant">
                No sunglasses, hats, or masks that obscure your features.
              </Text>
            </View>
          </View>
        </View>

        <View className="w-full flex-col gap-4">
          <Pressable
            onPress={pickFromLibrary}
            disabled={uploading}
            className="min-h-[56px] flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-surface-container-high px-6 py-4 active:scale-95 disabled:opacity-70"
          >
            <MaterialIcons name="image" size={16} color={themeColors.onSurface} />
            <Text className="font-body-md text-body-md font-semibold text-on-surface">
              Upload Photo
            </Text>
          </Pressable>
          <Pressable
            onPress={pickFromCamera}
            disabled={uploading}
            className="min-h-[56px] flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 active:scale-95 disabled:opacity-70"
            style={{
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <MaterialIcons name="photo-camera" size={16} color={themeColors.onPrimary} />
            <Text className="font-body-md text-body-md font-semibold text-on-primary">
              Take Photo
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/(driver-auth)/register-identity-document")}
          className="mt-6 w-full items-center justify-center rounded-lg bg-tertiary-container py-4"
        >
          <Text className="font-body-md text-body-md font-semibold text-on-tertiary-container">
            Continue
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
