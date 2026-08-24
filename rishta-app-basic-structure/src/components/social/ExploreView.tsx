import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { Icon } from "../common/Icon";
import { PatternOverlay } from "../common/PatternOverlay";
import type { Profile } from "../../types/social";

interface ExploreViewProps {
  profiles: Profile[];
  onSendInterest: (profile: Profile) => void;
  interestsUsedToday: number;
  interestsDailyLimit: number;
}

const CITIES = ["All", "Islamabad", "Lahore", "Karachi", "Rawalpindi", "Dubai"];
const SECTS = ["All", "Sunni", "Shia"];

export const ExploreView: React.FC<ExploreViewProps> = ({
  profiles,
  onSendInterest,
  interestsUsedToday,
  interestsDailyLimit,
}) => {
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [selectedSect, setSelectedSect] = useState<string>("All");
  const [familyOnly, setFamilyOnly] = useState<boolean>(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const filteredProfiles = profiles.filter((p) => {
    if (selectedCity !== "All" && p.city !== selectedCity) return false;
    if (selectedSect !== "All" && !p.sect.toLowerCase().includes(selectedSect.toLowerCase())) return false;
    if (familyOnly && p.managedBy !== "Family") return false;
    return true;
  });

  const quotaPercent = Math.min(100, (interestsUsedToday / interestsDailyLimit) * 100);

  return (
    <View className="flex-1 relative">
      <PatternOverlay className="absolute inset-0" opacity={0.03} />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 96 }}>
        <View className="w-full max-w-5xl mx-auto px-5 py-6">
          <View className="bg-surface-white border border-border-subtle rounded-xl p-4 mb-6 flex-col gap-4">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-primary-container/10 items-center justify-center">
                <Icon name="favorite" size={20} color="#064e3b" />
              </View>
              <View className="flex-1">
                <Text className="font-display text-lg font-semibold text-primary">
                  Daily Interest Quota
                </Text>
                <Text className="font-body text-xs text-on-surface-variant">
                  {interestsUsedToday} of {interestsDailyLimit} interests used today
                </Text>
              </View>
            </View>
            <View className="w-full bg-surface-container-low rounded-full h-2.5 overflow-hidden border border-border-subtle">
              <View
                className="bg-primary-container h-full rounded-full"
                style={{ width: `${quotaPercent}%` }}
              />
            </View>
          </View>

          <View className="bg-surface-white border border-border-subtle rounded-xl p-4 mb-6 gap-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              <View className="flex-row items-center gap-1.5 mr-2">
                <Icon name="location_on" size={16} color="#064e3b" />
                {CITIES.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setSelectedCity(c)}
                    className={`px-2.5 py-1.5 rounded-lg border mr-1.5 ${
                      selectedCity === c
                        ? "bg-primary-container border-primary-container"
                        : "bg-surface-container-low border-border-subtle"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${selectedCity === c ? "text-white" : "text-on-surface"}`}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row items-center gap-1.5">
                <Icon name="synagogue" size={16} color="#064e3b" />
                {SECTS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setSelectedSect(s)}
                    className={`px-2.5 py-1.5 rounded-lg border mr-1.5 ${
                      selectedSect === s
                        ? "bg-primary-container border-primary-container"
                        : "bg-surface-container-low border-border-subtle"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${selectedSect === s ? "text-white" : "text-on-surface"}`}
                    >
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View className="flex-row items-center justify-between flex-wrap gap-3">
              <Pressable
                onPress={() => setFamilyOnly(!familyOnly)}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                  familyOnly
                    ? "bg-primary-container border-primary-container"
                    : "bg-surface-container-low border-border-subtle"
                }`}
              >
                <Icon name="family_home" size={16} color={familyOnly ? "#ffffff" : "#404944"} />
                <Text
                  className={`text-xs font-semibold ${familyOnly ? "text-white" : "text-on-surface-variant"}`}
                >
                  Managed by Family Only
                </Text>
              </Pressable>
              <Text className="text-xs text-outline font-medium">
                Showing {filteredProfiles.length} verified matches
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-5">
            {filteredProfiles.map((profile) => (
              <View
                key={profile.id}
                className="bg-surface-white rounded-xl overflow-hidden border border-border-subtle w-full sm:w-[47%] md:w-[31%]"
              >
                <View className="relative w-full aspect-[4/5] overflow-hidden bg-surface-container-low">
                  <Image
                    source={{ uri: profile.avatar }}
                    className="w-full h-full"
                    contentFit="cover"
                    accessibilityLabel={`${profile.name}, ${profile.age}`}
                  />

                  {profile.verified && (
                    <View className="absolute top-2 left-2 bg-surface-white/90 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                      <Icon name="verified" size={14} color="#B45309" fill />
                      <Text className="font-body text-[10px] font-semibold text-primary">Verified</Text>
                    </View>
                  )}

                  {profile.managedBy === "Family" && (
                    <View className="absolute bottom-2 left-2 bg-primary-container/90 px-2 py-0.5 rounded-md flex-row items-center gap-1">
                      <Icon name="family_home" size={12} color="#ffffff" />
                      <Text className="text-white text-[10px] font-semibold">Family Managed</Text>
                    </View>
                  )}
                </View>

                <View className="p-4 gap-3">
                  <View>
                    <Text className="font-display text-xl font-semibold text-primary">
                      {profile.name}, {profile.age}
                    </Text>
                    <View className="flex-row items-center gap-1 mb-1">
                      <Icon name="location_on" size={14} color="#064e3b" />
                      <Text className="font-body text-[13px] text-on-surface-variant">
                        {profile.city}, {profile.country}
                      </Text>
                    </View>
                    <Text className="font-body text-[13px] text-rich-green font-medium" numberOfLines={1}>
                      {profile.occupation} · {profile.sect}
                    </Text>
                  </View>

                  <View className="flex-row gap-2 pt-2 border-t border-border-subtle">
                    <Pressable
                      onPress={() => setSelectedProfile(profile)}
                      className="flex-1 py-2 rounded-lg border border-outline items-center justify-center active:bg-surface-container-low"
                    >
                      <Text className="font-body text-xs font-semibold text-on-surface">View Profile</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onSendInterest(profile)}
                      className="flex-1 py-2 rounded-lg bg-primary-container flex-row items-center justify-center gap-1 active:bg-primary"
                    >
                      <Icon name="favorite" size={16} color="#ffffff" />
                      <Text className="text-white font-body text-xs font-semibold">Send Interest</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {selectedProfile && (
        <View className="absolute inset-0 z-50 bg-black/50 items-center justify-center p-4">
          <Pressable className="absolute inset-0" onPress={() => setSelectedProfile(null)} />
          <View className="bg-surface-white rounded-2xl max-w-lg w-full overflow-hidden border border-border-subtle max-h-[90%]">
            <View className="relative h-64 bg-surface-container-low">
              <Image
                source={{ uri: selectedProfile.avatar }}
                className="w-full h-full"
                contentFit="cover"
                accessibilityLabel={selectedProfile.name}
              />
              <Pressable
                onPress={() => setSelectedProfile(null)}
                className="absolute top-3 right-3 bg-black/50 w-9 h-9 rounded-full items-center justify-center"
              >
                <Icon name="close" size={20} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView className="p-6" contentContainerStyle={{ gap: 16 }}>
              <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-2">
                  <Text className="font-display text-2xl font-bold text-primary">
                    {selectedProfile.name}, {selectedProfile.age}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <Icon name="location_on" size={16} color="#064e3b" />
                    <Text className="font-body text-sm text-on-surface-variant">
                      {selectedProfile.city}, {selectedProfile.country}
                    </Text>
                  </View>
                </View>
                {selectedProfile.verified && (
                  <View className="flex-row items-center gap-1 px-3 py-1 rounded-full bg-gold/10">
                    <Icon name="verified" size={16} color="#B45309" fill />
                    <Text className="text-gold font-body text-xs font-bold">Verified</Text>
                  </View>
                )}
              </View>

              <Text className="font-body text-sm text-on-surface leading-relaxed">
                {selectedProfile.bio}
              </Text>

              <View className="flex-row flex-wrap gap-3">
                {[
                  { label: "Occupation", value: selectedProfile.occupation },
                  { label: "Education", value: selectedProfile.education || "Graduate" },
                  { label: "Sect", value: selectedProfile.sect },
                  { label: "Managed By", value: selectedProfile.managedBy },
                ].map((item) => (
                  <View
                    key={item.label}
                    className="bg-surface-container-low p-3 rounded-lg border border-border-subtle w-[47%]"
                  >
                    <Text className="text-[11px] text-outline font-semibold uppercase">{item.label}</Text>
                    <Text className="text-[13px] font-semibold text-primary">{item.value}</Text>
                  </View>
                ))}
              </View>

              <View className="flex-row gap-3 pt-2">
                <Pressable
                  onPress={() => setSelectedProfile(null)}
                  className="flex-1 py-3 rounded-xl border border-outline items-center justify-center active:bg-surface-container-low"
                >
                  <Text className="font-body text-sm font-semibold text-on-surface">Close</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    const prof = selectedProfile;
                    setSelectedProfile(null);
                    onSendInterest(prof);
                  }}
                  className="flex-1 py-3 rounded-xl bg-primary-container flex-row items-center justify-center gap-2 active:bg-primary"
                >
                  <Icon name="favorite" size={18} color="#ffffff" />
                  <Text className="text-white font-body text-sm font-semibold">Send Interest</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};
