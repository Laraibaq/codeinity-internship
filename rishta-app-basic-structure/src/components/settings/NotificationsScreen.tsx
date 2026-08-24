import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import type { ScreenType, NotificationItem, ToastType } from "../../types/settings";

interface NotificationsScreenProps {
  onNavigate: (screen: ScreenType) => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  showToast: (msg: string, type?: ToastType) => void;
}

const getIconForType = (type: NotificationItem["type"]) => {
  switch (type) {
    case "interest":
      return { name: "heart", color: "#003527" };
    case "match":
      return { name: "handshake", color: "#fd8a42" };
    case "verification":
      return { name: "check_circle", color: "#047857" };
    case "digest":
      return { name: "auto_awesome", color: "#404944" };
    case "view":
      return { name: "lock", color: "#B45309" };
    case "boost":
      return { name: "bolt", color: "#404944" };
    case "subscription":
      return { name: "payments", color: "#93000a" };
    default:
      return { name: "auto_awesome", color: "#003527" };
  }
};

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onNavigate,
  notifications,
  onMarkAllRead,
  showToast,
}) => {
  const todayNotifications = notifications.filter(
    (n) => n.time.includes("m") || n.time.includes("h") || n.time === "Just now"
  );
  const earlierNotifications = notifications.filter(
    (n) => !todayNotifications.includes(n)
  );

  const handleNotificationPress = (n: NotificationItem) => {
    if (n.type === "view" || n.type === "subscription") {
      onNavigate("subscription");
    } else if (n.type === "boost") {
      onNavigate("boost");
    }
  };

  const renderNotification = (
    n: NotificationItem,
    variant: "today" | "earlier"
  ) => {
    const icon = getIconForType(n.type);
    const isViewType = n.type === "view";
    const isSubscriptionType = n.type === "subscription";

    return (
      <Pressable
        key={n.id}
        onPress={() => handleNotificationPress(n)}
        className={`rounded-xl p-4 border mb-3 active:opacity-90 ${
          variant === "today"
            ? `bg-surface-white border-border-subtle shadow-sm ${!n.read ? "border-l-4 border-l-primary" : ""}`
            : isViewType
              ? "bg-background border-gold/30 shadow-sm"
              : "bg-surface-white border-border-subtle opacity-90 shadow-sm"
        }`}
      >
        <View className="flex-row items-start gap-4">
          {n.avatar ? (
            <Image
              source={{ uri: n.avatar }}
              className="w-12 h-12 rounded-full border-2 border-white"
              contentFit="cover"
            />
          ) : (
            <View
              className={`w-12 h-12 rounded-full items-center justify-center ${
                isViewType
                  ? "bg-gold/10"
                  : isSubscriptionType
                    ? "bg-error-container"
                    : "bg-surface-container-low"
              }`}
            >
              <Icon name={icon.name} size={20} color={icon.color} />
            </View>
          )}
          <View className="flex-1">
            <View className="flex-row justify-between items-start mb-1 gap-2">
              <Text className="font-display text-base font-semibold text-on-surface flex-1">
                {n.title}
              </Text>
              <Text className="text-xs text-on-surface-variant font-body">
                {n.time}
              </Text>
            </View>
            <Text className="text-sm text-on-surface-variant leading-relaxed font-body">
              {n.subtitle}
            </Text>
            {n.actionText && (
              <View className="flex-row items-center gap-1 mt-1">
                <Text className="text-xs font-semibold text-gold font-body">
                  {n.actionText}
                </Text>
                <Icon name="arrow_forward" size={14} color="#B45309" />
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

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
        <Text className="font-display text-2xl font-bold text-primary">
          Rishta
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-24"
      >
        <View className="px-5 pt-6 pb-4 flex-row justify-between items-end">
          <View className="flex-1 mr-3">
            <Text className="font-display text-2xl font-bold text-primary mb-1">
              Notifications
            </Text>
            <Text className="text-sm text-on-surface-variant font-body">
              Stay updated on your journey.
            </Text>
          </View>
          <Pressable
            onPress={() => {
              onMarkAllRead();
              showToast("All notifications marked as read", "info");
            }}
            className="py-2 px-3 rounded-full active:bg-primary/5"
          >
            <Text className="text-xs font-semibold text-primary font-body">
              Mark all read
            </Text>
          </Pressable>
        </View>

        <View className="px-5">
          {todayNotifications.map((n) => renderNotification(n, "today"))}

          {earlierNotifications.length > 0 && (
            <>
              <View className="flex-row items-center gap-4 py-2 mt-2 mb-1">
                <View className="h-px bg-border-subtle flex-1" />
                <Text className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Yesterday
                </Text>
                <View className="h-px bg-border-subtle flex-1" />
              </View>

              {earlierNotifications.map((n) =>
                renderNotification(n, "earlier")
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
