import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// Standalone screen for the Account tab's "Vehicle Profile" row. Distinct from
// register-vehicle-type.tsx on purpose: that screen is step 7 of the 10-step sign-up wizard (its
// own "Continue" pushes on to register-vehicle-model.tsx next), so reusing it here dropped an
// already-registered driver back into the middle of onboarding. This screen just shows/edits the
// vehicle already on file and stays on one screen.
//
// No backend to persist to yet (Vehicle entity per Dependencies.docx SS5) -- "Save" updates local
// state only, same "frontend-only, functional in the UI" pattern used across this project.

export default function VehicleProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [make, setMake] = useState("Toyota");
  const [model, setModel] = useState("Corolla");
  const [year, setYear] = useState("2021");
  const [plate, setPlate] = useState("LEA-4471");
  const [color, setColor] = useState("White");
  const [saved, setSaved] = useState(false);

  const fields = [
    { label: "Make", value: make, setValue: setMake },
    { label: "Model", value: model, setValue: setModel },
    { label: "Year", value: year, setValue: setYear, keyboardType: "number-pad" as const },
    { label: "License Plate", value: plate, setValue: setPlate },
    { label: "Color", value: color, setValue: setColor },
  ];

  const handleSave = () => {
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="w-full bg-surface shadow-sm">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Vehicle Profile
          </Text>
          <Pressable
            onPress={() => setEditing((prev) => !prev)}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons
              name={editing ? "close" : "edit"}
              size={22}
              color={themeColors.primary}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-4xl gap-stack-md px-container-margin py-stack-md pb-32"
      >
        <View className="flex-row items-center gap-4 rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-surface-container">
            <MaterialIcons name="directions-car" size={28} color={themeColors.primary} />
          </View>
          <View>
            <Text className="font-body-md text-body-md font-semibold text-on-surface">
              {make} {model} ({year})
            </Text>
            <Text className="font-label-sm text-label-sm text-on-surface-variant">
              Car &middot; MVP1 supported type
            </Text>
          </View>
        </View>

        <View className="gap-stack-md">
          {fields.map((field) => (
            <View key={field.label} className="gap-base">
              <Text className="font-label-sm text-label-sm text-on-surface-variant">
                {field.label}
              </Text>
              {editing ? (
                <TextInput
                  className="min-h-[56px] rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-4 font-body-md text-body-md text-on-surface"
                  value={field.value}
                  onChangeText={field.setValue}
                  keyboardType={field.keyboardType ?? "default"}
                />
              ) : (
                <View className="min-h-[56px] justify-center rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-4">
                  <Text className="font-body-md text-body-md text-on-surface">{field.value}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {editing ? (
        <View className="absolute bottom-0 left-0 z-40 w-full border-t border-surface-container-high bg-surface p-4">
          <Pressable
            onPress={handleSave}
            className="min-h-[56px] w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4 active:scale-[0.98]"
          >
            <MaterialIcons name={saved ? "check" : "save"} size={18} color={themeColors.onPrimary} />
            <Text className="font-label-sm text-label-sm text-on-primary">
              {saved ? "Saved" : "Save Changes"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
