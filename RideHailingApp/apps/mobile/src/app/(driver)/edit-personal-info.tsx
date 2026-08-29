import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// Standalone profile-edit screen for the Account tab's "Personal Information" row. Distinct from
// register-personal-info.tsx on purpose: that screen is step 2 of the 10-step sign-up wizard (its
// own "Continue" button pushes on to the next onboarding step, has a step-progress bar, etc.), so
// reusing it here dropped an already-registered driver back into the middle of onboarding with no
// way out except backing out of the whole stack. This screen instead just edits the fields and
// returns to Account on save.
//
// No backend to persist to yet -- "Save" updates local state and pops back, matching this project's
// existing "frontend-only, functional in the UI" pattern for screens with no wired API (e.g. the
// Settings screen's notification toggles).

type FieldKey = "name" | "phone" | "email" | "address";

export default function EditPersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("Marcus T.");
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  const [email, setEmail] = useState("alex.thompson@example.com");
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState(false);

  const fields: { key: FieldKey; label: string; icon: keyof typeof MaterialIcons.glyphMap; value: string; setValue: (v: string) => void; keyboardType?: "default" | "phone-pad" | "email-address"; multiline?: boolean }[] = [
    { key: "name", label: "Full Legal Name", icon: "person", value: name, setValue: setName },
    { key: "phone", label: "Phone Number", icon: "phone", value: phone, setValue: setPhone, keyboardType: "phone-pad" },
    { key: "email", label: "Email Address", icon: "email", value: email, setValue: setEmail, keyboardType: "email-address" },
    { key: "address", label: "Home Address", icon: "home", value: address, setValue: setAddress, multiline: true },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => router.back(), 500);
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
        {fields.map((field) => (
          <View key={field.key} className="gap-base">
            <Text className="font-label-sm text-label-sm text-on-surface-variant">
              {field.label}
            </Text>
            <View className="relative rounded-lg border border-outline-variant bg-surface-container-lowest">
              {/* Fixed: className used to interpolate the multiline-dependent position/alignment
                  into a template literal -- the same NativeWind runtime anti-pattern root-caused on
                  login.tsx's phone/email toggle. className is now static; the position difference
                  moves to a plain `style` prop instead. */}
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
              />
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="absolute bottom-0 left-0 z-40 w-full border-t border-surface-container-high bg-surface p-4">
        <Pressable
          onPress={handleSave}
          className="min-h-[56px] w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4 active:scale-[0.98]"
        >
          <MaterialIcons
            name={saved ? "check" : "save"}
            size={18}
            color={themeColors.onPrimary}
          />
          <Text className="font-label-sm text-label-sm text-on-primary">
            {saved ? "Saved" : "Save Changes"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
