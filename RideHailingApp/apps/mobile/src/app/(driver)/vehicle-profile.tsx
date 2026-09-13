import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { useDriverVehicle, useUpdateDriverVehicle } from "@/hooks/use-driver-profile";
import { getApiErrorMessage } from "@/lib/api-client";

export default function VehicleProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: vehicle, isLoading, isError, refetch } = useDriverVehicle();
  const updateVehicleMutation = useUpdateDriverVehicle();

  const [editing, setEditing] = useState(false);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("2021");
  const [plate, setPlate] = useState("");
  const [color, setColor] = useState("");
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (vehicle) {
      setMake(vehicle.make || "");
      setModel(vehicle.model || "");
      setColor(vehicle.color || "");
      setPlate(vehicle.registrationNumber || "");
    }
  }, [vehicle]);

  const fields = [
    { label: "Make", value: make, setValue: setMake, placeholder: "e.g. Toyota" },
    { label: "Model", value: model, setValue: setModel, placeholder: "e.g. Corolla" },
    { label: "Year", value: year, setValue: setYear, keyboardType: "number-pad" as const, placeholder: "e.g. 2021" },
    { label: "License Plate", value: plate, setValue: setPlate, placeholder: "e.g. LEA-4471" },
    { label: "Color", value: color, setValue: setColor, placeholder: "e.g. White" },
  ];

  const handleSave = async () => {
    setErrorMessage(null);
    try {
      await updateVehicleMutation.mutateAsync({
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        color: color.trim() || undefined,
        registrationNumber: plate.trim() || undefined,
      });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, "Failed to update vehicle. Please try again."));
    }
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
        {errorMessage ? (
          <View className="flex-row items-center gap-2 rounded-xl border border-error bg-error-container/20 p-4">
            <MaterialIcons name="error-outline" size={20} color={themeColors.error} />
            <Text className="flex-1 font-body-md text-sm text-error">{errorMessage}</Text>
          </View>
        ) : null}

        {isError ? (
          <View className="flex-row items-center justify-between rounded-xl border border-error bg-error-container/20 p-4">
            <Text className="flex-1 font-body-md text-sm text-error">
              Unable to load vehicle details.
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="rounded-lg bg-primary px-3 py-1.5 active:scale-95"
            >
              <Text className="font-label-sm text-xs font-semibold text-on-primary">Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <View className="flex-row items-center gap-4 rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-surface-container">
            {isLoading && !vehicle ? (
              <ActivityIndicator size="small" color={themeColors.primary} />
            ) : (
              <MaterialIcons name="directions-car" size={28} color={themeColors.primary} />
            )}
          </View>
          <View>
            <Text className="font-body-md text-body-md font-semibold text-on-surface">
              {make || "Vehicle"} {model || "Profile"} {year ? `(${year})` : ""}
            </Text>
            <Text className="font-label-sm text-label-sm text-on-surface-variant">
              {(vehicle?.type ?? "car").toUpperCase()} &middot; MVP1 supported type
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
                  placeholder={field.placeholder}
                  placeholderTextColor={themeColors.outline}
                  keyboardType={field.keyboardType ?? "default"}
                />
              ) : (
                <View className="min-h-[56px] justify-center rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-4">
                  <Text className="font-body-md text-body-md text-on-surface">
                    {field.value || "Not specified"}
                  </Text>
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
            disabled={updateVehicleMutation.isPending || saved}
            className="min-h-[56px] w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4 active:scale-[0.98]"
            style={{ opacity: updateVehicleMutation.isPending ? 0.7 : 1 }}
          >
            {updateVehicleMutation.isPending ? (
              <>
                <ActivityIndicator size="small" color={themeColors.onPrimary} />
                <Text className="font-label-sm text-label-sm text-on-primary">Saving...</Text>
              </>
            ) : saved ? (
              <>
                <MaterialIcons name="check" size={18} color={themeColors.onPrimary} />
                <Text className="font-label-sm text-label-sm text-on-primary">Saved</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="save" size={18} color={themeColors.onPrimary} />
                <Text className="font-label-sm text-label-sm text-on-primary">Save Changes</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
