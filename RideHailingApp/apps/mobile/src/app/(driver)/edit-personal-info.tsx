import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { useDriverProfile, useUpdateDriverProfile } from "@/hooks/use-driver-profile";
import { getApiErrorMessage } from "@/lib/api-client";

type FieldKey = "name" | "phone" | "email" | "address";

export default function EditPersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = useDriverProfile();
  const updateProfileMutation = useUpdateDriverProfile();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  const fields: {
    key: FieldKey;
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    value: string;
    setValue: (v: string) => void;
    keyboardType?: "default" | "phone-pad" | "email-address";
    multiline?: boolean;
    editable?: boolean;
    helper?: string;
  }[] = [
    {
      key: "name",
      label: "Full Legal Name",
      icon: "person",
      value: name,
      setValue: setName,
      editable: true,
    },
    {
      key: "phone",
      label: "Phone Number (Verified)",
      icon: "phone",
      value: phone,
      setValue: setPhone,
      keyboardType: "phone-pad",
      editable: false,
      helper: "Phone number is verified during registration.",
    },
    {
      key: "email",
      label: "Email Address",
      icon: "email",
      value: email,
      setValue: setEmail,
      keyboardType: "email-address",
      editable: false,
      helper: "Email is linked to your driver login.",
    },
    {
      key: "address",
      label: "Home Address",
      icon: "home",
      value: address,
      setValue: setAddress,
      multiline: true,
      editable: true,
    },
  ];

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMessage("Legal name cannot be empty.");
      return;
    }
    setErrorMessage(null);
    try {
      await updateProfileMutation.mutateAsync({ name: name.trim() });
      setSaved(true);
      setTimeout(() => router.back(), 800);
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, "Failed to update profile. Please try again."));
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
            Personal Information
          </Text>
          <View className="w-10" />
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

        {fields.map((field) => (
          <View key={field.key} className="gap-base">
            <Text className="font-label-sm text-label-sm text-on-surface-variant">
              {field.label}
            </Text>
            <View
              className={`relative rounded-lg border border-outline-variant ${
                field.editable === false
                  ? "bg-surface-container/50 opacity-80"
                  : "bg-surface-container-lowest"
              }`}
            >
              <View
                className="absolute left-0 z-10 pl-4"
                style={
                  field.multiline ? { top: 16 } : { top: 0, bottom: 0, justifyContent: "center" }
                }
                pointerEvents="none"
              >
                <MaterialIcons name={field.icon} size={16} color={themeColors.outline} />
              </View>
              <TextInput
                className="min-h-[56px] rounded-lg bg-transparent pl-12 pr-4 py-4 font-body-md text-body-md text-on-surface"
                value={field.value}
                onChangeText={field.setValue}
                keyboardType={field.keyboardType ?? "default"}
                multiline={field.multiline}
                numberOfLines={field.multiline ? 3 : undefined}
                textAlignVertical={field.multiline ? "top" : undefined}
                placeholder={field.multiline ? "Enter your full residential address" : undefined}
                placeholderTextColor={themeColors.outline}
                editable={field.editable !== false}
              />
            </View>
            {field.helper ? (
              <Text className="text-xs text-on-surface-variant">{field.helper}</Text>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View className="absolute bottom-0 left-0 z-40 w-full border-t border-surface-container-high bg-surface p-4">
        <Pressable
          onPress={handleSave}
          disabled={updateProfileMutation.isPending || saved}
          className="min-h-[56px] w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4 active:scale-[0.98]"
          style={{ opacity: updateProfileMutation.isPending ? 0.7 : 1 }}
        >
          {updateProfileMutation.isPending ? (
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
    </View>
  );
}
