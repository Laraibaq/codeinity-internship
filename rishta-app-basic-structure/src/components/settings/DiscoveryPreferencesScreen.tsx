import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import type {
  ScreenType,
  DiscoveryPreferencesData,
  ToastType,
} from "../../types/settings";

interface DiscoveryPreferencesScreenProps {
  onNavigate: (screen: ScreenType) => void;
  preferences: DiscoveryPreferencesData;
  onSavePreferences: (updated: DiscoveryPreferencesData) => void;
  showToast: (msg: string, type?: ToastType) => void;
}

const MARITAL_STATUSES = ["Never Married", "Divorced", "Widowed", "Annulled"];
const RELIGIONS = ["Sunni", "Shia", "Just Muslim", "Other"];
const CITIES = [
  { id: "karachi", label: "Karachi" },
  { id: "lahore", label: "Lahore" },
  { id: "islamabad", label: "Islamabad" },
  { id: "dubai", label: "Dubai" },
  { id: "london", label: "London" },
  { id: "newyork", label: "New York" },
  { id: "toronto", label: "Toronto" },
];

export const DiscoveryPreferencesScreen: React.FC<
  DiscoveryPreferencesScreenProps
> = ({ onNavigate, preferences, onSavePreferences, showToast }) => {
  const [minAge, setMinAge] = useState(preferences.minAge);
  const [maxAge, setMaxAge] = useState(preferences.maxAge);
  const [location, setLocation] = useState(preferences.location);
  const [maritalStatus, setMaritalStatus] = useState<string[]>(
    preferences.maritalStatus
  );
  const [religionSect, setReligionSect] = useState<string[]>(
    preferences.religionSect
  );
  const [nonSmoker, setNonSmoker] = useState(preferences.nonSmoker);
  const [halalOnly, setHalalOnly] = useState(preferences.halalOnly);
  const [mustBeVerified, setMustBeVerified] = useState(
    preferences.mustBeVerified
  );

  const toggleMaritalStatus = (status: string) => {
    if (maritalStatus.includes(status)) {
      if (maritalStatus.length > 1) {
        setMaritalStatus(maritalStatus.filter((s) => s !== status));
      }
    } else {
      setMaritalStatus([...maritalStatus, status]);
    }
  };

  const toggleReligion = (rel: string) => {
    if (religionSect.includes(rel)) {
      if (religionSect.length > 1) {
        setReligionSect(religionSect.filter((r) => r !== rel));
      }
    } else {
      setReligionSect([...religionSect, rel]);
    }
  };

  const handleSave = () => {
    onSavePreferences({
      minAge,
      maxAge,
      location,
      maritalStatus,
      religionSect,
      nonSmoker,
      halalOnly,
      mustBeVerified,
    });
    showToast("Discovery preferences saved successfully!", "success");
  };

  const AgeStepper = ({
    label,
    value,
    onChange,
    min,
    max,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
  }) => (
    <View className="gap-2">
      <Text className="text-xs text-outline font-body">
        {label}: {value}
      </Text>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => value > min && onChange(value - 1)}
          className="w-10 h-10 rounded-full bg-surface-container-low border border-border-subtle items-center justify-center active:bg-surface-container"
        >
          <Icon name="remove" size={18} color="#003527" />
        </Pressable>
        <View className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <View
            className="h-full bg-primary-container rounded-full"
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
          />
        </View>
        <Pressable
          onPress={() => value < max && onChange(value + 1)}
          className="w-10 h-10 rounded-full bg-surface-container-low border border-border-subtle items-center justify-center active:bg-surface-container"
        >
          <Icon name="add" size={18} color="#003527" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="border-b border-border-subtle bg-background flex-row justify-between items-center px-5 h-14">
        <Pressable
          onPress={() => onNavigate("settings")}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-container-highest/50"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow_back" size={20} color="#003527" />
        </Pressable>
        <Text className="font-display text-2xl font-bold text-primary flex-1 text-center">
          Discovery
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-6 pb-36 gap-6"
      >
        <Text className="text-base text-on-surface-variant text-center px-4 font-body">
          These preferences shape who appears in your Explore feed.
        </Text>

        {/* Age Range */}
        <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle p-6 gap-6">
          <View className="flex-row justify-between items-center">
            <Text className="font-display text-xl font-semibold text-on-surface">
              Age Range
            </Text>
            <View className="bg-primary-fixed/30 px-3 py-1 rounded-full">
              <Text className="text-xs font-bold text-primary">
                {minAge} - {maxAge}
              </Text>
            </View>
          </View>

          <AgeStepper
            label="Minimum Age"
            value={minAge}
            onChange={(v) => v <= maxAge && setMinAge(v)}
            min={18}
            max={55}
          />
          <AgeStepper
            label="Maximum Age"
            value={maxAge}
            onChange={(v) => v >= minAge && setMaxAge(v)}
            min={20}
            max={60}
          />

          <View className="flex-row justify-between">
            <Text className="text-xs text-outline font-body">18</Text>
            <Text className="text-xs text-outline font-body">60+</Text>
          </View>
        </View>

        {/* Location */}
        <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle p-6 gap-4">
          <Text className="font-display text-xl font-semibold text-on-surface">
            Location
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CITIES.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setLocation(c.id)}
                className={`px-4 py-2 rounded-full border ${
                  location === c.id
                    ? "border-primary bg-primary"
                    : "border-border-subtle bg-background"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    location === c.id ? "text-white" : "text-on-surface"
                  }`}
                >
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className="text-sm text-on-surface-variant font-body">
            Showing profiles within standard radius of selected city.
          </Text>
        </View>

        {/* Marital Status */}
        <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle p-6 gap-4">
          <Text className="font-display text-xl font-semibold text-on-surface">
            Marital Status
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {MARITAL_STATUSES.map((status) => {
              const selected = maritalStatus.includes(status);
              return (
                <Pressable
                  key={status}
                  onPress={() => toggleMaritalStatus(status)}
                  className={`px-5 py-2.5 rounded-full border ${
                    selected
                      ? "border-primary bg-primary"
                      : "border-border-subtle bg-background"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selected ? "text-white" : "text-on-surface"
                    }`}
                  >
                    {status}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Religion & Sect */}
        <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle p-6 gap-4">
          <Text className="font-display text-xl font-semibold text-on-surface">
            Religion & Sect
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {RELIGIONS.map((rel) => {
              const selected = religionSect.includes(rel);
              return (
                <Pressable
                  key={rel}
                  onPress={() => toggleReligion(rel)}
                  className={`px-5 py-2.5 rounded-full border ${
                    selected
                      ? "border-primary bg-primary"
                      : "border-border-subtle bg-background"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selected ? "text-white" : "text-on-surface"
                    }`}
                  >
                    {rel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Dealbreakers */}
        <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle p-6 gap-2">
          <View className="mb-2">
            <View className="flex-row items-center gap-2">
              <Icon name="shield_alert" size={20} color="#B45309" />
              <Text className="font-display text-xl font-semibold text-on-surface">
                Dealbreakers
              </Text>
            </View>
            <Text className="text-sm text-on-surface-variant mt-1 font-body">
              Strict filters that will hide profiles entirely.
            </Text>
          </View>

          {[
            { label: "Must be non-smoker", value: nonSmoker, set: setNonSmoker },
            { label: "Must eat only halal", value: halalOnly, set: setHalalOnly },
            {
              label: "Must be verified",
              value: mustBeVerified,
              set: setMustBeVerified,
              icon: true,
            },
          ].map((item, idx) => (
            <View
              key={item.label}
              className={`flex-row justify-between items-center py-3 ${
                idx < 2 ? "border-b border-border-subtle" : ""
              }`}
            >
              <View className="flex-row items-center gap-1.5 flex-1 mr-3">
                <Text className="text-base text-on-surface font-medium font-body">
                  {item.label}
                </Text>
                {item.icon && (
                  <Icon name="check" size={16} color="#B45309" />
                )}
              </View>
              <Switch
                value={item.value}
                onValueChange={item.set}
                trackColor={{ false: "#e4e2de", true: "#064e3b" }}
                thumbColor="#ffffff"
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed Save Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-surface-white/90 border-t border-border-subtle p-5">
        <Pressable
          onPress={handleSave}
          className="w-full h-14 bg-primary rounded-xl shadow-lg items-center justify-center flex-row gap-2 active:bg-primary-container"
        >
          <Text className="text-white text-base font-semibold font-body">
            Save Preferences
          </Text>
          <Icon name="check" size={20} color="#ffffff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};
