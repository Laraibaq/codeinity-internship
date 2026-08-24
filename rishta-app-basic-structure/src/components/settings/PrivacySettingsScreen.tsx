import React from "react";
import { View, Text, Pressable, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import { PatternOverlay } from "../common/PatternOverlay";
import type {
  ScreenType,
  PrivacySettingsData,
  ToastType,
} from "../../types/settings";

interface PrivacySettingsScreenProps {
  onNavigate: (screen: ScreenType) => void;
  privacySettings: PrivacySettingsData;
  onUpdatePrivacy: (updated: Partial<PrivacySettingsData>) => void;
  showToast: (msg: string, type?: ToastType) => void;
}

export const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({
  onNavigate,
  privacySettings,
  onUpdatePrivacy,
  showToast,
}) => {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <PatternOverlay opacity={0.4} className="absolute inset-0" />

      <View className="border-b border-border-subtle bg-background flex-row justify-between items-center px-5 h-14 z-30">
        <Pressable
          onPress={() => onNavigate("settings")}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-container-highest/50"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow_back" size={20} color="#003527" />
        </Pressable>
        <Text className="font-display text-2xl font-bold text-primary">
          Privacy
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        className="flex-1 z-10"
        contentContainerClassName="px-5 pt-6 pb-24 gap-6"
      >
        {/* Photo Visibility */}
        <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle p-6 gap-4">
          <View className="flex-row items-start gap-4">
            <View className="w-10 h-10 rounded-full bg-surface-container-low items-center justify-center">
              <Icon name="visibility" size={20} color="#064e3b" />
            </View>
            <View className="flex-1">
              <Text className="font-display text-xl font-semibold text-on-surface">
                Photo Visibility
              </Text>
              <Text className="text-sm text-on-surface-variant mt-1 font-body">
                Control who can see your profile photos.
              </Text>
            </View>
          </View>

          <View className="bg-surface-container-low p-1 rounded-lg flex-row h-12 border border-border-subtle">
            {(["everyone", "interests"] as const).map((option) => {
              const selected = privacySettings.photoVisibility === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    onUpdatePrivacy({ photoVisibility: option });
                    showToast(
                      option === "everyone"
                        ? "Photo visibility set to Everyone"
                        : "Photo visibility restricted to Interests Only",
                      "success"
                    );
                  }}
                  className={`flex-1 rounded-md items-center justify-center ${
                    selected ? "bg-surface-white shadow-sm" : ""
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selected
                        ? "text-primary font-bold"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {option === "everyone" ? "Everyone" : "Interests Only"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Hide Profile */}
        <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle p-6">
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-row items-start gap-4 flex-1">
              <View className="w-10 h-10 rounded-full bg-surface-container-low items-center justify-center">
                <Icon name="visibility_off" size={20} color="#064e3b" />
              </View>
              <View className="flex-1">
                <Text className="font-display text-xl font-semibold text-on-surface">
                  Hide my profile from Explore
                </Text>
                <Text className="text-sm text-on-surface-variant mt-1 font-body">
                  When enabled, you won't appear in the Explore feed.
                </Text>
              </View>
            </View>
            <Switch
              value={privacySettings.hideProfile}
              onValueChange={(checked) => {
                onUpdatePrivacy({ hideProfile: checked });
                showToast(
                  checked
                    ? "Profile hidden from Explore"
                    : "Profile now visible in Explore"
                );
              }}
              trackColor={{ false: "#e4e2de", true: "#064e3b" }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Show Last Seen */}
        <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle p-6">
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-row items-start gap-4 flex-1">
              <View className="w-10 h-10 rounded-full bg-surface-container-low items-center justify-center">
                <Icon name="history" size={20} color="#064e3b" />
              </View>
              <View className="flex-1">
                <Text className="font-display text-xl font-semibold text-on-surface">
                  Show last seen
                </Text>
                <Text className="text-sm text-on-surface-variant mt-1 font-body">
                  Let others see when you were last active.
                </Text>
              </View>
            </View>
            <Switch
              value={privacySettings.showLastSeen}
              onValueChange={(checked) => {
                onUpdatePrivacy({ showLastSeen: checked });
                showToast(
                  checked
                    ? "Last seen timestamp active"
                    : "Last seen status hidden"
                );
              }}
              trackColor={{ false: "#e4e2de", true: "#064e3b" }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
