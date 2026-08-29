import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

type ColorOption = { key: string; name: string; hex: string };

const colorOptions: ColorOption[] = [
  { key: "black", name: "Midnight Black", hex: "#151c27" },
  { key: "white", name: "Glacier White", hex: "#ffffff" },
  { key: "gray", name: "Slate Gray", hex: "#575e70" },
  { key: "indigo", name: "Indigo Motion", hex: "#3525cd" },
  { key: "red", name: "Crimson Red", hex: "#ba1a1a" },
  { key: "blue", name: "Ocean Blue", hex: "#2563eb" },
  { key: "silver", name: "Champagne Silver", hex: "#dce2f3" },
];

// Extra swatches shown only in the "+" custom-color modal, not the main 7-swatch grid -- a wider
// selection for drivers whose vehicle color isn't one of the common presets above. Combined with
// colorOptions below (allColorOptions) so `selectedColor`'s lookup resolves a color chosen from
// either place the same way.
const extraColorOptions: ColorOption[] = [
  { key: "green", name: "Forest Green", hex: "#1b5e20" },
  { key: "yellow", name: "Sunburst Yellow", hex: "#f9c74f" },
  { key: "orange", name: "Amber Orange", hex: "#f3722c" },
  { key: "purple", name: "Royal Purple", hex: "#5e35b1" },
  { key: "brown", name: "Espresso Brown", hex: "#4e342e" },
  { key: "beige", name: "Desert Beige", hex: "#d7ccc8" },
  { key: "teal", name: "Deep Teal", hex: "#00695c" },
  { key: "maroon", name: "Maroon", hex: "#6d1b1b" },
  { key: "gold", name: "Metallic Gold", hex: "#c9a227" },
  { key: "navy", name: "Navy Blue", hex: "#1a237e" },
];

const allColorOptions = [...colorOptions, ...extraColorOptions];

// Step indicator added (this screen previously had none): Step 9 of 10, its own unique number --
// previously shared a step with register-vehicle-model.tsx and register-vehicle-type.tsx, but
// sharing a step between screens was fixed as a step-numbering bug; Y went from 9 to 10 once
// register-vehicle-photos.tsx was added as the new last screen. See register-identity-document.tsx's
// header comment for the full new order.
//
// "Confirm Selection" now pushes register-vehicle-photos.tsx (was (driver)/verification-status
// directly, and verify-phone.tsx before that) -- the recreated Vehicle Photos screen is now the true
// last step of the flow; this screen no longer jumps straight to verification-status itself.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this batch; "check_circle" ->
//   "check-circle" and "add" both verified against the installed glyph map.
// - `docked full-width top-0` on the header is the same inert non-Tailwind-word artifact seen
//   elsewhere in this project -- dropped silently, zero effect either way.
// - `mix-blend-multiply` on the car image (a CSS blend mode) has no RN equivalent; dropped, image
//   renders at its plain `opacity-90` with no blend applied.
// - The bottom-of-image `bg-gradient-to-b from-transparent to-surface-container-lowest/50` fade is
//   a functional fade (blending the photo into the card below it, same purpose as welcome.tsx's
//   foreground fade), so -- consistent with that precedent -- it's substituted with a real
//   expo-linear-gradient `<LinearGradient>` rather than flattened, unlike the purely decorative
//   ambient gradients dropped on other screens in this batch.
// - `grid grid-cols-4 gap-4 md:gap-6` has no RN equivalent (no CSS Grid); substituted with a
//   `flex-row flex-wrap` container of `w-1/4` items, reproducing the fixed 4-per-row layout without
//   grid. `md:w-16 md:h-16` on each swatch circle is a tablet-breakpoint override that doesn't apply
//   on a native phone screen (always below that breakpoint); kept the base `w-12 h-12`.
// - Each swatch's `hidden md:block` color-name label is hidden by default and only becomes visible
//   at the `md:` breakpoint and up. Since this is a phone-sized native screen (always below that
//   breakpoint), the source's own mobile behavior is "label not shown" -- so the per-swatch name
//   labels are correctly omitted here, not a removed UI element (rule 4); the "Selected Color" name
//   readout below the grid still shows the name, matching what's actually visible on mobile.
// - `ring-2 ring-primary ring-offset-2` on the selected swatch (a colored ring with a gap around the
//   circle) has no direct RN equivalent without an extra wrapping view; approximated with a plain
//   3px `borderColor: primary` directly on the swatch circle (no offset gap) plus the source's own
//   `scale-110` transform, kept as a NativeWind `scale-110` utility class.
// - `hover:*` / `group-hover:*` / `transition-*` / `duration-*` dropped throughout: no hover state
//   on touch devices, no RN equivalent for CSS transitions.
// - The bottom `Confirm Selection` bar's `bg-surface/90 backdrop-blur-md` is this project's
//   established `.glass-panel`-style pattern, substituted with expo-blur's `<BlurView>` (same as
//   onboarding-negotiation.tsx/reset-password.tsx/register-vehicle-model.tsx in this batch).
// - `position: fixed` on that same bar has no RN equivalent; substituted with `absolute` pinned to
//   the screen edges, as on every fixed-bottom-bar screen in this project.
//
// Rule 5 approved presentation state on this screen:
// - Color selection: a local `useState<string>` (default "white"/Glacier White, matching the
//   source's own pre-selected markup) drives which swatch shows the selected-ring styling and
//   which name appears in the "Selected Color" readout, reproducing the source's own `selectColor()`
//   script. Same category of exception as the gender-picker (register-personal-info.tsx) and
//   color/vehicle-type pickers elsewhere in this batch -- a picker screen has no way to show what's
//   picked without *some* state; no validation or submission logic is attached.
//
// Fixed: the "Other" ("+") custom-color swatch didn't do anything (no onPress). Wired to open a
// Modal with an expanded grid of 10 additional preset swatches (a full color wheel isn't necessary
// per explicit instruction, just more presets than the main 7) -- same Modal-over-bg-black/50 styling
// as reset-password.tsx's success/failure modals. Selecting a swatch inside the modal sets the same
// `selectedKey` state a tap on one of the main 7 swatches would, so "Selected Color" below updates
// identically either way; `selectedColor`'s lookup now searches `allColorOptions` (main 7 + the
// modal's 10) instead of just the main 7, so a custom pick still resolves to a real name/hex.

export default function DriverRegisterVehicleColorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedKey, setSelectedKey] = useState("white");
  const [showColorModal, setShowColorModal] = useState(false);
  const selectedColor =
    allColorOptions.find((option) => option.key === selectedKey) ?? colorOptions[1];

  return (
    <View className="h-full flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="flex-none bg-surface">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
          </Pressable>
          <Text className="flex-1 text-center font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Vehicle Color
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="gap-2 px-container-margin pb-stack-sm pt-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-label-sm text-label-sm text-on-surface-variant">Step 9 of 10</Text>
          <Text className="font-label-sm text-label-sm font-bold text-primary">Vehicle Color</Text>
        </View>
        <View className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <View className="h-full rounded-full bg-primary" style={{ width: "90%" }} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-container-margin pb-[100px] pt-4"
      >
        <View className="relative mb-stack-lg h-64 w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBKL83_W2ZYvNHF-tm2Qo9xkKhVsU4-49hp_VSRuymuejiIsMQCr4Yf1UloUMHeorNxSirkFr6Bcg81W_qofOARJvVd5LlT84NHPohLiJFK40KJOcJtdNz2dR66U3sutdm9xOGkDT5AYNgQE2J7wyqsvMaX-eKokgWP58VN29w2QVCTE69OoN4U0aU2O-Z4o3WbkNlevcYzIoX3YsGd1vkKCUhJUW0Q5oLKlo7oaLWXtNbtMJLbJAzu",
            }}
            resizeMode="cover"
            className="h-full w-full opacity-90"
          />
          <LinearGradient
            colors={["transparent", `${themeColors.surfaceContainerLowest}80`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
        </View>

        <View className="mb-stack-lg rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
          <View className="mb-stack-md">
            <Text className="mb-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              Select Exterior Color
            </Text>
            <Text className="font-body-md text-body-md text-on-surface-variant">
              Choose the color that best matches your vehicle.
            </Text>
          </View>

          <View className="flex-row flex-wrap justify-items-center gap-y-4">
            {colorOptions.map((option) => {
              const selected = option.key === selectedKey;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setSelectedKey(option.key)}
                  className="w-1/4 items-center gap-2"
                >
                  <View
                    className={`h-12 w-12 rounded-full shadow-sm ${selected ? "scale-110" : ""}`}
                    style={{
                      backgroundColor: option.hex,
                      borderWidth: selected ? 3 : 1,
                      borderColor: selected ? themeColors.primary : `${themeColors.outlineVariant}33`,
                    }}
                  />
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setShowColorModal(true)}
              className="w-1/4 items-center gap-2"
            >
              <View className="h-12 w-12 items-center justify-center rounded-full border border-dashed border-outline-variant bg-surface-container-high">
                <MaterialIcons name="add" size={20} color={themeColors.onSurfaceVariant} />
              </View>
            </Pressable>
          </View>

          <View className="mt-stack-md flex-row items-center justify-between rounded-lg bg-surface-container-low px-4 py-3">
            <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Selected Color
            </Text>
            <Text className="font-fare-display text-fare-display text-on-surface">
              {selectedColor.name}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 z-40 overflow-hidden border-t border-outline-variant p-container-margin">
        <BlurView
          intensity={70}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <Pressable
          onPress={() => router.push("/(driver-auth)/register-vehicle-photos")}
          className="h-14 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary shadow-sm active:scale-[0.98]"
        >
          <Text className="font-label-sm text-label-sm text-on-primary">Confirm Selection</Text>
          <MaterialIcons name="check-circle" size={20} color={themeColors.onPrimary} />
        </Pressable>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={showColorModal}
        onRequestClose={() => setShowColorModal(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 px-container-margin"
          onPress={() => setShowColorModal(false)}
        >
          <Pressable
            onPress={() => {}}
            className="w-full max-w-sm overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg"
            style={{
              shadowColor: "#111827",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.12,
              shadowRadius: 32,
              elevation: 12,
            }}
          >
            <View className="mb-stack-md flex-row items-center justify-between">
              <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Choose a Color
              </Text>
              <Pressable
                onPress={() => setShowColorModal(false)}
                className="items-center justify-center rounded-full p-1 active:scale-95"
              >
                <MaterialIcons name="close" size={20} color={themeColors.onSurfaceVariant} />
              </Pressable>
            </View>
            <View className="flex-row flex-wrap gap-y-4">
              {extraColorOptions.map((option) => {
                const selected = option.key === selectedKey;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => {
                      setSelectedKey(option.key);
                      setShowColorModal(false);
                    }}
                    className="w-1/4 items-center gap-2"
                  >
                    <View
                      className={`h-12 w-12 rounded-full shadow-sm ${selected ? "scale-110" : ""}`}
                      style={{
                        backgroundColor: option.hex,
                        borderWidth: selected ? 3 : 1,
                        borderColor: selected
                          ? themeColors.primary
                          : `${themeColors.outlineVariant}33`,
                      }}
                    />
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
