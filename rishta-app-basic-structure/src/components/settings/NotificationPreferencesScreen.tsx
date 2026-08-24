import React from "react";
import { View, Text, Pressable, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import { PatternOverlay } from "../common/PatternOverlay";
import type {
  ScreenType,
  NotificationPreferencesData,
  ToastType,
} from "../../types/settings";

interface NotificationPreferencesScreenProps {
  onNavigate: (screen: ScreenType) => void;
  preferences: NotificationPreferencesData;
  onUpdatePreferences: (updated: Partial<NotificationPreferencesData>) => void;
  showToast: (msg: string, type?: ToastType) => void;
}

type PrefRow = {
  title: string;
  subtitle: string;
  showCheck?: boolean;
  keys: {
    push: keyof NotificationPreferencesData;
    inApp: keyof NotificationPreferencesData;
    sms: keyof NotificationPreferencesData;
    smsDisabled?: boolean;
  };
};

const ROWS: PrefRow[] = [
  {
    title: "New Interest",
    subtitle: "When someone sends an interest request.",
    keys: {
      push: "pushInterest",
      inApp: "inAppInterest",
      sms: "smsInterest",
      smsDisabled: true,
    },
  },
  {
    title: "Verification Decision",
    subtitle: "Updates on your profile verification status.",
    showCheck: true,
    keys: {
      push: "pushVerif",
      inApp: "inAppVerif",
      sms: "smsVerif",
    },
  },
  {
    title: "New Matches",
    subtitle: "When someone accepts your interest request.",
    keys: {
      push: "pushMatch",
      inApp: "inAppMatch",
      sms: "smsMatch",
    },
  },
];

export const NotificationPreferencesScreen: React.FC<
  NotificationPreferencesScreenProps
> = ({ onNavigate, preferences, onUpdatePreferences, showToast }) => {
  const toggle = (key: keyof NotificationPreferencesData) => {
    onUpdatePreferences({ [key]: !preferences[key] });
    showToast("Notification preference updated", "info");
  };

  const PrefSwitch = ({
    prefKey,
    disabled,
  }: {
    prefKey: keyof NotificationPreferencesData;
    disabled?: boolean;
  }) => (
    <Switch
      value={preferences[prefKey]}
      onValueChange={() => {
        if (!disabled) toggle(prefKey);
      }}
      disabled={disabled}
      trackColor={{ false: "#e4e2de", true: "#064e3b" }}
      thumbColor="#ffffff"
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="border-b border-border-subtle bg-background flex-row justify-between items-center px-5 h-14">
        <Pressable
          onPress={() => onNavigate("settings")}
          className="w-10 h-10 items-center justify-center -ml-2 rounded-full active:bg-surface-container-highest/50"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow_back" size={20} color="#003527" />
        </Pressable>
        <Text className="font-display text-xl font-bold text-primary flex-1 text-center">
          Notification Preferences
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-6 pb-24"
      >
        <Text className="text-base text-on-surface-variant leading-relaxed mb-6 font-body">
          Control how you want to be notified about activity on your profile. We
          recommend keeping Push notifications enabled for important updates.
        </Text>

        <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle overflow-hidden relative">
          <PatternOverlay opacity={0.4} />

          {/* Table Header */}
          <View className="flex-row p-4 border-b border-border-subtle bg-background/50 relative z-10">
            <View className="flex-1 justify-end">
              <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Event Type
              </Text>
            </View>
            <View className="flex-row gap-4">
              {[
                { icon: "smartphone", label: "Push" },
                { icon: "notifications", label: "In-App" },
                { icon: "message_square", label: "SMS" },
              ].map((col) => (
                <View key={col.label} className="w-14 items-center gap-1">
                  <Icon name={col.icon} size={20} color="#404944" />
                  <Text className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {col.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Rows */}
          {ROWS.map((row, idx) => (
            <View
              key={row.title}
              className={`p-4 relative z-10 ${idx < ROWS.length - 1 ? "border-b border-border-subtle" : ""}`}
            >
              <View className="flex-row items-center">
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="font-display text-base font-semibold text-on-surface">
                      {row.title}
                    </Text>
                    {row.showCheck && (
                      <Icon name="check" size={16} color="#B45309" />
                    )}
                  </View>
                  <Text className="text-xs text-on-surface-variant mt-1 font-body">
                    {row.subtitle}
                  </Text>
                </View>
                <View className="flex-row gap-4 items-center">
                  <View className="w-14 items-center">
                    <PrefSwitch prefKey={row.keys.push} />
                  </View>
                  <View className="w-14 items-center">
                    <PrefSwitch prefKey={row.keys.inApp} />
                  </View>
                  <View className="w-14 items-center opacity-50">
                    <PrefSwitch
                      prefKey={row.keys.sms}
                      disabled={row.keys.smsDisabled}
                    />
                  </View>
                </View>
              </View>
            </View>
          ))}

          <View className="bg-surface-container-low p-4 border-t border-border-subtle relative z-10">
            <View className="flex-row items-center justify-center gap-2">
              <Icon name="info" size={16} color="#404944" />
              <Text className="text-sm text-on-surface-variant font-body">
                Alerts go to the manager's phone number.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
