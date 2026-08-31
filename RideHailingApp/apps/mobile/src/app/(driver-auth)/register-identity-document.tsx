import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { useDocumentUpload } from "@/hooks/use-document-upload";

type IdType = "passport" | "national_id";

// Flow reorder: this screen moved earlier in the registration sequence, from between Vehicle Info
// and Vehicle Type to right after Profile Photo. Later, phone verification was moved to immediately
// after account creation instead of after all the document/vehicle screens. Then
// register-vehicle-info.tsx (the standalone "Vehicle Eligibility" / Year-of-Manufacture screen) was
// removed from the flow entirely -- deleted outright, with its Year of Manufacture field moved into
// register-vehicle-model.tsx, which now does double duty (year + model) on one screen (its "must be
// newer than 2015" eligibility notice was dropped entirely per explicit instruction, not carried
// over -- there's no minimum-year requirement anymore). This is the canonical copy of the flow
// order -- other screens' header comments point back here rather than duplicating it.
//
// Step-numbering bug fix: License Details/Upload and Vehicle Type/Model/Color used to each share one
// step number between their screens (the "one logical section split across two/three screens"
// pattern). That was flagged as a bug -- two screens showing the same "Step X of Y" is a collision,
// not a feature -- so every screen below now gets its own unique, sequential number instead; no more
// sharing anywhere in the flow.
//
// New full order (10 screens, each with its own unique step number, Y=10 throughout -- was Y=9
// before register-vehicle-photos.tsx was recreated and added as the new last screen):
//   register.tsx ("SIGN UP")     -> verify-phone directly
//   1. verify-phone               Step 1 of 10
//   2. register-personal-info     Step 2 of 10
//   3. register-profile-photo     Step 3 of 10
//   4. register-identity-document Step 4 of 10   <- this screen
//   5. register-license-details   Step 5 of 10
//   6. register-license-upload    Step 6 of 10
//   7. register-vehicle-type      Step 7 of 10
//   8. register-vehicle-model     Step 8 of 10   (collects Year of Manufacture + model)
//   9. register-vehicle-color     Step 9 of 10
//   10. register-vehicle-photos   Step 10 of 10  (recreated -- see its own header comment)
//   -> (driver)/verification-status directly
// Continue still goes to register-license-details.tsx, unaffected by any of the reorders above.
// Also wrapped in a ScrollView (Root Cause B of this batch): the ID-type cards + upload box +
// Continue button could exceed a short device's viewport with no way to reach the cut-off content,
// which was also intercepting scroll gestures as the OS's edge-swipe-back gesture instead.
//
// Fixed: the step indicator had diverged from this project's established pattern (compare
// register-license-details.tsx/register-personal-info.tsx): it was rendered INSIDE the ScrollView
// (so it scrolled away with the content instead of staying pinned under the header), had the
// progress bar and "Step X of Y" label in the wrong order (bar on the left, label on the right --
// every other screen puts the step label on the left and the section title on the right), used a
// thin `h-1` bar instead of the `h-2` bar every other screen uses, and had no section-title label at
// all next to the step count. All four now match: a persistent block between the header and the
// ScrollView, "Step X of Y" on the left / "Identity Document" on the right, `h-2` bar. This was a
// plain divergence introduced when this screen's header markup was written, not an intentional
// design difference -- no explanation for it survived in this screen's own history.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this batch; all glyphs
//   ("menu_book", "badge", "photo_camera", "arrow_forward", "arrow_back") verified to exist in the
//   installed glyph map under the usual underscore->hyphen conversion.
// - `sticky top-0` / `flat no shadows` on the header are the same inert non-Tailwind-word artifact
//   seen elsewhere in this project -- dropped silently, zero effect either way.
// - `hover:*` / `group-hover:*` / `transition-*` / `duration-*` dropped throughout: no hover state
//   on touch devices, no RN equivalent for CSS transitions.
// - Each ID-type option is a `<label>` wrapping a visually-hidden (`sr-only`) radio input, styled
//   selected/unselected via the `peer-checked:` pseudo-class -- RN has neither a native radio input
//   nor `:checked`/`peer-checked`. Substituted with a Pressable pair driven by a local
//   `useState<IdType | null>`, matching this project's established gender-picker precedent
//   (register-personal-info.tsx): the selected option gets the peer-checked border/background/ring
//   styling and its checkmark circle fills in; no validation or submission logic attached.
// - `disabled:opacity-50 disabled:cursor-not-allowed` on the Continue button is dead styling in
//   this static markup (the button has no `disabled` attribute set, and nothing here ever adds
//   one) -- not translated since there's nothing to translate.
// - The upload area's surrounding HTML comment claims it's "conceptual, appears after selection,"
//   but no script in this file actually conditions its visibility on the radio selection --
//   rendered unconditionally visible per the literal markup, per rule 4 (flagging the apparent
//   intent/implementation mismatch rather than adding the conditional behavior myself).
//
// Upload area now wired for real (Phase 2): tapping it offers Take Photo / Choose from Library
// (an Alert action sheet, since the box's own label already promises both in one tap target),
// then POSTs to /drivers/me/documents as documentType "identity_document" via the shared
// useDocumentUpload hook. Shows the picked image as a thumbnail, a spinner while uploading, and a
// checkmark badge once confirmed; an inline error below the box on failure.

const idOptions: {
  value: IdType;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
}[] = [
  { value: "passport", icon: "menu-book", title: "Passport", description: "Must be valid and unexpired." },
  { value: "national_id", icon: "badge", title: "National ID", description: "Front and back required." },
];

export default function DriverRegisterIdentityDocumentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [idType, setIdType] = useState<IdType | null>(null);
  const { uri, uploading, uploaded, error, pickFromLibrary, pickFromCamera } =
    useDocumentUpload("identity_document");

  const handleUploadPress = () => {
    Alert.alert("Identity Document", "Take a photo or choose one from your library.", [
      { text: "Take Photo", onPress: () => void pickFromCamera() },
      { text: "Choose from Library", onPress: () => void pickFromLibrary() },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View className="flex-1 bg-surface">
      <View style={{ paddingTop: insets.top }} className="bg-surface">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          <Pressable
            className="items-center justify-center rounded-full p-2 active:scale-95"
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
          </Pressable>
          <Text className="flex-1 pr-10 text-center font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Driver Registration
          </Text>
        </View>
      </View>

      <View className="mx-auto w-full max-w-md gap-2 px-container-margin pb-stack-sm pt-stack-md">
        <View className="flex-row items-center justify-between">
          <Text className="font-label-sm text-label-sm text-on-surface-variant">Step 4 of 10</Text>
          <Text className="font-label-sm text-label-sm font-bold text-primary">
            Identity Document
          </Text>
        </View>
        <View className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <View className="h-full rounded-full bg-primary" style={{ width: "40%" }} />
        </View>
      </View>

      <ScrollView
        className="mx-auto w-full max-w-md flex-1"
        contentContainerClassName="flex-grow px-container-margin py-stack-md"
      >
        <View className="mb-stack-lg">
          <Text className="mb-stack-sm font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Upload Identity Document
          </Text>
          <Text className="font-body-md text-body-md text-on-surface-variant">
            Please provide a clear photo of your official government ID to verify your identity.
          </Text>
        </View>

        <View className="flex-1 gap-stack-sm">
          {idOptions.map((option) => {
            const selected = idType === option.value;
            return (
              // Fixed: every conditionally-toggled className below (row border/background, icon
              // circle background, checkmark circle border/background) used to be interpolated into
              // template literals -- the same NativeWind runtime anti-pattern root-caused on
              // login.tsx's phone/email toggle. Every className below is now static; each
              // state-dependent color moves to a plain `style` prop instead.
              <Pressable
                key={option.value}
                onPress={() => setIdType(option.value)}
                className="flex-row items-center gap-gutter rounded-xl border p-gutter"
                style={{
                  borderColor: selected ? themeColors.primary : themeColors.outlineVariant,
                  backgroundColor: selected
                    ? themeColors.surfaceContainerLow
                    : themeColors.surfaceContainerLowest,
                }}
              >
                <View
                  className="h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: selected
                      ? themeColors.primaryContainer
                      : themeColors.secondaryContainer,
                  }}
                >
                  <MaterialIcons
                    name={option.icon}
                    size={24}
                    color={selected ? themeColors.onPrimaryContainer : themeColors.onSecondaryContainer}
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-body-md text-body-md font-semibold text-on-surface">
                    {option.title}
                  </Text>
                  <Text className="font-label-sm text-label-sm font-normal text-on-surface-variant">
                    {option.description}
                  </Text>
                </View>
                <View
                  className="h-6 w-6 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: selected ? themeColors.primary : themeColors.outlineVariant,
                    backgroundColor: selected ? themeColors.primary : "transparent",
                  }}
                >
                  {selected ? (
                    <MaterialIcons name="check" size={16} color="#ffffff" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}

          <Pressable
            onPress={handleUploadPress}
            disabled={uploading}
            className="mt-stack-md items-center rounded-xl border border-dashed border-outline-variant bg-surface-container p-stack-lg disabled:opacity-70"
          >
            {uri ? (
              <View className="relative mb-stack-sm h-16 w-16 overflow-hidden rounded-full">
                <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
                {uploading ? (
                  <View
                    className="absolute inset-0 items-center justify-center"
                    style={{ backgroundColor: "rgba(21,28,39,0.4)" }}
                  >
                    <ActivityIndicator color={themeColors.onPrimary} size="small" />
                  </View>
                ) : null}
                {uploaded ? (
                  <View className="absolute bottom-0 right-0 rounded-full bg-primary p-0.5">
                    <MaterialIcons name="check" size={12} color={themeColors.onPrimary} />
                  </View>
                ) : null}
              </View>
            ) : (
              <View className="mb-stack-sm h-16 w-16 items-center justify-center rounded-full bg-secondary-container">
                <MaterialIcons name="photo-camera" size={32} color={themeColors.onSecondaryContainer} />
              </View>
            )}
            <Text className="text-center font-body-md text-body-md font-semibold text-primary">
              {uri ? "Tap to retake or replace" : "Tap to take photo or upload"}
            </Text>
            <Text className="mt-1 text-center font-label-sm text-label-sm font-normal text-on-surface-variant">
              Make sure all corners are visible and text is clear.
            </Text>
          </Pressable>
          {error ? (
            <Text className="mt-2 text-center font-label-sm text-label-sm text-error">{error}</Text>
          ) : null}
        </View>

        <View className="mt-auto pt-stack-lg pb-stack-md">
          <Pressable
            onPress={() => router.push("/(driver-auth)/register-license-details")}
            className="h-14 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary active:scale-[0.98]"
            style={{
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Text className="font-body-md text-body-md font-semibold text-on-primary">
              Continue
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color={themeColors.onPrimary} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
