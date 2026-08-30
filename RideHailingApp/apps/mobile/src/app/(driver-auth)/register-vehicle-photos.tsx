import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { registrationDraft, type DraftVehicleType } from "@/utils/registration-draft";

// Recreated screen: an earlier "Vehicle Photo Upload" screen existed at this same path, but was
// deleted along with two other files from an alternate registration flow that was abandoned in favor
// of the vehicle-info/identity-document/license flow this project settled on. That deletion was too
// broad -- this screen was still needed, only the other two were meant to go. There is no git history
// to recover the original from (it was created and deleted within the same uncommitted working
// session, never committed), so this is rebuilt from the project's own established visual patterns
// for the described content (2x2 Exterior Front/Side/Back + Interior upload cards, a Photo
// Guidelines box, a Submit Photos button) rather than restored verbatim:
// - Each upload card reuses register-license-upload.tsx's card layout (icon circle, label, "Tap to
//   upload or take photo" subtext, "Pending" status pill), arranged 2x2 instead of stacked -- same
//   rule-5 treatment as that screen: inert Pressables, no expo-image-picker wiring, static "Pending"
//   pill.
// - The Photo Guidelines box reuses register-profile-photo.tsx's card pattern verbatim (uppercase
//   title, checkmark-icon bullet rows).
//
// Fixed: the 2x2 grid was rendering as one full-width card per row instead of two per row. The first
// attempt used `flex-row flex-wrap` with each card at `w-[48%]` and a `gap-stack-md` (24px) row gap --
// two 48%-wide items plus a 24px gap between them sums to more than 100% of the row's width on a
// phone-sized container, so flex-wrap was always pushing the second card down to its own line.
// Rebuilt as two explicit `flex-row` rows (Front+Side, then Back+Interior, matching the original
// screen's layout) with each card at `flex-1` instead of a fixed percentage -- two flex-1 siblings in
// a row always split the remaining width evenly regardless of the gap, so this doesn't depend on the
// container width/gap arithmetic working out.
//
// Fixed: removed the "Save for Later" button per explicit instruction -- "Submit Photos" is now the
// only action on this screen.
//
// Placed as the new last screen of the vehicle section: register-vehicle-color.tsx's "Confirm
// Selection" now pushes here instead of going straight to (driver)/verification-status. "Submit
// Photos" continues the flow to (driver)/verification-status.
//
// Per-vehicle-type photo requirements (added once Bike and Rickshaw were unlocked on
// register-vehicle-type.tsx): this screen used to hardcode 4 car-specific slots, including an
// "Interior" photo and copy that said "your car" -- meaningless/wrong for a two-wheeler. Reads
// `registrationDraft.vehicleType` (written by register-vehicle-type.tsx's Continue button) and
// picks the matching slot set + intro copy below instead. Cars keep their original 4 slots
// unchanged; bikes swap "Interior" for a "License Plate" close-up (bikes have no cabin, but the
// plate is easy to miss in a full-bike shot); rickshaws keep "Interior" as "Cabin" (theirs is a
// real passenger compartment, worth its own photo).

const PHOTO_SLOTS_BY_TYPE: Record<
  DraftVehicleType,
  { key: string; label: string; icon: keyof typeof MaterialIcons.glyphMap }[]
> = {
  car: [
    { key: "front", label: "Exterior Front", icon: "directions-car" },
    { key: "side", label: "Exterior Side", icon: "directions-car" },
    { key: "back", label: "Exterior Back", icon: "directions-car" },
    { key: "interior", label: "Interior", icon: "event-seat" },
  ],
  bike: [
    { key: "front", label: "Front View", icon: "two-wheeler" },
    { key: "side", label: "Side View", icon: "two-wheeler" },
    { key: "back", label: "Rear View", icon: "two-wheeler" },
    { key: "plate", label: "License Plate", icon: "pin" },
  ],
  rickshaw: [
    { key: "front", label: "Exterior Front", icon: "airport-shuttle" },
    { key: "side", label: "Exterior Side", icon: "airport-shuttle" },
    { key: "back", label: "Exterior Back", icon: "airport-shuttle" },
    { key: "interior", label: "Cabin", icon: "event-seat" },
  ],
};

const VEHICLE_LABEL: Record<DraftVehicleType, string> = {
  car: "car",
  bike: "bike",
  rickshaw: "rickshaw",
};

function PhotoUploadCard({
  slot,
}: {
  slot: { key: string; label: string; icon: keyof typeof MaterialIcons.glyphMap };
}) {
  return (
    <Pressable className="relative flex-1 items-center gap-stack-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-surface-container-low">
        <MaterialIcons name={slot.icon} size={26} color={themeColors.primary} />
      </View>
      <View className="items-center">
        <Text className="text-center font-label-sm text-label-sm text-on-surface">
          Upload {slot.label}
        </Text>
        <Text className="mt-1 text-center font-body-md text-body-md text-on-surface-variant">
          Tap to upload or take photo
        </Text>
      </View>
      <View className="absolute right-2 top-2 flex-row items-center gap-1 rounded-full bg-surface-container-high px-2 py-1">
        <View className="h-2 w-2 rounded-full bg-outline" />
        <Text className="font-label-sm text-label-sm text-on-surface-variant">Pending</Text>
      </View>
    </Pressable>
  );
}

export default function DriverRegisterVehiclePhotosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const vehicleType = registrationDraft.vehicleType;
  const photoSlots = PHOTO_SLOTS_BY_TYPE[vehicleType];

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

      <View className="gap-2 px-container-margin pb-stack-sm pt-stack-md">
        <View className="flex-row items-center justify-between">
          <Text className="font-label-sm text-label-sm text-on-surface-variant">Step 10 of 10</Text>
          <Text className="font-label-sm text-label-sm font-bold text-primary">Vehicle Photos</Text>
        </View>
        <View className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <View className="h-full w-full rounded-full bg-primary" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-2xl gap-stack-lg px-container-margin py-stack-lg"
      >
        <View>
          <Text className="mb-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Upload Vehicle Photos
          </Text>
          <Text className="font-body-md text-body-md text-on-surface-variant">
            Provide clear photos of your {VEHICLE_LABEL[vehicleType]} from each angle below. This
            helps riders recognize it and confirms it matches your registration.
          </Text>
        </View>

        <View className="gap-stack-md">
          <View className="flex-row gap-stack-md">
            <PhotoUploadCard slot={photoSlots[0]} />
            <PhotoUploadCard slot={photoSlots[1]} />
          </View>
          <View className="flex-row gap-stack-md">
            <PhotoUploadCard slot={photoSlots[2]} />
            <PhotoUploadCard slot={photoSlots[3]} />
          </View>
        </View>

        <View className="w-full rounded-xl border border-surface-variant bg-surface-container-lowest p-6 shadow-sm">
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
                Take photos in good daylight, with the full vehicle visible in frame.
              </Text>
            </View>
            <View className="flex-row items-start gap-3">
              <MaterialIcons
                name="check-circle"
                size={16}
                color={themeColors.primary}
                style={{ marginTop: 2 }}
              />
              <Text className="flex-1 font-body-md text-body-md text-on-surface-variant">
                Make sure the license plate is visible in the front or back photo.
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
                Avoid blurry, cropped, or heavily filtered photos.
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => router.push("/(driver)/verification-status")}
          className="h-14 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary shadow-md active:scale-95"
        >
          <Text className="font-label-sm text-label-sm text-on-primary">Submit Photos</Text>
          <MaterialIcons name="arrow-forward" size={18} color={themeColors.onPrimary} />
        </Pressable>
      </ScrollView>
    </View>
  );
}
