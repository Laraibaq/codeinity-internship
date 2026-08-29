import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// New screen: every 🔔 bell icon across the driver app previously had no destination at all
// (bare, unwired Pressables on account.tsx, earnings.tsx, and settings.tsx). No backend push/
// notification feed exists yet, so this uses representative mock data and purely local
// read/unread state -- same "frontend-only, functional UI" pattern as the rest of this project's
// un-backed screens (e.g. Settings' notification toggles).

type NotificationItem = {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    icon: "payments",
    title: "Payout available",
    message: "Your earnings for last week are ready to withdraw.",
    time: "10m ago",
    read: false,
  },
  {
    id: "2",
    icon: "star",
    title: "New 5-star rating",
    message: "Sarah K. left you a 5-star review.",
    time: "2h ago",
    read: false,
  },
  {
    id: "3",
    icon: "verified",
    title: "Documents approved",
    message: "Your driver's license was verified successfully.",
    time: "1d ago",
    read: true,
  },
  {
    id: "4",
    icon: "campaign",
    title: "Surge pricing nearby",
    message: "Demand is high in your area right now.",
    time: "2d ago",
    read: true,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
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
            Notifications
          </Text>
          <Pressable
            onPress={markAllRead}
            disabled={unreadCount === 0}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons
              name="done-all"
              size={22}
              color={unreadCount === 0 ? themeColors.outlineVariant : themeColors.primary}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-4xl gap-stack-sm px-container-margin py-stack-md pb-32"
      >
        {notifications.map((notification) => (
          // Fixed: className used to interpolate the read/unread border+background into a template
          // literal -- the same NativeWind runtime anti-pattern root-caused on login.tsx's
          // phone/email toggle. className is now static; the read-dependent colors move to a plain
          // `style` prop instead.
          <Pressable
            key={notification.id}
            onPress={() => markRead(notification.id)}
            className="flex-row items-start gap-3 rounded-xl border p-stack-md shadow-sm active:scale-[0.98]"
            style={{
              borderColor: notification.read
                ? `${themeColors.outlineVariant}4d`
                : `${themeColors.primary}4d`,
              backgroundColor: notification.read ? "#ffffff" : `${themeColors.primaryFixed}33`,
            }}
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container">
              <MaterialIcons name={notification.icon} size={20} color={themeColors.primary} />
            </View>
            <View className="flex-1 gap-1">
              <View className="flex-row items-center justify-between">
                <Text className="font-body-md text-body-md font-semibold text-on-surface">
                  {notification.title}
                </Text>
                {!notification.read ? (
                  <View className="h-2 w-2 rounded-full bg-primary" />
                ) : null}
              </View>
              <Text className="font-body-md text-body-md text-on-surface-variant">
                {notification.message}
              </Text>
              <Text className="font-label-sm text-[11px] text-on-surface-variant">
                {notification.time}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
