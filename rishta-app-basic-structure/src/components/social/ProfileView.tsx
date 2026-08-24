import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Platform } from "react-native";
import { Image } from "expo-image";
import { Icon } from "../common/Icon";
import { PatternOverlay } from "../common/PatternOverlay";
import type { UserAccount, UserRole } from "../../types/social";

interface ProfileViewProps {
  user: UserAccount;
  onUpdateRole: (role: UserRole, managerName: string) => void;
  onOpenUpgradeModal: () => void;
  onOpenSettings?: () => void;
  onOpenOwnProfile?: () => void;
  onOpenDiscover?: () => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "parent", label: "Parent / Mother / Father" },
  { value: "sibling", label: "Sibling / Brother / Sister" },
  { value: "guardian", label: "Guardian / Relative" },
  { value: "self", label: "Self (Direct Candidate)" },
];

const inputStyle = Platform.OS === "web"
  ? ({ outlineStyle: "none" } as unknown as object)
  : undefined;

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateRole,
  onOpenUpgradeModal,
  onOpenSettings,
  onOpenOwnProfile,
  onOpenDiscover,
}) => {
  const [role, setRole] = useState<UserRole>(user.managerRole);
  const [managerName, setManagerName] = useState<string>(user.name);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveRole = () => {
    onUpdateRole(role, managerName);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <View className="flex-1 relative">
      <PatternOverlay className="absolute inset-0" opacity={0.03} />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 96 }}>
        <View className="relative z-10 px-5 pt-4 max-w-3xl mx-auto w-full">
          <View className="mb-6">
            <Text className="font-display text-[28px] font-bold text-primary">
              Account & Manager Profile
            </Text>
            <Text className="font-body text-sm text-on-surface-variant">
              Configure who manages {user.managingFor}'s profile and subscription details.
            </Text>
          </View>

          <View className="gap-6">
            <View className="bg-surface-white rounded-2xl p-6 border border-border-subtle flex-col md:flex-row gap-6 items-center">
              <View className="relative">
                <Image
                  source={{ uri: user.avatar }}
                  className="w-24 h-24 rounded-full border-4 border-surface-white"
                  contentFit="cover"
                  accessibilityLabel={user.managingFor}
                />
                <View className="absolute -bottom-1 -right-1 bg-primary-container p-1 rounded-full">
                  <Icon name="verified" size={16} color="#ffffff" />
                </View>
              </View>

              <View className="flex-1 items-center md:items-start gap-1">
                <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 mb-1">
                  <Icon name="verified" size={14} color="#B45309" fill />
                  <Text className="text-gold font-body text-xs font-bold">CNIC Verified Family</Text>
                </View>
                <Text className="font-display text-[22px] font-bold text-primary text-center md:text-left">
                  {user.managingFor}'s Profile
                </Text>
                <Text className="font-body text-[13px] text-on-surface-variant text-center md:text-left">
                  Currently managed by{" "}
                  <Text className="font-body font-semibold text-primary">{user.name}</Text> ({user.managerRole})
                </Text>
              </View>
            </View>

            <View className="bg-surface-white rounded-2xl p-6 border border-border-subtle">
              <View className="flex-row items-center gap-2 mb-4 pb-3 border-b border-border-subtle">
                <Icon name="family_restroom" size={20} color="#064e3b" />
                <Text className="font-display text-lg font-bold text-primary">
                  Family Representative Settings
                </Text>
              </View>

              {savedSuccess && (
                <View className="bg-primary-container/10 p-3 rounded-lg mb-4 flex-row items-center gap-2">
                  <Icon name="check_circle" size={18} color="#064e3b" />
                  <Text className="text-primary-container font-body text-[13px] font-semibold">
                    Manager information updated successfully!
                  </Text>
                </View>
              )}

              <View className="gap-4">
                <View>
                  <Text className="font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                    Manager / Representative Name
                  </Text>
                  <TextInput
                    value={managerName}
                    onChangeText={setManagerName}
                    placeholder="e.g. Mrs. Parveen"
                    placeholderTextColor="#bfc9c3"
                    className="w-full bg-surface-container-low border border-border-subtle rounded-xl px-4 py-2.5 font-body text-sm text-on-surface"
                    style={inputStyle}
                  />
                </View>

                <View>
                  <Text className="font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Relationship to Candidate
                  </Text>
                  <View className="gap-2">
                    {ROLE_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.value}
                        onPress={() => setRole(opt.value)}
                        className={`px-4 py-3 rounded-xl border ${
                          role === opt.value
                            ? "bg-primary-container/10 border-primary-container"
                            : "bg-surface-container-low border-border-subtle"
                        }`}
                      >
                        <Text
                          className={`font-body text-sm ${
                            role === opt.value ? "text-primary font-semibold" : "text-on-surface"
                          }`}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Pressable
                  onPress={handleSaveRole}
                  className="w-full h-[46px] bg-primary-container rounded-xl items-center justify-center active:bg-primary"
                >
                  <Text className="text-white font-body text-sm font-semibold">
                    Save Representative Role
                  </Text>
                </Pressable>
              </View>
            </View>

            {(onOpenSettings || onOpenOwnProfile || onOpenDiscover) && (
              <View className="bg-surface-white rounded-2xl p-4 border border-border-subtle gap-2">
                {onOpenOwnProfile && (
                  <Pressable
                    onPress={onOpenOwnProfile}
                    className="flex-row items-center gap-3 px-3 py-3 rounded-xl active:bg-surface-container-low"
                  >
                    <Icon name="person" size={20} color="#003527" />
                    <Text className="flex-1 font-body text-sm font-semibold text-primary">
                      View own profile
                    </Text>
                    <Icon name="chevron_right" size={18} color="#707974" />
                  </Pressable>
                )}
                {onOpenDiscover && (
                  <Pressable
                    onPress={onOpenDiscover}
                    className="flex-row items-center gap-3 px-3 py-3 rounded-xl active:bg-surface-container-low"
                  >
                    <Icon name="person_search" size={20} color="#003527" />
                    <Text className="flex-1 font-body text-sm font-semibold text-primary">
                      Discover feed
                    </Text>
                    <Icon name="chevron_right" size={18} color="#707974" />
                  </Pressable>
                )}
                {onOpenSettings && (
                  <Pressable
                    onPress={onOpenSettings}
                    className="flex-row items-center gap-3 px-3 py-3 rounded-xl active:bg-surface-container-low"
                  >
                    <Icon name="settings" size={20} color="#003527" />
                    <Text className="flex-1 font-body text-sm font-semibold text-primary">
                      Settings & account
                    </Text>
                    <Icon name="chevron_right" size={18} color="#707974" />
                  </Pressable>
                )}
              </View>
            )}

            <View className="bg-surface-white rounded-2xl p-6 border border-border-subtle">
              <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-border-subtle">
                <View className="flex-row items-center gap-2">
                  <Icon name="workspace_premium" size={20} color="#B45309" />
                  <Text className="font-display text-lg font-bold text-primary">Membership Quotas</Text>
                </View>
                <View className="bg-surface-container-low border border-border-subtle px-3 py-1 rounded-full">
                  <Text className="text-primary font-body text-xs font-bold uppercase">{user.tier} Tier</Text>
                </View>
              </View>

              <View className="gap-4 mb-6">
                <View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-[13px] font-medium text-on-surface-variant">Daily Interests</Text>
                    <Text className="text-[13px] font-bold text-primary">
                      {user.interestsUsedToday} / {user.interestsDailyLimit}
                    </Text>
                  </View>
                  <View className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden border border-border-subtle">
                    <View
                      className="bg-primary-container h-full rounded-full"
                      style={{
                        width: `${(user.interestsUsedToday / user.interestsDailyLimit) * 100}%`,
                      }}
                    />
                  </View>
                </View>

                <View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-[13px] font-medium text-on-surface-variant">Daily Profile Views</Text>
                    <Text className="text-[13px] font-bold text-primary">
                      {user.viewsUsedToday} / {user.viewsDailyLimit}
                    </Text>
                  </View>
                  <View className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden border border-border-subtle">
                    <View
                      className="bg-gold h-full rounded-full"
                      style={{
                        width: `${(user.viewsUsedToday / user.viewsDailyLimit) * 100}%`,
                      }}
                    />
                  </View>
                </View>
              </View>

              <Pressable
                onPress={onOpenUpgradeModal}
                className="w-full h-12 bg-primary-container rounded-xl flex-row items-center justify-center gap-2 active:bg-primary"
              >
                <Icon name="workspace_premium" size={20} color="#ffffff" />
                <Text className="text-white font-body text-sm font-semibold">Upgrade to Premium</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
