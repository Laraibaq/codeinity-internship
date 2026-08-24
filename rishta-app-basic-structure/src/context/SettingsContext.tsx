import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import type {
  ScreenType,
  ProfileOwnershipData,
  NotificationItem,
  SubscriptionPlan,
  DiscoveryPreferencesData,
  PrivacySettingsData,
  NotificationPreferencesData,
  BlockedProfile,
  ToastType,
} from "../types/settings";
import {
  initialProfileOwnership,
  initialNotifications,
  subscriptionPlans,
  boostPacks,
  initialBlockedProfiles,
  initialDiscoveryPreferences,
  initialPrivacySettings,
  initialNotificationPreferences,
} from "../data/settingsMock";

interface SettingsContextValue {
  currentScreen: ScreenType;
  setCurrentScreen: (s: ScreenType) => void;
  profileOwnership: ProfileOwnershipData;
  setProfileOwnership: React.Dispatch<React.SetStateAction<ProfileOwnershipData>>;
  notifications: NotificationItem[];
  plans: SubscriptionPlan[];
  currentPlanId: string;
  blockedProfiles: BlockedProfile[];
  discoveryPreferences: DiscoveryPreferencesData;
  privacySettings: PrivacySettingsData;
  notificationPreferences: NotificationPreferencesData;
  boostPacks: typeof boostPacks;
  toastMessage: string | null;
  toastType: ToastType;
  showToast: (msg: string, type?: ToastType) => void;
  clearToast: () => void;
  currentPlanName: string;
  unreadNotificationCount: number;
  handleSelectPlan: (planId: string) => void;
  handleUnblockProfile: (id: string) => void;
  handleBlockProfile: (name: string, age: number) => void;
  handleMarkAllNotificationsRead: () => void;
  setDiscoveryPreferences: React.Dispatch<
    React.SetStateAction<DiscoveryPreferencesData>
  >;
  setPrivacySettings: React.Dispatch<React.SetStateAction<PrivacySettingsData>>;
  setNotificationPreferences: React.Dispatch<
    React.SetStateAction<NotificationPreferencesData>
  >;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("settings");
  const [profileOwnership, setProfileOwnership] =
    useState<ProfileOwnershipData>(initialProfileOwnership);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(subscriptionPlans);
  const [currentPlanId, setCurrentPlanId] = useState("premium");
  const [blockedProfiles, setBlockedProfiles] = useState<BlockedProfile[]>(
    initialBlockedProfiles,
  );
  const [discoveryPreferences, setDiscoveryPreferences] =
    useState<DiscoveryPreferencesData>(initialDiscoveryPreferences);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettingsData>(
    initialPrivacySettings,
  );
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferencesData>(initialNotificationPreferences);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>("success");

  const showToast = useCallback((msg: string, type: ToastType = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const clearToast = useCallback(() => setToastMessage(null), []);

  const handleSelectPlan = useCallback((planId: string) => {
    setCurrentPlanId(planId);
    setPlans((prev) =>
      prev.map((p) => ({
        ...p,
        current: p.id === planId,
      })),
    );
  }, []);

  const handleUnblockProfile = useCallback((id: string) => {
    setBlockedProfiles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleBlockProfile = useCallback((name: string, age: number) => {
    setBlockedProfiles((prev) => [
      {
        id: `b_${Date.now()}`,
        name,
        age,
        blockedDate: "Just now",
      },
      ...prev,
    ]);
  }, []);

  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const currentPlan = plans.find((p) => p.id === currentPlanId) || plans[3];
  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const value = useMemo(
    () => ({
      currentScreen,
      setCurrentScreen,
      profileOwnership,
      setProfileOwnership,
      notifications,
      plans,
      currentPlanId,
      blockedProfiles,
      discoveryPreferences,
      privacySettings,
      notificationPreferences,
      boostPacks,
      toastMessage,
      toastType,
      showToast,
      clearToast,
      currentPlanName: currentPlan.name,
      unreadNotificationCount,
      handleSelectPlan,
      handleUnblockProfile,
      handleBlockProfile,
      handleMarkAllNotificationsRead,
      setDiscoveryPreferences,
      setPrivacySettings,
      setNotificationPreferences,
    }),
    [
      currentScreen,
      profileOwnership,
      notifications,
      plans,
      currentPlanId,
      blockedProfiles,
      discoveryPreferences,
      privacySettings,
      notificationPreferences,
      toastMessage,
      toastType,
      showToast,
      clearToast,
      currentPlan.name,
      unreadNotificationCount,
      handleSelectPlan,
      handleUnblockProfile,
      handleBlockProfile,
      handleMarkAllNotificationsRead,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
