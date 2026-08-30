import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// New screen: safety-center.tsx's "Emergency Contacts" row previously had no destination (a bare,
// unwired Pressable). No backend exists yet to store real contacts, so this uses mock data --
// "Call" is real (Linking's `tel:`, same no-backend-needed pattern used throughout this project
// e.g. help-center.tsx's "Email Support" and safety-center.tsx's own SOS call).

const CONTACTS = [
  { name: "Amara K.", relation: "Spouse", phone: "+15551234567" },
  { name: "David R.", relation: "Brother", phone: "+15559876543" },
];

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

        {CONTACTS.map((contact) => (
          <View
            key={contact.phone}
            className="flex-row items-center justify-between rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm"
          >
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-container">
                <MaterialIcons name="person" size={24} color={themeColors.primary} />
              </View>
              <View>
                <Text className="font-body-md text-body-md font-semibold text-on-surface">
                  {contact.name}
                </Text>
                <Text className="font-label-sm text-label-sm text-on-surface-variant">
                  {contact.relation}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => Linking.openURL(`tel:${contact.phone}`)}
              className="h-11 w-11 items-center justify-center rounded-full bg-primary-container active:scale-95"
            >
              <MaterialIcons name="call" size={20} color={themeColors.onPrimaryContainer} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
