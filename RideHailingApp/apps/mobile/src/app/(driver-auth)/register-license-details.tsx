import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SelectModal } from "@/components/select-modal";
import { themeColors } from "@/constants/theme-colors";

// A driving license can be issued by any country, not just US states -- this is a genuinely global
// list of world countries (not exhaustive/official, just representative), not the US-states list
// this field used to show.
const COUNTRIES = [
  "United States", "Canada", "Mexico", "United Kingdom", "Ireland", "France", "Germany",
  "Spain", "Portugal", "Italy", "Netherlands", "Belgium", "Switzerland", "Austria",
  "Sweden", "Norway", "Denmark", "Finland", "Iceland", "Poland", "Czech Republic",
  "Slovakia", "Hungary", "Romania", "Bulgaria", "Greece", "Turkey", "Ukraine", "Russia",
  "Egypt", "Morocco", "Nigeria", "Kenya", "South Africa", "Ghana", "Ethiopia",
  "Saudi Arabia", "United Arab Emirates", "Qatar", "Israel", "Jordan", "Lebanon",
  "India", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "China", "Japan",
  "South Korea", "Taiwan", "Hong Kong", "Singapore", "Malaysia", "Indonesia",
  "Thailand", "Vietnam", "Philippines", "Australia", "New Zealand",
  "Brazil", "Argentina", "Chile", "Colombia", "Peru", "Venezuela", "Ecuador",
  "Jamaica", "Trinidad and Tobago",
];

// Screen-title match: source's <title> ("Driver Registration - License Info") and on-screen <h2>
// ("Driving License Details") both match the "Driving License Details" row in the routing table.
//
// Flow reorder: now Step 5 of 10 (previously Step 5 of 9, Step 5 of 6, Step 5 of 7, Step 4 of 6, and
// Step 3 of 6 before that, across the Identity Document move, phone verification/vehicle-info
// reorders, and the vehicle-photos screen's addition). See register-identity-document.tsx's header
// comment for the full new order. Continue's destination (register-license-upload.tsx) is unchanged,
// but that screen no longer shares this step number -- it now has its own Step 6 of 10, since sharing
// a step between two screens was fixed as a step-numbering bug (see register-identity-document.tsx).
//
// Fixed: removed the redundant bottom "Back" button next to "Continue to Upload" -- no other screen
// in this flow has one (the header's own back arrow already covers it), so this was an
// inconsistency, not a deliberate extra affordance. Continue button now spans the full width where
// the two-button row used to be.
//
// Fixed (Root Cause B of this batch): this screen's content wasn't in a ScrollView at all, so the
// license-photo upload section at the bottom was cut off and unreachable on shorter devices, and
// attempting to scroll it was instead triggering the OS's edge-swipe-back gesture. Rather than just
// wrapping it, that whole upload section is REMOVED per explicit instruction: it's redundant with
// register-license-upload.tsx, the dedicated screen immediately after this one that actually
// handles front/back license photo upload. This screen now ends after the License Number/Expiry/
// Issuing Country fields and its Continue button.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this batch. Verified glyph
//   names directly against the installed @expo/vector-icons MaterialIcons glyph map this time
//   (all the batch's icons exist under the usual underscore->hyphen conversion) except one:
//   "id_card" has no equivalent glyph in the classic Material Icons font MaterialIcons wraps (it's
//   a Material-Symbols-only icon). Substituted with "badge" (an ID-badge glyph, the same one
//   already used for "National ID" on the Identity Document screen) as the closest available icon.
// - This file has a `md:hidden` mobile header + mobile stepper and a separate `hidden md:flex`
//   desktop sidebar with its own header and stepper nav. Since this is a native phone screen
//   (always below the `md:` breakpoint), only the mobile header/stepper block ever applies;
//   the entire desktop `<aside>` sidebar is dropped, same treatment as every other screen in this
//   project with a parallel mobile/desktop split (e.g. register-personal-info.tsx).
// - `sticky docked full-width top-0` / `flat no shadows` on the header are inert non-Tailwind words
//   (same recurring artifact as elsewhere in this project) -- dropped silently, zero effect either
//   way.
// - `hover:*` / `transition-colors` / `duration-*` / `group-hover:*` dropped throughout: no hover
//   state on touch devices, no RN equivalent for CSS transitions.
// - `grid grid-cols-1 sm:grid-cols-2 gap-6` on the Expiry Date / Issuing Country row: the `sm:`
//   2-column override doesn't apply on a native phone screen (always below that breakpoint), so
//   the base `grid-cols-1` (single stacked column) is the state that actually applies here --
//   substituted with a `flex-col gap-6` View, not a `flex-row`.
// - The License Number field uses the "peer + floating label" CSS trick (label centered inside the
//   box at rest, animates up on focus/fill). Same substitution as login.tsx: a plain TextInput with
//   the label text as its placeholder, dropping the floating animation (rule 5, no RN equivalent
//   without extra state).
// - The Expiry Date field's label is NOT peer/floating -- the source's own comment notes date
//   inputs don't support the floating-label hack, so its label is a separate `<span>` statically
//   positioned above the border (a fixed "notched border" cutout label, MD-outlined-field style).
//   Reproduced literally: a Text label absolutely positioned above the TextInput's top edge with
//   the card's own background color behind it, distinct from License Number's floating-placeholder
//   treatment above.
// Fixed: Issuing State didn't open/respond to taps -- it was rendered as a plain inert View (no
// onPress at all), just styled to look like a dropdown. Wired to the shared `SelectModal` component
// (@/components/select-modal, also used by register-vehicle-model.tsx's Year of Manufacture field --
// built once, extracted rather than duplicating the same Modal+list markup twice). Selecting an
// option closes the modal and updates the field's display text the same way a native `<select>`
// would.
//
// Fixed: this field's data source was a US-states list, but a driving license can be issued by any
// country -- swapped for a genuinely global `COUNTRIES` list. Renamed the field from "Issuing State"
// to "Issuing Country" to match (label, placeholder, modal title, and the `issuingCountry`/
// `showCountryModal` state names below all follow). "Issuing Country" is the natural fit given the
// field's own established "Issuing X" naming and that this is the only country-vs-state ambiguity on
// the field -- flagging this choice rather than assuming it's uncontroversial, in case something
// like "License Country" or "Country of Issue" was intended instead.
// - The decorative background circle (`absolute -right-10 -top-10 ... opacity-50`) has no blur
//   filter applied in the source (it's a plain solid-color circle already), so it's translated
//   directly with no substitution needed.
// - `position: fixed` on the bottom action bar (mobile) has no RN equivalent; substituted with
//   `absolute` pinned to the screen edges, as on every fixed-bottom-bar screen in this project.
//   `md:static`/`md:bg-transparent`/etc. on that same bar are dropped desktop overrides.

export default function DriverRegisterLicenseDetailsScreen() {
  const router = useRouter();

  const insets = useSafeAreaInsets();
  const [issuingCountry, setIssuingCountry] = useState<string | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="bg-surface shadow-sm">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={16} color={themeColors.onSurfaceVariant} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Driver Registration
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="flex-1">
        <View className="gap-2 px-container-margin pb-stack-sm pt-stack-md">
          <View className="flex-row items-center justify-between">
            <Text className="font-label-sm text-label-sm text-on-surface-variant">
              Step 5 of 10
            </Text>
            <Text className="font-label-sm text-label-sm font-bold text-primary">
              License Information
            </Text>
          </View>
          <View className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <View className="h-full rounded-full bg-primary" style={{ width: "50%" }} />
          </View>
        </View>

        <ScrollView
          className="flex-1 px-container-margin"
          contentContainerClassName="flex-grow pb-stack-lg"
        >
          <View className="mb-stack-lg mt-stack-md items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-primary-container shadow-sm">
              <MaterialIcons name="badge" size={32} color={themeColors.primary} />
            </View>
            <Text className="mb-2 text-center font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">
              Driving License Details
            </Text>
            <Text className="max-w-md text-center font-body-md text-body-md text-on-surface-variant">
              Please provide your valid driving license information. This is required for
              background verification.
            </Text>
          </View>

          <View className="relative gap-6 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <View
              className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-surface-container-low opacity-50"
              pointerEvents="none"
            />

            <TextInput
              className="h-14 w-full rounded-xl border border-outline-variant bg-transparent px-4 font-body-md text-body-md text-on-surface focus:border-primary"
              placeholder="License Number"
              placeholderTextColor={themeColors.onSurfaceVariant}
            />

            <View className="gap-6">
              <View className="relative">
                <TextInput className="h-14 w-full rounded-xl border border-outline-variant bg-transparent px-4 font-body-md text-body-md text-on-surface focus:border-primary" />
                <Text className="absolute -top-3 left-4 bg-surface-container-lowest px-1 font-label-sm text-label-sm text-on-surface-variant">
                  Expiry Date
                </Text>
              </View>

              <View className="relative">
                <Pressable
                  onPress={() => setShowCountryModal(true)}
                  className="h-14 w-full flex-row items-center justify-between rounded-xl border border-outline-variant bg-transparent px-4"
                >
                  <Text
                    className="font-body-md text-body-md"
                    style={{
                      color: issuingCountry ? themeColors.onSurface : themeColors.onSurfaceVariant,
                    }}
                  >
                    {issuingCountry ?? "Select Country"}
                  </Text>
                  <MaterialIcons
                    name="expand-more"
                    size={20}
                    color={themeColors.onSurfaceVariant}
                  />
                </Pressable>
                <Text className="absolute -top-3 left-4 bg-surface-container-lowest px-1 font-label-sm text-label-sm text-on-surface-variant">
                  Issuing Country
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      <View className="absolute bottom-0 left-0 z-40 w-full border-t border-outline-variant bg-surface-container-lowest p-container-margin">
        <Pressable
          onPress={() => router.push("/(driver-auth)/register-license-upload")}
          className="h-14 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary shadow-md active:scale-95"
        >
          <Text className="font-label-sm text-label-sm text-on-primary">Continue to Upload</Text>
          <MaterialIcons name="arrow-forward" size={18} color={themeColors.onPrimary} />
        </Pressable>
      </View>

      <SelectModal
        visible={showCountryModal}
        title="Issuing Country"
        options={COUNTRIES}
        selectedValue={issuingCountry}
        onSelect={setIssuingCountry}
        onClose={() => setShowCountryModal(false)}
      />
    </View>
  );
}
