import React, { useEffect } from "react";
import { View, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { useSettings } from "../src/context/SettingsContext";
import { SettingsScreen } from "../src/components/settings/SettingsScreen";
import { ProfileOwnershipScreen } from "../src/components/settings/ProfileOwnershipScreen";
import { SubscriptionScreen } from "../src/components/settings/SubscriptionScreen";
import { SafetyCenterScreen } from "../src/components/settings/SafetyCenterScreen";
import { BoostScreen } from "../src/components/settings/BoostScreen";
import { PrivacySettingsScreen } from "../src/components/settings/PrivacySettingsScreen";
import { NotificationsScreen } from "../src/components/settings/NotificationsScreen";
import { DiscoveryPreferencesScreen } from "../src/components/settings/DiscoveryPreferencesScreen";
import { NotificationPreferencesScreen } from "../src/components/settings/NotificationPreferencesScreen";
import { Toast } from "../src/components/settings/Toast";
import { Icon } from "../src/components/common/Icon";
import type { ScreenType } from "../src/types/settings";

export default function SettingsRoute() {
  const router = useRouter();
  const s = useSettings();

  useEffect(() => {
    s.setCurrentScreen("settings");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on mount
  }, []);

  const handleNavigate = (screen: ScreenType) => {
    // SettingsScreen uses "discovery" as back — exit to app instead
    if (screen === "discovery" && s.currentScreen === "settings") {
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)/profile");
      return;
    }
    s.setCurrentScreen(screen);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="absolute top-2 left-3 z-50">
        <Pressable
          onPress={() => {
            if (s.currentScreen !== "settings") {
              s.setCurrentScreen("settings");
              return;
            }
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
          className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-surface-white border border-border-subtle"
        >
          <Icon name="arrow_back" size={16} color="#003527" />
          <Text className="font-body text-xs text-primary font-semibold">
            {s.currentScreen === "settings" ? "Back" : "Settings"}
          </Text>
        </Pressable>
      </View>

      {s.currentScreen === "settings" && (
        <SettingsScreen
          onNavigate={handleNavigate}
          profileOwnership={s.profileOwnership}
          privacySettings={s.privacySettings}
          onUpdatePrivacy={(updated) =>
            s.setPrivacySettings((prev) => ({ ...prev, ...updated }))
          }
          currentPlanName={s.currentPlanName}
          showToast={s.showToast}
        />
      )}

      {s.currentScreen === "ownership" && (
        <ProfileOwnershipScreen
          onNavigate={handleNavigate}
          profileOwnership={s.profileOwnership}
          onUpdateOwnership={s.setProfileOwnership}
          showToast={s.showToast}
        />
      )}

      {s.currentScreen === "subscription" && (
        <SubscriptionScreen
          onNavigate={handleNavigate}
          plans={s.plans}
          currentPlanId={s.currentPlanId}
          onSelectPlan={s.handleSelectPlan}
          showToast={s.showToast}
        />
      )}

      {s.currentScreen === "safety" && (
        <SafetyCenterScreen
          onNavigate={handleNavigate}
          blockedProfiles={s.blockedProfiles}
          onUnblockProfile={s.handleUnblockProfile}
          onBlockProfile={s.handleBlockProfile}
          showToast={s.showToast}
        />
      )}

      {s.currentScreen === "boost" && (
        <BoostScreen
          onNavigate={handleNavigate}
          boostPacks={s.boostPacks}
          showToast={s.showToast}
        />
      )}

      {s.currentScreen === "privacy" && (
        <PrivacySettingsScreen
          onNavigate={handleNavigate}
          privacySettings={s.privacySettings}
          onUpdatePrivacy={(updated) =>
            s.setPrivacySettings((prev) => ({ ...prev, ...updated }))
          }
          showToast={s.showToast}
        />
      )}

      {s.currentScreen === "notifications" && (
        <NotificationsScreen
          onNavigate={handleNavigate}
          notifications={s.notifications}
          onMarkAllRead={s.handleMarkAllNotificationsRead}
          showToast={s.showToast}
        />
      )}

      {s.currentScreen === "discovery" && (
        <DiscoveryPreferencesScreen
          onNavigate={handleNavigate}
          preferences={s.discoveryPreferences}
          onSavePreferences={s.setDiscoveryPreferences}
          showToast={s.showToast}
        />
      )}

      {s.currentScreen === "notification-preferences" && (
        <NotificationPreferencesScreen
          onNavigate={handleNavigate}
          preferences={s.notificationPreferences}
          onUpdatePreferences={(updated) =>
            s.setNotificationPreferences((prev) => ({ ...prev, ...updated }))
          }
          showToast={s.showToast}
        />
      )}

      <Toast
        message={s.toastMessage}
        type={s.toastType}
        onClose={s.clearToast}
      />
    </View>
  );
}
