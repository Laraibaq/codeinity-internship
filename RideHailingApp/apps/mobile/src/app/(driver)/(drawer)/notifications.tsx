import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import {
  useDriverNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  type NotificationItem,
} from "@/hooks/use-notifications";

function getNotificationIcon(type: NotificationItem["type"]): keyof typeof MaterialIcons.glyphMap {
  switch (type) {
    case "ride":
      return "directions-car";
    case "account":
      return "account-circle";
    case "support":
      return "support-agent";
    case "system":
      return "info";
    default:
      return "notifications";
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    if (Number.isNaN(diffMs)) return "Recently";
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "Recently";
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, isRefetching, refetch } = useDriverNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount ?? notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || markAllRead.isPending) return;
    markAllRead.mutate();
  };

  const handleMarkRead = (item: NotificationItem) => {
    if (!item.isRead && !markRead.isPending) {
      markRead.mutate(item.id);
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
            Notifications
          </Text>
          <Pressable
            onPress={handleMarkAllRead}
            disabled={unreadCount === 0 || markAllRead.isPending}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            {markAllRead.isPending ? (
              <ActivityIndicator size="small" color={themeColors.primary} />
            ) : (
              <MaterialIcons
                name="done-all"
                size={22}
                color={unreadCount === 0 ? themeColors.outlineVariant : themeColors.primary}
              />
            )}
          </Pressable>
        </View>
      </View>

      {isLoading && !data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text className="mt-3 font-body-md text-body-md text-on-surface-variant">
            Loading notifications...
          </Text>
        </View>
      ) : isError ? (
        <View className="mx-auto my-auto w-full max-w-sm items-center gap-3 px-container-margin">
          <MaterialIcons name="error-outline" size={48} color={themeColors.error} />
          <Text className="text-center font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">
            Unable to load notifications
          </Text>
          <Text className="text-center font-body-md text-body-md text-on-surface-variant">
            There was a problem fetching your notifications from the server.
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-2 rounded-full bg-primary px-6 py-2.5 active:scale-95"
          >
            <Text className="font-label-sm text-label-sm font-semibold text-on-primary">
              Retry
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="mx-auto w-full max-w-4xl gap-stack-sm px-container-margin py-stack-md pb-32"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={themeColors.primary}
            />
          }
        >
          {notifications.length === 0 ? (
            <View className="items-center justify-center py-16">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-surface-container">
                <MaterialIcons name="notifications-none" size={32} color={themeColors.outline} />
              </View>
              <Text className="font-headline-lg-mobile text-headline-lg-mobile font-semibold text-on-surface">
                No notifications yet
              </Text>
              <Text className="mt-2 max-w-xs text-center font-body-md text-body-md text-on-surface-variant">
                You're all caught up! Updates about rides, account, and support will appear here.
              </Text>
            </View>
          ) : (
            notifications.map((notification) => {
              const iconName = getNotificationIcon(notification.type);
              const timeLabel = formatRelativeTime(notification.createdAt);

              return (
                <Pressable
                  key={notification.id}
                  onPress={() => handleMarkRead(notification)}
                  className="flex-row items-start gap-3 rounded-xl border p-stack-md shadow-sm active:scale-[0.98]"
                  style={{
                    borderColor: notification.isRead
                      ? `${themeColors.outlineVariant}4d`
                      : `${themeColors.primary}4d`,
                    backgroundColor: notification.isRead
                      ? "#ffffff"
                      : `${themeColors.primaryFixed}33`,
                  }}
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container">
                    <MaterialIcons name={iconName} size={20} color={themeColors.primary} />
                  </View>
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-body-md text-body-md font-semibold text-on-surface">
                        {notification.title}
                      </Text>
                      {!notification.isRead ? (
                        <View className="h-2 w-2 rounded-full bg-primary" />
                      ) : null}
                    </View>
                    <Text className="font-body-md text-body-md text-on-surface-variant">
                      {notification.message}
                    </Text>
                    <Text className="font-label-sm text-[11px] text-on-surface-variant">
                      {timeLabel}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
