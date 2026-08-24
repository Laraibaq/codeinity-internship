import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '../common/Icon';
import { PatternOverlay } from '../common/PatternOverlay';
import { discoverProfiles } from '../../data/feedMock';
import type { FeedProfile } from '../../types/feed';
import { colors } from '../../../shared/tokens';

interface DiscoverViewProps {
  onOpenFilters: () => void;
  onSelectProfile: (profile: FeedProfile) => void;
  onOpenMenu?: () => void;
  onOpenNotifications?: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onOpenFilters,
  onSelectProfile,
  onOpenMenu,
  onOpenNotifications,
}) => {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (profileId: string) => {
    setFavorites((prev) => ({ ...prev, [profileId]: !prev[profileId] }));
  };

  return (
    <View className="flex-1 bg-background">
      <PatternOverlay opacity={1} />

      {/* Header */}
      <View className="flex-row justify-between items-center px-5 h-16 z-30 border-b border-border-subtle/40 bg-background/95">
        <Pressable
          onPress={onOpenMenu}
          accessibilityLabel="Menu"
          className="w-10 h-10 rounded-full items-center justify-center active:bg-surface-container-low"
        >
          <Icon name="menu" size={24} color={colors.primary} />
        </Pressable>

        <Text className="font-display text-xl text-primary tracking-tight">
          Rishta
        </Text>

        <Pressable
          onPress={onOpenNotifications}
          accessibilityLabel="Notifications"
          className="w-10 h-10 rounded-full items-center justify-center active:bg-surface-container-low relative"
        >
          <Icon name="notifications" size={24} color={colors.primary} />
          <View className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-gold border-2 border-background" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 112, paddingHorizontal: 20, paddingTop: 24 }}
      >
        <View className="mb-6 flex-row justify-between items-end">
          <View>
            <Text className="font-display text-2xl text-rich-green">
              Discover
            </Text>
            <Text className="font-body text-sm text-on-surface-variant mt-1">
              Curated matches for you
            </Text>
          </View>

          <Pressable
            onPress={onOpenFilters}
            className="flex-row items-center gap-1.5 px-3.5 py-2 bg-surface-white rounded-full border border-border-subtle active:scale-95"
          >
            <Icon name="tune" size={16} color={colors.primaryContainer} />
            <Text className="font-body text-xs font-semibold text-primary-container">
              Filters
            </Text>
          </Pressable>
        </View>

        <View className="gap-4">
          {discoverProfiles.map((profile) => (
            <Pressable
              key={profile.id}
              onPress={() => onSelectProfile(profile)}
              className="bg-surface-white rounded-3xl overflow-hidden border border-border-subtle/50 active:opacity-95"
            >
              <View className="aspect-[4/5] relative">
                <Image
                  source={{ uri: profile.imageUrl }}
                  className="w-full h-full"
                  contentFit="cover"
                  accessibilityLabel={profile.name}
                />
                <View className="absolute inset-0 bg-black/40" />
                <View className="absolute bottom-0 left-0 right-0 h-1/2 bg-black/50" />

                {profile.verified && (
                  <View className="absolute top-4 left-4 bg-surface-white/90 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                    <Icon name="verified" size={14} color={colors.verificationGold} fill />
                    <Text className="font-body text-xs font-semibold text-rich-green">
                      Verified
                    </Text>
                  </View>
                )}

                <Pressable
                  onPress={() => toggleFavorite(profile.id)}
                  accessibilityLabel="Favorite profile"
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 items-center justify-center"
                >
                  <Icon
                    name="star"
                    size={20}
                    color={favorites[profile.id] ? colors.verificationGold : '#ffffff'}
                    fill={favorites[profile.id]}
                  />
                </Pressable>

                <View className="absolute bottom-0 left-0 w-full p-5">
                  <Text className="font-display text-lg text-white font-semibold">
                    {profile.name}
                  </Text>
                  {profile.profession && (
                    <View className="flex-row items-center gap-1.5 mt-1">
                      <Icon
                        name={profile.profession === 'Architect' ? 'school' : 'work'}
                        size={16}
                        color="rgba(255,255,255,0.9)"
                      />
                      <Text className="font-body text-sm text-white/90">
                        {profile.profession}
                      </Text>
                    </View>
                  )}
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <Icon name="location_on" size={16} color="rgba(255,255,255,0.9)" />
                    <Text className="font-body text-sm text-white/90">
                      {profile.city}, {profile.country}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
