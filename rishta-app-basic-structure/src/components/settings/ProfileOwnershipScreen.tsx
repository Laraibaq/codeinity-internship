import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import { PatternOverlay } from "../common/PatternOverlay";
import type {
  ScreenType,
  ProfileOwnershipData,
  ToastType,
} from "../../types/settings";

interface ProfileOwnershipScreenProps {
  onNavigate: (screen: ScreenType) => void;
  profileOwnership: ProfileOwnershipData;
  onUpdateOwnership: (newOwnership: ProfileOwnershipData) => void;
  showToast: (msg: string, type?: ToastType) => void;
}

const OWNERSHIP_OPTIONS = [
  { label: "My Daughter", managedBy: "Managed by Family", gender: "Female" },
  { label: "My Son", managedBy: "Managed by Family", gender: "Male" },
  { label: "Myself", managedBy: "Self-Managed", gender: "Female" },
  { label: "My Sister", managedBy: "Managed by Sibling", gender: "Female" },
  { label: "My Brother", managedBy: "Managed by Sibling", gender: "Male" },
];

export const ProfileOwnershipScreen: React.FC<ProfileOwnershipScreenProps> = ({
  onNavigate,
  profileOwnership,
  onUpdateOwnership,
  showToast,
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showOptionSelector, setShowOptionSelector] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleConfirmChange = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      setShowConfirmDialog(false);
      setShowOptionSelector(true);
    }, 400);
  };

  const handleSelectOption = (opt: (typeof OWNERSHIP_OPTIONS)[0]) => {
    onUpdateOwnership({
      owner: opt.label,
      managedBy: opt.managedBy,
      gender: opt.gender,
    });
    setShowOptionSelector(false);
    showToast(`Profile ownership updated to ${opt.label}`, "success");
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="border-b border-border-subtle bg-background flex-row justify-between items-center px-5 h-14">
        <Pressable
          onPress={() => onNavigate("settings")}
          className="p-2 rounded-full active:bg-surface-container-highest min-w-[48px] min-h-[48px] items-center justify-center"
          accessibilityLabel="Go back to settings"
        >
          <Icon name="arrow_back" size={20} color="#003527" />
        </Pressable>
        <Text className="font-display text-2xl font-bold text-primary">
          Profile Ownership
        </Text>
        <View className="w-[48px]" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-6 pb-24"
      >
        <PatternOverlay />

        <View className="gap-6">
          <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle p-6 gap-4">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-full bg-primary-container/10 items-center justify-center">
                <Icon name="family_restroom" size={28} color="#064e3b" />
              </View>
              <View className="flex-1">
                <Text className="font-display text-xl font-semibold text-on-surface">
                  Currently for: {profileOwnership.owner}
                </Text>
                <Text className="text-sm text-on-surface-variant mt-1 font-body">
                  {profileOwnership.managedBy}
                </Text>
              </View>
            </View>

            <View className="h-px bg-surface-container-highest" />

            <Text className="text-sm text-on-surface-variant font-medium font-body">
              Gender: {profileOwnership.gender}
            </Text>
          </View>

          <Pressable
            onPress={() => setShowConfirmDialog(true)}
            className="w-full bg-primary-container h-14 rounded-full shadow-md items-center justify-center active:bg-primary active:scale-[0.98]"
          >
            <Text className="text-white text-base font-medium font-body">
              Change who this profile is for
            </Text>
          </Pressable>

          <View className="flex-row items-start gap-3 bg-surface-container-low p-4 rounded-lg border border-border-subtle">
            <Icon name="info" size={20} color="#B45309" />
            <Text className="text-sm leading-relaxed text-on-surface-variant flex-1 font-body">
              Changing the profile owner will update how the profile is presented
              to potential matches. It may affect existing match recommendations.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Dialog */}
      <Modal visible={showConfirmDialog} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-on-background/40 items-center justify-center p-4"
          onPress={() => setShowConfirmDialog(false)}
        >
          <Pressable
            className="bg-surface-white rounded-xl shadow-lg border border-border-subtle w-full max-w-sm overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="h-14 bg-surface-container-low items-center justify-center border-b border-border-subtle relative overflow-hidden">
              <PatternOverlay opacity={0.5} />
              <Icon name="alert_triangle" size={24} color="#ba1a1a" />
            </View>
            <View className="p-6 items-center">
              <Text className="font-display text-xl font-semibold text-on-surface mb-3 text-center">
                Change Profile Ownership?
              </Text>
              <Text className="text-sm text-on-surface-variant text-center leading-relaxed">
                Changing this may reset gender and matching assumptions. Are you
                sure you want to continue?
              </Text>
            </View>
            <View className="flex-row border-t border-border-subtle">
              <Pressable
                onPress={() => setShowConfirmDialog(false)}
                className="flex-1 py-4 items-center active:bg-surface-container-highest/30"
              >
                <Text className="text-sm font-medium text-on-surface-variant">
                  Cancel
                </Text>
              </Pressable>
              <View className="w-px bg-border-subtle" />
              <Pressable
                onPress={handleConfirmChange}
                disabled={isUpdating}
                className="flex-1 py-4 items-center active:bg-error-container/30"
              >
                {isUpdating ? (
                  <ActivityIndicator color="#ba1a1a" />
                ) : (
                  <Text className="text-sm font-medium text-error">Confirm</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Option Selector Modal */}
      <Modal visible={showOptionSelector} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-on-background/40 items-center justify-center p-4"
          onPress={() => setShowOptionSelector(false)}
        >
          <Pressable
            className="bg-surface-white rounded-xl shadow-xl border border-border-subtle w-full max-w-md p-6 gap-4 max-h-[80%]"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="font-display text-xl font-bold text-primary">
              Select Profile Owner
            </Text>
            <Text className="text-sm text-on-surface-variant">
              Choose who you are setting up and managing this matchmaking profile
              for:
            </Text>
            <ScrollView className="max-h-72">
              {OWNERSHIP_OPTIONS.map((opt) => {
                const isSelected = profileOwnership.owner === opt.label;
                return (
                  <Pressable
                    key={opt.label}
                    onPress={() => handleSelectOption(opt)}
                    className={`w-full p-4 rounded-xl border flex-row items-center justify-between mb-2 ${
                      isSelected
                        ? "border-primary-container bg-primary-container/5"
                        : "border-border-subtle"
                    }`}
                  >
                    <View className="flex-1 mr-2">
                      <Text
                        className={`font-display text-base ${isSelected ? "text-primary font-semibold" : "text-on-surface"}`}
                      >
                        {opt.label}
                      </Text>
                      <Text className="text-xs text-on-surface-variant mt-0.5 font-body">
                        {opt.managedBy} • Gender: {opt.gender}
                      </Text>
                    </View>
                    {isSelected && (
                      <Icon name="check" size={20} color="#064e3b" />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              onPress={() => setShowOptionSelector(false)}
              className="w-full py-3 border border-border-subtle rounded-lg items-center active:bg-surface-container-low"
            >
              <Text className="text-sm font-medium text-outline">Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};
