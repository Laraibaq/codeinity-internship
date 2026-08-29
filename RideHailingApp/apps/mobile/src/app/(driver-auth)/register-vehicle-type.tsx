import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// NEW SCREEN -- no source HTML, designed per your brief to match Select Vehicle Model's visual
// style: same TopAppBar (back arrow + centered "Driver Registration" title + spacer), same
// list-item card component (bg-surface-container-lowest, border-outline-variant, rounded-xl,
// p-4, shadow-sm, two-line text stack), same primary Continue button.
//
// One addition beyond Select Vehicle Model's own layout: a step-progress bar under the header,
// since you explicitly asked for "a step indicator matching this screen's position in the step
// sequence" even though Select Vehicle Model's own source has no stepper at all -- reused the same
// thin-bar-plus-label stepper component style already used on register-license-details.tsx/
// register-identity-document.tsx for visual consistency with its neighbors in the flow.
//
// Updated for the registration-flow reorders: now Step 7 of 10, its own unique number -- previously
// shared Step 6 of 6 with register-vehicle-model.tsx and register-vehicle-color.tsx (and Step 6 of 7
// with register-vehicle-info.tsx before that was deleted), but sharing a step between screens was
// fixed as a step-numbering bug; Y went from 9 to 10 once register-vehicle-photos.tsx was added as
// the new last screen. See register-identity-document.tsx's header comment for the full new order.
//
// Vehicle-type options reflect the Vehicle entity's type enum from Dependencies.docx SS5. Per that
// same doc, MVP1 only supports Car, so Bike and Rickshaw render as visibly disabled cards with a
// "Coming Soon" pill (reusing the "Pending" pill's visual language from register-license-upload.tsx
// for consistency), non-Pressable and inert.
//
// Design call you asked me to flag: Car is auto-selected by default (there's no real choice to
// make when it's the only supported option), shown via a filled check-circle trailing indicator --
// not "tap required to select," since forcing a tap on the one enabled option added friction without
// adding information. The Continue button is always enabled since Car is always the active
// selection; it's a bare Pressable (rule 5 -- no real form-state validation), not literally
// implementing a required-selection guard.

type VehicleType = "car" | "bike" | "rickshaw";

const vehicleTypeOptions: {
  value: VehicleType;
  title: string;
  subtitle: string;
  disabled: boolean;
}[] = [
  { value: "car", title: "Car", subtitle: "Sedan, hatchback, or SUV", disabled: false },
  { value: "bike", title: "Bike", subtitle: "Two-wheeler", disabled: true },
  { value: "rickshaw", title: "Rickshaw", subtitle: "Auto-rickshaw", disabled: true },
];

export default function DriverRegisterVehicleTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");

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

      <View className="gap-2 px-container-margin pb-stack-sm pt-stack-md">
        <View className="flex-row items-center justify-between">
          <Text className="font-label-sm text-label-sm text-on-surface-variant">
            Step 7 of 10
          </Text>
          <Text className="font-label-sm text-label-sm font-bold text-primary">
            Vehicle Type
          </Text>
        </View>
        <View className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <View className="h-full rounded-full bg-primary" style={{ width: "70%" }} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-[400px] gap-stack-lg px-container-margin py-stack-md"
      >
        <View className="gap-base">
          <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Select Vehicle Type
          </Text>
          <Text className="font-body-md text-body-md text-on-surface-variant">
            Choose the type of vehicle you&apos;ll be driving with Indigo Motion.
          </Text>
        </View>

        <View className="gap-stack-sm">
          <Text className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-outline">
            Available Types
          </Text>

          {vehicleTypeOptions.map((option) => {
            const selected = vehicleType === option.value;
            return (
              // Fixed: className used to interpolate a three-way disabled/selected conditional into
              // a template literal -- the same NativeWind runtime anti-pattern root-caused on
              // login.tsx's phone/email toggle. className is now static (bg-surface-container-lowest
              // was already common to all three branches); the border-color and opacity differences
              // move to a plain `style` prop instead.
              <Pressable
                key={option.value}
                disabled={option.disabled}
                onPress={() => setVehicleType(option.value)}
                className="w-full rounded-xl border bg-surface-container-lowest p-4 shadow-sm"
                style={{
                  borderColor:
                    !option.disabled && selected ? themeColors.primary : themeColors.outlineVariant,
                  opacity: option.disabled ? 0.5 : 1,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="font-body-md text-body-md font-semibold text-on-surface">
                      {option.title}
                    </Text>
                    <Text className="font-label-sm text-label-sm text-on-surface-variant">
                      {option.subtitle}
                    </Text>
                  </View>
                  {option.disabled ? (
                    <View className="rounded-full bg-surface-container-high px-3 py-1">
                      <Text className="font-label-sm text-label-sm text-on-surface-variant">
                        Coming Soon
                      </Text>
                    </View>
                  ) : selected ? (
                    <MaterialIcons name="check-circle" size={24} color={themeColors.primary} />
                  ) : (
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={themeColors.outlineVariant}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-auto pb-stack-lg pt-stack-md">
          <Pressable
            onPress={() => router.push("/(driver-auth)/register-vehicle-model")}
            className="h-14 w-full items-center justify-center rounded-xl bg-primary shadow-md active:scale-95"
          >
            <Text className="font-body-md text-body-md font-semibold text-on-primary">
              Continue
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
