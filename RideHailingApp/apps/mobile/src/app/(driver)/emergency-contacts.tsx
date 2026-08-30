import { useState } from "react";
import { Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// safety-center.tsx's "Emergency Contacts" row previously had no destination (a bare, unwired
// Pressable). No backend exists yet to store real contacts, so the list below is local component
// state, seeded with mock data -- "Add Contact" and "Remove" both just update that local state,
// same "frontend-only, functional in the UI" pattern as the rest of this project's un-backed
// screens. "Call" is real (Linking's `tel:`, same no-backend-needed pattern used throughout this
// project e.g. help-center.tsx's "Email Support" and safety-center.tsx's own SOS call).

type Contact = { id: string; name: string; relation: string; phone: string };

const INITIAL_CONTACTS: Contact[] = [
  { id: "1", name: "Amara K.", relation: "Spouse", phone: "+15551234567" },
  { id: "2", name: "David R.", relation: "Brother", phone: "+15559876543" },
];

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");

  const resetForm = () => {
    setName("");
    setRelation("");
    setPhone("");
    setAdding(false);
  };

  const handleAdd = () => {
    if (!name.trim() || !phone.trim()) return;
    setContacts((current) => [
      ...current,
      { id: `${Date.now()}`, name: name.trim(), relation: relation.trim() || "Contact", phone: phone.trim() },
    ]);
    resetForm();
  };

  const handleRemove = (id: string) => {
    setContacts((current) => current.filter((contact) => contact.id !== id));
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
            Emergency Contacts
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-4xl gap-stack-md px-container-margin py-stack-md pb-32"
      >
        <Text className="font-body-md text-body-md text-on-surface-variant">
          These contacts are notified automatically if an issue is detected during a trip.
        </Text>

        {contacts.map((contact) => (
          <View
            key={contact.id}
            className="flex-row items-center justify-between rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm"
          >
            <View className="flex-1 flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-container">
                <MaterialIcons name="person" size={24} color={themeColors.primary} />
              </View>
              <View className="flex-1">
                <Text className="font-body-md text-body-md font-semibold text-on-surface">
                  {contact.name}
                </Text>
                <Text className="font-label-sm text-label-sm text-on-surface-variant">
                  {contact.relation}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                className="h-11 w-11 items-center justify-center rounded-full bg-primary-container active:scale-95"
              >
                <MaterialIcons name="call" size={20} color={themeColors.onPrimaryContainer} />
              </Pressable>
              <Pressable
                onPress={() => handleRemove(contact.id)}
                className="h-11 w-11 items-center justify-center rounded-full bg-surface-container-highest active:scale-95"
              >
                <MaterialIcons name="close" size={18} color={themeColors.onSurfaceVariant} />
              </Pressable>
            </View>
          </View>
        ))}

        {adding ? (
          <View className="gap-stack-sm rounded-xl border border-primary bg-white p-stack-md shadow-sm">
            <TextInput
              className="min-h-[48px] rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-md text-body-md text-on-surface"
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor={themeColors.outline}
              autoFocus
            />
            <TextInput
              className="min-h-[48px] rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-md text-body-md text-on-surface"
              value={relation}
              onChangeText={setRelation}
              placeholder="Relationship (e.g. Spouse)"
              placeholderTextColor={themeColors.outline}
            />
            <TextInput
              className="min-h-[48px] rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-md text-body-md text-on-surface"
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={themeColors.outline}
              keyboardType="phone-pad"
            />
            <View className="flex-row justify-end gap-2">
              <Pressable onPress={resetForm} className="rounded-lg px-4 py-2">
                <Text className="font-body-md text-body-md text-secondary">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAdd}
                disabled={!name.trim() || !phone.trim()}
                className="rounded-lg bg-primary px-4 py-2"
                style={name.trim() && phone.trim() ? undefined : { opacity: 0.5 }}
              >
                <Text className="font-body-md text-body-md font-semibold text-on-primary">
                  Save Contact
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setAdding(true)}
            className="w-full flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant py-4 active:scale-[0.98]"
          >
            <MaterialIcons name="add" size={20} color={themeColors.primary} />
            <Text className="font-body-md text-body-md font-semibold text-primary">
              Add Contact
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
