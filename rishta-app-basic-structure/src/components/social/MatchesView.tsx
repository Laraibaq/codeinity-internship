import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { Icon } from "../common/Icon";
import { PatternOverlay } from "../common/PatternOverlay";
import type { Profile } from "../../types/social";

interface MatchesViewProps {
  matches: Profile[];
  onOpenChat: (profileId: string) => void;
}

const SORT_OPTIONS: { value: "recent" | "name" | "age"; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "name", label: "Name" },
  { value: "age", label: "Age" },
];

export const MatchesView: React.FC<MatchesViewProps> = ({ matches, onOpenChat }) => {
  const [sortBy, setSortBy] = useState<"recent" | "name" | "age">("recent");

  const sortedMatches = [...matches].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "age") return a.age - b.age;
    return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
  });

  return (
    <View className="flex-1 relative">
      <PatternOverlay className="absolute inset-0" opacity={0.03} />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 96 }}>
        <View className="w-full max-w-5xl mx-auto px-5 py-6">
          <View className="mb-6 flex-col gap-4">
            <View>
              <Text className="font-display text-2xl md:text-[28px] font-bold text-primary mb-1">
                Mutual Matches
              </Text>
              <Text className="font-body text-sm text-on-surface-variant">
                You've successfully connected with these profiles.
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {SORT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setSortBy(opt.value)}
                  className={`flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full border ${
                    sortBy === opt.value
                      ? "bg-primary-container border-primary-container"
                      : "bg-surface-white border-border-subtle"
                  }`}
                >
                  {sortBy === opt.value && <Icon name="tune" size={16} color="#ffffff" />}
                  <Text
                    className={`font-body text-xs font-semibold ${
                      sortBy === opt.value ? "text-white" : "text-on-surface-variant"
                    }`}
                  >
                    Sort: {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {sortedMatches.length === 0 ? (
            <View className="bg-surface-white rounded-xl p-12 items-center border border-border-subtle">
              <Icon name="favorite" size={36} color="#B45309" />
              <Text className="font-display text-xl font-bold text-primary mb-1 mt-3 text-center">
                No Mutual Matches Yet
              </Text>
              <Text className="font-body text-sm text-on-surface-variant text-center">
                Accept incoming requests or send interests to start getting matches!
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-4">
              {sortedMatches.map((profile) => (
                <View
                  key={profile.id}
                  className="bg-surface-white rounded-xl overflow-hidden border border-border-subtle/80 w-[47%] md:w-[31%]"
                >
                  {profile.isNew && (
                    <View className="absolute top-2 right-2 bg-gold px-2 py-0.5 rounded-full z-10 flex-row items-center gap-1">
                      <Icon name="auto_awesome" size={12} color="#ffffff" />
                      <Text className="text-white font-body text-[10px] font-semibold">New</Text>
                    </View>
                  )}

                  <View className="relative w-full aspect-[4/5] overflow-hidden bg-surface-container-low">
                    <Image
                      source={{ uri: profile.avatar }}
                      className="w-full h-full"
                      contentFit="cover"
                      accessibilityLabel={`${profile.name}, ${profile.age}`}
                    />
                  </View>

                  <View className="p-3 gap-3">
                    <View>
                      <View className="flex-row items-center justify-between">
                        <Text className="font-display text-lg font-semibold text-on-surface flex-1" numberOfLines={1}>
                          {profile.name}, {profile.age}
                        </Text>
                        {profile.verified && (
                          <View className="bg-gold/10 px-1.5 py-0.5 rounded">
                            <Icon name="verified" size={14} color="#B45309" fill />
                          </View>
                        )}
                      </View>
                      <Text className="font-body text-[13px] text-on-surface-variant" numberOfLines={1}>
                        {profile.city} • {profile.occupation}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => onOpenChat(profile.id)}
                      className="w-full bg-primary-container py-2.5 rounded-lg flex-row items-center justify-center gap-1.5 active:bg-primary"
                    >
                      <Icon name="chat" size={18} color="#ffffff" />
                      <Text className="text-white font-body text-xs font-semibold">Message</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
