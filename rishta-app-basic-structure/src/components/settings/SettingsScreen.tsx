import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import { PatternOverlay } from "../common/PatternOverlay";
import type {
  ScreenType,
  ProfileOwnershipData,
  PrivacySettingsData,
  ToastType,
} from "../../types/settings";

interface SettingsScreenProps {
  onNavigate: (screen: ScreenType) => void;
  profileOwnership: ProfileOwnershipData;
  privacySettings: PrivacySettingsData;
  onUpdatePrivacy: (updated: Partial<PrivacySettingsData>) => void;
  currentPlanName: string;
  showToast: (msg: string, type?: ToastType) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigate,
  profileOwnership,
  privacySettings,
  onUpdatePrivacy,
  currentPlanName,
  showToast,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogOutModal, setShowLogOutModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-1 relative">
        <View className="border-b border-border-subtle bg-background flex-row justify-between items-center px-5 h-16">
          <Pressable
            onPress={() => onNavigate("discovery")}
            className="w-12 h-12 items-center justify-start active:opacity-70"
            accessibilityLabel="Go back"
          >
            <Icon name="arrow_back" size={24} color="#404944" />
          </Pressable>
          <Text className="font-display text-2xl font-bold text-rich-green absolute left-0 right-0 text-center">
            Settings
          </Text>
          <View className="w-12" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 py-6 pb-24 gap-6"
        >
          <PatternOverlay opacity={0.5} />

          {/* Subscription */}
          <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
            <View className="p-4 border-b border-border-subtle flex-row justify-between items-center bg-surface-container-low">
              <View className="flex-1 mr-3">
                <Text className="font-display text-xl font-semibold text-primary-container">
                  Current Plan: {currentPlanName}
                </Text>
                <Text className="text-sm text-on-surface-variant mt-1 font-body">
                  14 Interest Requests Remaining
                </Text>
              </View>
              <Pressable
                onPress={() => onNavigate("subscription")}
                className="bg-gold px-4 py-2 rounded-full active:opacity-90"
              >
                <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                  Upgrade
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Account */}
          <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
            <Text className="text-xs font-semibold text-outline px-4 pt-4 pb-2 uppercase tracking-widest">
              Account
            </Text>
            <View className="border-t border-border-subtle">
              <Pressable className="flex-row justify-between items-center px-4 py-4 active:bg-surface-container-low">
                <View className="flex-row items-center gap-3">
                  <Icon name="smartphone" size={20} color="#404944" />
                  <View>
                    <Text className="text-base text-on-surface font-body">
                      +92 300 1234567
                    </Text>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Icon name="check_circle" size={14} color="#B45309" fill />
                      <Text className="text-xs font-semibold text-gold">
                        Verified
                      </Text>
                    </View>
                  </View>
                </View>
                <Icon name="chevron_right" size={20} color="#bfc9c3" />
              </Pressable>

              <View className="h-px bg-border-subtle" />

              <Pressable className="flex-row justify-between items-center px-4 py-4 active:bg-surface-container-low">
                <View className="flex-row items-center gap-3">
                  <Icon name="mail" size={20} color="#404944" />
                  <Text className="text-base text-on-surface font-body">
                    user@example.com
                  </Text>
                </View>
                <Icon name="chevron_right" size={20} color="#bfc9c3" />
              </Pressable>

              <View className="h-px bg-border-subtle" />

              <Pressable
                onPress={() => onNavigate("ownership")}
                className="flex-row justify-between items-center px-4 py-4 active:bg-surface-container-low"
              >
                <View className="flex-row items-center gap-3">
                  <Icon name="family_restroom" size={20} color="#404944" />
                  <View>
                    <Text className="text-base text-on-surface font-body">
                      Profile Ownership
                    </Text>
                    <Text className="text-sm text-on-surface-variant mt-0.5">
                      {profileOwnership.owner}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron_right" size={20} color="#bfc9c3" />
              </Pressable>
            </View>
          </View>

          {/* Discovery Preferences */}
          <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
            <Text className="text-xs font-semibold text-outline px-4 pt-4 pb-2 uppercase tracking-widest">
              Discovery Preferences
            </Text>
            <View className="border-t border-border-subtle">
              {[
                { icon: "tune", label: "Age, City, Marital Status" },
                { icon: "building_2", label: "Religion & Sect" },
                { icon: "block", label: "Dealbreakers" },
              ].map((item, idx) => (
                <React.Fragment key={item.label}>
                  {idx > 0 && <View className="h-px bg-border-subtle" />}
                  <Pressable
                    onPress={() => onNavigate("discovery")}
                    className="flex-row justify-between items-center px-4 py-4 active:bg-surface-container-low"
                  >
                    <View className="flex-row items-center gap-3">
                      <Icon name={item.icon} size={20} color="#404944" />
                      <Text className="text-base text-on-surface font-body">
                        {item.label}
                      </Text>
                    </View>
                    <Icon name="chevron_right" size={20} color="#bfc9c3" />
                  </Pressable>
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Privacy & Safety */}
          <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
            <Text className="text-xs font-semibold text-outline px-4 pt-4 pb-2 uppercase tracking-widest">
              Privacy & Safety
            </Text>
            <View className="border-t border-border-subtle">
              <View className="flex-row justify-between items-center px-4 py-4">
                <View className="flex-row items-center gap-3 flex-1 mr-3">
                  <Icon name="visibility_off" size={20} color="#404944" />
                  <View className="flex-1">
                    <Text className="text-base text-on-surface font-body">
                      Hide Profile
                    </Text>
                    <Text className="text-sm text-on-surface-variant mt-0.5">
                      Not visible in discovery
                    </Text>
                  </View>
                </View>
                <Switch
                  value={privacySettings.hideProfile}
                  onValueChange={(checked) => {
                    onUpdatePrivacy({ hideProfile: checked });
                    showToast(
                      checked
                        ? "Profile hidden from discovery"
                        : "Profile now visible in discovery"
                    );
                  }}
                  trackColor={{ false: "#e4e2de", true: "#064e3b" }}
                  thumbColor="#ffffff"
                />
              </View>

              <View className="h-px bg-border-subtle" />

              <Pressable
                onPress={() => onNavigate("privacy")}
                className="flex-row justify-between items-center px-4 py-4 active:bg-surface-container-low"
              >
                <View className="flex-row items-center gap-3">
                  <Icon name="photo_library" size={20} color="#404944" />
                  <Text className="text-base text-on-surface font-body">
                    Photo Visibility
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-on-surface-variant">
                    {privacySettings.photoVisibility === "everyone"
                      ? "Everyone"
                      : "Interests / Matches"}
                  </Text>
                  <Icon name="chevron_right" size={20} color="#bfc9c3" />
                </View>
              </Pressable>

              <View className="h-px bg-border-subtle" />

              <Pressable
                onPress={() => onNavigate("safety")}
                className="flex-row justify-between items-center px-4 py-4 active:bg-surface-container-low"
              >
                <View className="flex-row items-center gap-3">
                  <Icon name="user_x" size={20} color="#404944" />
                  <Text className="text-base text-on-surface font-body">
                    Blocked Profiles
                  </Text>
                </View>
                <Icon name="chevron_right" size={20} color="#bfc9c3" />
              </Pressable>
            </View>
          </View>

          {/* Support */}
          <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
            <Pressable
              onPress={() => setShowFaqModal(true)}
              className="flex-row justify-between items-center px-4 py-4 active:bg-surface-container-low"
            >
              <View className="flex-row items-center gap-3">
                <Icon name="help_circle" size={20} color="#404944" />
                <Text className="text-base text-on-surface font-body">
                  Help & FAQ
                </Text>
              </View>
              <Icon name="chevron_right" size={20} color="#bfc9c3" />
            </Pressable>

            <View className="h-px bg-border-subtle" />

            <Pressable
              onPress={() => onNavigate("safety")}
              className="flex-row justify-between items-center px-4 py-4 active:bg-surface-container-low"
            >
              <View className="flex-row items-center gap-3">
                <Icon name="book" size={20} color="#404944" />
                <Text className="text-base text-on-surface font-body">
                  Community Guidelines
                </Text>
              </View>
              <Icon name="chevron_right" size={20} color="#bfc9c3" />
            </Pressable>
          </View>

          {/* Destructive Actions */}
          <View className="pt-4 pb-8 gap-2">
            <Pressable
              onPress={() => setShowLogOutModal(true)}
              className="w-full h-12 items-center justify-center active:bg-error-container/30 rounded-lg"
            >
              <Text className="text-base text-error font-medium font-body">
                Log Out
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShowDeleteModal(true)}
              className="w-full h-12 items-center justify-center active:bg-error-container/30 rounded-lg"
            >
              <Text className="text-base text-error opacity-80 font-medium font-body">
                Delete Account
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Log Out Modal */}
        <Modal visible={showLogOutModal} transparent animationType="fade">
          <Pressable
            className="flex-1 bg-on-background/40 items-center justify-center p-4"
            onPress={() => setShowLogOutModal(false)}
          >
            <Pressable
              className="bg-surface-white rounded-xl shadow-xl border border-border-subtle w-full max-w-sm p-6 gap-4"
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="font-display text-xl font-semibold text-on-surface text-center">
                Log Out of Rishta?
              </Text>
              <Text className="text-sm text-on-surface-variant text-center">
                You will need to re-verify your phone number (+92 300 1234567)
                next time you log in.
              </Text>
              <View className="flex-row gap-3 pt-2">
                <Pressable
                  onPress={() => setShowLogOutModal(false)}
                  className="flex-1 py-3 border border-border-subtle rounded-lg items-center active:bg-surface-container-low"
                >
                  <Text className="text-sm font-medium text-on-surface-variant">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowLogOutModal(false);
                    showToast("Logged out successfully", "info");
                  }}
                  className="flex-1 py-3 bg-error rounded-lg items-center active:opacity-90"
                >
                  <Text className="text-sm font-medium text-white">Log Out</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Delete Account Modal */}
        <Modal visible={showDeleteModal} transparent animationType="fade">
          <Pressable
            className="flex-1 bg-on-background/40 items-center justify-center p-4"
            onPress={() => setShowDeleteModal(false)}
          >
            <Pressable
              className="bg-surface-white rounded-xl shadow-xl border border-border-subtle w-full max-w-sm p-6 gap-4 items-center"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="w-12 h-12 bg-error-container rounded-full items-center justify-center">
                <Icon name="alert_triangle" size={24} color="#93000a" />
              </View>
              <Text className="font-display text-xl font-semibold text-on-surface text-center">
                Delete Account Permanently?
              </Text>
              <Text className="text-sm text-on-surface-variant text-center">
                This action cannot be undone. All your match history, interest
                requests, and profile data will be erased.
              </Text>
              <View className="flex-row gap-3 pt-2 w-full">
                <Pressable
                  onPress={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 border border-border-subtle rounded-lg items-center active:bg-surface-container-low"
                >
                  <Text className="text-sm font-medium text-on-surface-variant">
                    Keep Account
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowDeleteModal(false);
                    showToast("Account deletion request submitted", "warning");
                  }}
                  className="flex-1 py-3 bg-error rounded-lg items-center active:opacity-90"
                >
                  <Text className="text-sm font-medium text-white">Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* FAQ Modal */}
        <Modal visible={showFaqModal} transparent animationType="fade">
          <Pressable
            className="flex-1 bg-on-background/40 items-center justify-center p-4"
            onPress={() => setShowFaqModal(false)}
          >
            <Pressable
              className="bg-surface-white rounded-xl shadow-xl border border-border-subtle w-full max-w-md p-6 gap-4 max-h-[80%]"
              onPress={(e) => e.stopPropagation()}
            >
              <ScrollView>
                <Text className="font-display text-xl font-semibold text-primary-container mb-4">
                  Rishta Support & FAQ
                </Text>
                {[
                  {
                    q: "How do interest requests work?",
                    a: "Standard and Premium members receive daily interest quotas to express interest in verified profiles.",
                  },
                  {
                    q: "What is Profile Ownership?",
                    a: "Family members (parents, siblings) can manage profiles on behalf of the prospective candidate.",
                  },
                  {
                    q: "How is my privacy protected?",
                    a: 'You can set Photo Visibility to "Matches Only" and hide your profile anytime in Privacy settings.',
                  },
                ].map((faq, i) => (
                  <View
                    key={faq.q}
                    className={i > 0 ? "border-t border-border-subtle pt-3 mt-3" : ""}
                  >
                    <Text className="font-semibold text-on-surface text-sm">
                      {faq.q}
                    </Text>
                    <Text className="text-xs text-on-surface-variant mt-0.5">
                      {faq.a}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              <Pressable
                onPress={() => setShowFaqModal(false)}
                className="w-full py-2.5 bg-primary rounded-lg items-center active:bg-primary-container"
              >
                <Text className="text-sm font-medium text-white">Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
};
