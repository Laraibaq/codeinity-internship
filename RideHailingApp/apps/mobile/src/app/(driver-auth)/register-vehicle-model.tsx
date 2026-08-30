import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SelectModal } from "@/components/select-modal";
import { themeColors } from "@/constants/theme-colors";
import { registrationDraft, type DraftVehicleType } from "@/utils/registration-draft";

const MODEL_PLACEHOLDER: Record<DraftVehicleType, string> = {
  car: "e.g. Toyota Camry",
  bike: "e.g. Honda CG 125",
  rickshaw: "e.g. Vespa APE",
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1990 + 1 }, (_, i) =>
  String(CURRENT_YEAR - i),
);

// Fixed (global safe-area audit): the header now carries top-safe-area padding via
// `useSafeAreaInsets()` -- see _layout.tsx's header comment for why this became necessary.

// Step indicator added (this screen previously had none): Step 8 of 10, its own unique number --
// previously shared a step with register-vehicle-type.tsx and register-vehicle-color.tsx, but
// sharing a step between screens was fixed as a step-numbering bug; Y went from 9 to 10 once
// register-vehicle-photos.tsx was added as the new last screen. See register-identity-document.tsx's
// header comment for the full new order.
//
// register-vehicle-info.tsx (the standalone "Vehicle Eligibility" screen) was removed from the
// registration flow entirely and deleted -- this screen now does double duty, picking up its Year of
// Manufacture field (moved here, same component/style, placed above the model field below) in
// addition to its own original job of collecting the model. The "must be newer than 2015"
// eligibility notice that used to accompany the Year field was NOT carried over -- removed entirely
// per explicit instruction; there's no minimum-year requirement anymore, this screen just collects
// the year.
//
// Fixed: "Select Year" didn't open/respond to taps -- it was an inert View, no onPress at all. Wired
// to the shared `SelectModal` component (@/components/select-modal, also used by
// register-license-details.tsx's Issuing State), populated with every year from 1990 through the
// current year (computed at render time via `new Date().getFullYear()`, not hardcoded, so it stays
// correct without a code change every January).
//
// Fixed (reversed an earlier decision): the search-and-pick "Suggested Models" list (Toyota Camry,
// Honda Accord, Tesla Model 3, Chevrolet Malibu) and its search input are removed entirely, replaced
// with a single plain TextInput labeled "Vehicle Model" for freeform entry, per explicit instruction
// -- going forward this screen collects the model as typed text, not a pick from a fixed list.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this batch; verified against
//   the installed glyph map.
// - `docked full-width top-0` / `flat no shadows` on the header are the same inert non-Tailwind-word
//   artifact seen elsewhere in this project -- dropped silently, zero effect either way.
// - `hover:*` / `group-hover:*` / `transition-colors` / `transition-shadow` dropped throughout: no
//   hover state on touch devices.
// - `focus:ring-2 focus:ring-primary` on the model input dropped per this project's standing ring
//   policy; `focus:border-primary` already provides feedback.

export default function DriverRegisterVehicleModelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [year, setYear] = useState<string | null>(null);
  const [showYearModal, setShowYearModal] = useState(false);

  return (
    <View className="h-full w-full flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="bg-surface">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
          </Pressable>
          <Text className="flex-1 text-center font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Driver Registration
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="mx-auto w-full max-w-[400px] gap-2 px-container-margin pb-stack-sm pt-stack-md">
        <View className="flex-row items-center justify-between">
          <Text className="font-label-sm text-label-sm text-on-surface-variant">Step 8 of 10</Text>
          <Text className="font-label-sm text-label-sm font-bold text-primary">Vehicle Model</Text>
        </View>
        <View className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <View className="h-full rounded-full bg-primary" style={{ width: "80%" }} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-[400px] items-center gap-stack-lg px-container-margin py-stack-md"
      >
        <View className="w-full gap-base">
          <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Select Vehicle Model
          </Text>
          <Text className="font-body-md text-body-md text-on-surface-variant">
            Enter the exact model of your vehicle to proceed with registration.
          </Text>
        </View>

        <View className="w-full">
          <Text className="mb-base font-label-sm text-label-sm text-on-surface-variant">
            Year of Manufacture
          </Text>
          <View className="relative">
            <View
              className="absolute inset-y-0 left-0 z-10 justify-center pl-3"
              pointerEvents="none"
            >
              <MaterialIcons name="calendar-today" size={20} color={themeColors.outline} />
            </View>
            <Pressable
              onPress={() => setShowYearModal(true)}
              className="min-h-[56px] flex-row items-center justify-between rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-10 shadow-sm"
            >
              <Text
                className="font-body-md text-body-md"
                style={{ color: year ? themeColors.onSurface : themeColors.outline }}
              >
                {year ?? "Select Year"}
              </Text>
            </Pressable>
            <View
              className="absolute inset-y-0 right-0 z-10 justify-center pr-3"
              pointerEvents="none"
            >
              <MaterialIcons name="expand-more" size={20} color={themeColors.outline} />
            </View>
          </View>
        </View>

        <View className="w-full">
          <Text className="mb-base font-label-sm text-label-sm text-on-surface-variant">
            Vehicle Model
          </Text>
          <TextInput
            className="h-14 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-on-surface shadow-sm focus:border-primary"
            placeholder={MODEL_PLACEHOLDER[registrationDraft.vehicleType]}
            placeholderTextColor={themeColors.outline}
          />
        </View>

        <View className="mt-auto w-full justify-center pb-stack-lg pt-stack-md">
          <Pressable
            onPress={() => router.push("/(driver-auth)/register-vehicle-color")}
            className="h-14 w-full items-center justify-center rounded-xl bg-primary shadow-md active:scale-95"
          >
            <Text className="font-body-md text-body-md font-semibold text-on-primary">
              Continue
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <SelectModal
        visible={showYearModal}
        title="Year of Manufacture"
        options={YEAR_OPTIONS}
        selectedValue={year}
        onSelect={setYear}
        onClose={() => setShowYearModal(false)}
      />
    </View>
  );
}
