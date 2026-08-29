import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SelectModal } from "@/components/select-modal";
import { themeColors } from "@/constants/theme-colors";

type Gender = "male" | "female" | "other";

// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this batch. Icon `size`
//   follows the inherited ancestor font-size where the source <span> has no explicit size class:
//   16px for the person/calendar_today/home input icons and the back arrow (page default, same
//   reasoning as every other screen so far), and 12px for the arrow_forward icon inside the
//   Continue button (inherits the button's text-label-sm) -- same "unintentionally small icon in a
//   primary button" case flagged on welcome.tsx and login.tsx.
// - This screen has a `md:hidden` mobile header and a separate `hidden md:flex` desktop header,
//   only one of which is ever visible depending on viewport width. Since this is a native phone
//   screen (always below that breakpoint), only the mobile header applies; the desktop header
//   block is dropped entirely, along with every other `md:*` override in this file (the desktop
//   card framing/padding on <main>, `md:relative` on the bottom action bar, etc.).
// - `position: fixed` (mobile header, bottom action bar) has no RN equivalent; substituted with
//   `absolute` pinned to the screen edges, as on every fixed-header screen in this batch.
// - `.stepper-line { transition: width 0.5s ease-in-out }` dropped: no RN equivalent for CSS
//   transitions without Reanimated (rule 5); the stepper bar renders at its static 16.66% width.
// Date of Birth: reverted from @react-native-community/datetimepicker -- that package requires
// native code and can't run in Expo Go at all (same category of problem as Mapbox needing
// @rnmapbox/maps + a custom dev client), so it's uninstalled entirely (package.json, app.json's
// plugins array, and this file's import are all clean of it). Rebuilt as a pure-JS picker using this
// project's own shared `SelectModal` component (@/components/select-modal, same one
// register-license-details.tsx's Issuing State and register-vehicle-model.tsx's Year of Manufacture
// use) instead of a single multi-column date modal, since SelectModal only handles one flat list at
// a time and a date needs three (day/month/year) -- three independent SelectModal instances chained
// from one tap: tapping the field opens the Month modal; selecting a month closes it and immediately
// opens the Day modal; selecting a day closes it and opens the Year modal; selecting a year closes
// the chain. Each modal has its own visibility state (not one shared "active step" variable) because
// SelectModal calls both `onSelect` and `onClose` on every pick -- sharing one state var across steps
// would let onClose's cleanup stomp the very "advance to the next step" update onSelect just made,
// since both fire synchronously in the same tap. Selecting all three formats the display as
// MM/DD/YYYY, matching the format the field always showed as a placeholder. Year options run 100
// years back from the current year (computed via `new Date().getFullYear()`, not hardcoded), a
// reasonable range for an adult driver's birth year.
// - The gender picker is a `grid grid-cols-3` of `<label>`s wrapping visually-hidden
//   (`sr-only`) radio inputs, styled selected/unselected via the CSS `:has(:checked)` relational
//   pseudo-class -- RN has neither CSS Grid nor a native radio input nor `:has()`. Substituted
//   with a `flex-row` of three equal-width (`flex-1`) Pressables (the standard RN grid->flexbox
//   substitution for a fixed column count), with a small local `useState` driving which one shows
//   the "selected" style. This is the one spot in this batch where reproducing the source's own
//   visual behavior (a selectable option that visibly highlights) requires *some* state, since
//   unlike a hover effect or CSS transition, "selected vs. not" has no meaning at all without it --
//   flagging this explicitly since it's a step beyond pure static rendering (no validation or
//   submission wiring is attached, it only drives which pill looks selected).
// - The photo-circle hover-to-edit overlay pattern from the Profile Photo screen doesn't appear
//   here; n/a to this file.

const genderOptions: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const MONTH_OPTIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 100 }, (_, i) => String(CURRENT_YEAR - i));

function formatDateOfBirth(month: string, day: string, year: string) {
  const mm = String(MONTH_OPTIONS.indexOf(month) + 1).padStart(2, "0");
  const dd = day.padStart(2, "0");
  return `${mm}/${dd}/${year}`;
}

export default function DriverRegisterPersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [gender, setGender] = useState<Gender | null>(null);
  const [dobMonth, setDobMonth] = useState<string | null>(null);
  const [dobDay, setDobDay] = useState<string | null>(null);
  const [dobYear, setDobYear] = useState<string | null>(null);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);

  const dobComplete = dobMonth && dobDay && dobYear;

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <View
        className="relative w-full max-w-[480px] flex-grow overflow-hidden bg-surface pb-24"
        style={{ paddingTop: 64 + insets.top }}
      >
        <View
          style={{ paddingTop: insets.top }}
          className="absolute left-0 right-0 top-0 z-50 w-full bg-surface"
        >
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

        <View className="px-6 pb-2 pt-6">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
              Step 2 of 10
            </Text>
            <Text className="font-label-sm text-label-sm font-semibold text-primary">
              Personal Info
            </Text>
          </View>
          <View className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
            <View className="h-full rounded-full bg-primary" style={{ width: "20%" }} />
          </View>
        </View>

        <ScrollView className="flex-grow px-6 py-4">
          <Text className="mb-stack-md font-headline-lg-mobile text-headline-lg-mobile leading-tight text-on-surface">
            Tell us about yourself
          </Text>
          <Text className="mb-stack-lg font-body-md text-body-md text-on-surface-variant">
            This information is required to verify your identity and perform background checks.
          </Text>

          <View className="gap-stack-md">
            <View className="gap-base">
              <Text className="font-label-sm text-label-sm text-on-surface-variant">
                Full Legal Name
              </Text>
              <View className="relative rounded-lg border border-outline-variant bg-surface-container-lowest">
                <View
                  className="absolute inset-y-0 left-0 z-10 justify-center pl-4"
                  pointerEvents="none"
                >
                  <MaterialIcons name="person" size={16} color={themeColors.outline} />
                </View>
                <TextInput
                  className="min-h-[56px] rounded-lg bg-transparent pl-12 pr-4 py-4 font-body-md text-body-md text-on-surface focus:border-primary"
                  placeholder="Enter your full name"
                />
              </View>
            </View>

            <View className="gap-base">
              <Text className="font-label-sm text-label-sm text-on-surface-variant">
                Date of Birth
              </Text>
              <Pressable
                onPress={() => setShowMonthModal(true)}
                className="relative rounded-lg border border-outline-variant bg-surface-container-lowest"
              >
                <View
                  className="absolute inset-y-0 left-0 z-10 justify-center pl-4"
                  pointerEvents="none"
                >
                  <MaterialIcons name="calendar-today" size={16} color={themeColors.outline} />
                </View>
                <View className="min-h-[56px] justify-center rounded-lg bg-transparent pl-12 pr-4 py-4">
                  <Text
                    className="font-body-md text-body-md"
                    style={{ color: dobComplete ? themeColors.onSurface : themeColors.outline }}
                  >
                    {dobComplete ? formatDateOfBirth(dobMonth, dobDay, dobYear) : "MM/DD/YYYY"}
                  </Text>
                </View>
              </Pressable>
              <SelectModal
                visible={showMonthModal}
                title="Month"
                options={MONTH_OPTIONS}
                selectedValue={dobMonth}
                onSelect={(value) => {
                  setDobMonth(value);
                  setShowMonthModal(false);
                  setShowDayModal(true);
                }}
                onClose={() => setShowMonthModal(false)}
              />
              <SelectModal
                visible={showDayModal}
                title="Day"
                options={DAY_OPTIONS}
                selectedValue={dobDay}
                onSelect={(value) => {
                  setDobDay(value);
                  setShowDayModal(false);
                  setShowYearModal(true);
                }}
                onClose={() => setShowDayModal(false)}
              />
              <SelectModal
                visible={showYearModal}
                title="Year"
                options={YEAR_OPTIONS}
                selectedValue={dobYear}
                onSelect={(value) => {
                  setDobYear(value);
                  setShowYearModal(false);
                }}
                onClose={() => setShowYearModal(false)}
              />
            </View>

            <View className="gap-base">
              <Text className="font-label-sm text-label-sm text-on-surface-variant">Gender</Text>
              <View className="flex-row gap-3">
                {genderOptions.map((option) => {
                  const selected = gender === option.value;
                  return (
                    // Fixed: this row's className used to interpolate the selected state into a
                    // template literal -- the same NativeWind runtime anti-pattern root-caused on
                    // login.tsx's phone/email toggle. className is now static; the state-dependent
                    // colors move to a plain `style` prop instead.
                    <Pressable
                      key={option.value}
                      onPress={() => setGender(option.value)}
                      className="min-h-[56px] flex-1 items-center justify-center rounded-lg border p-3"
                      style={{
                        borderColor: selected
                          ? themeColors.primaryContainer
                          : themeColors.outlineVariant,
                        backgroundColor: selected
                          ? themeColors.primaryContainer
                          : themeColors.surfaceContainerLowest,
                      }}
                    >
                      <Text
                        className="text-center font-body-md text-body-md font-medium"
                        style={{
                          color: selected ? themeColors.onPrimaryContainer : themeColors.onBackground,
                        }}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-base">
              <Text className="font-label-sm text-label-sm text-on-surface-variant">
                Home Address
              </Text>
              <View className="relative rounded-lg border border-outline-variant bg-surface-container-lowest">
                <View className="absolute left-0 top-0 z-10 pl-4 pt-4" pointerEvents="none">
                  <MaterialIcons name="home" size={16} color={themeColors.outline} />
                </View>
                <TextInput
                  className="min-h-[56px] rounded-lg bg-transparent pl-12 pr-4 py-4 font-body-md text-body-md text-on-surface"
                  placeholder="Enter your full residential address"
                  placeholderTextColor={themeColors.outline}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 z-40 w-full border-t border-surface-container-high bg-surface p-4">
          <Pressable
            onPress={() => router.push("/(driver-auth)/register-profile-photo")}
            className="min-h-[56px] w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4 active:scale-[0.98]"
            style={{
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <Text className="font-label-sm text-label-sm text-on-primary">
              Continue to Vehicle Details
            </Text>
            <MaterialIcons name="arrow-forward" size={12} color={themeColors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
