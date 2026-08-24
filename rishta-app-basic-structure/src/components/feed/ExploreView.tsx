import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '../common/Icon';
import { PatternOverlay } from '../common/PatternOverlay';
import { exploreFeedProfile, blurredTeaseImages } from '../../data/feedMock';
import { colors } from '../../../shared/tokens';

interface ExploreViewProps {
  onOpenFilters: () => void;
  onOpenReportModal: () => void;
  onOpenMenu?: () => void;
  onOpenNotifications?: () => void;
  onUnlockPremium?: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  onOpenFilters,
  onOpenReportModal,
  onOpenMenu,
  onOpenNotifications,
  onUnlockPremium,
}) => {
  const [interestsLeft, setInterestsLeft] = useState(2);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [isPassed, setIsPassed] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (!feedbackToast) return;
    const timer = setTimeout(() => setFeedbackToast(null), 2800);
    return () => clearTimeout(timer);
  }, [feedbackToast]);

  useEffect(() => {
    if (!isPassed) return;
    const timer = setTimeout(() => setIsPassed(false), 2000);
    return () => clearTimeout(timer);
  }, [isPassed]);

  const showToast = (message: string) => setFeedbackToast(message);

  const handleExpressInterest = () => {
    if (interestsLeft > 0) {
      setInterestsLeft((prev) => prev - 1);
      showToast(`Interest sent to ${exploreFeedProfile.name}! 💕`);
    } else {
      showToast('No interests left today. Upgrade to Premium for unlimited!');
    }
  };

  const handlePass = () => {
    setIsPassed(true);
    showToast('Passed profile.');
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    showToast(isFavorited ? 'Removed from favorites' : 'Saved to favorites ⭐');
  };

  return (
    <View className="flex-1 bg-background">
      <PatternOverlay opacity={1} />

      {feedbackToast && (
        <View className="absolute top-20 self-center z-50 bg-primary px-4 py-2.5 rounded-full border border-primary-fixed/30">
          <Text className="font-body text-xs text-white">{feedbackToast}</Text>
        </View>
      )}

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 h-16 border-b border-border-subtle/50 bg-surface">
        <Pressable
          onPress={onOpenMenu}
          accessibilityLabel="Menu"
          className="w-10 h-10 rounded-full items-center justify-center active:bg-surface-container-low"
        >
          <Icon name="menu" size={24} color={colors.onSurfaceVariant} />
        </Pressable>

        <Text className="font-display text-xl text-primary tracking-tight">
          Rishta
        </Text>

        <Pressable
          onPress={onOpenNotifications}
          accessibilityLabel="Notifications"
          className="w-10 h-10 rounded-full items-center justify-center active:bg-surface-container-low relative"
        >
          <Icon name="notifications" size={24} color={colors.onSurfaceVariant} />
          <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-gold border-2 border-surface" />
        </Pressable>
      </View>

      {/* Quota & Filters */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-background/85 border-b border-border-subtle/30">
        <View className="flex-row items-center gap-2 px-3.5 py-1.5 bg-primary-container/10 rounded-full border border-primary-container/20">
          <Icon name="local_fire_department" size={14} color={colors.primaryContainer} fill />
          <Text className="font-body text-xs font-semibold text-primary-container">
            {interestsLeft} {interestsLeft === 1 ? 'interest' : 'interests'} left today
          </Text>
        </View>

        <Pressable
          onPress={onOpenFilters}
          accessibilityLabel="Filters"
          className="w-10 h-10 rounded-full bg-surface-white border border-border-subtle items-center justify-center active:scale-95"
        >
          <Icon name="tune" size={20} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 112, gap: 24 }}
      >
        {/* Profile Card */}
        <View
          className={`bg-surface-white rounded-xl border border-border-subtle overflow-hidden ${
            isPassed ? 'opacity-40' : 'opacity-100'
          }`}
          style={isPassed ? { transform: [{ scale: 0.95 }] } : undefined}
        >
          <View className="aspect-[4/5] relative bg-surface-container-low">
            <Image
              source={{ uri: exploreFeedProfile.imageUrl }}
              className="w-full h-full"
              contentFit="cover"
              accessibilityLabel={exploreFeedProfile.name}
            />
            <View className="absolute inset-0 bg-black/40" />
            <View className="absolute bottom-0 left-0 right-0 h-1/2 bg-black/50" />

            <View className="absolute top-4 right-4">
              <Pressable
                onPress={onOpenReportModal}
                accessibilityLabel="Report or block profile"
                className="w-10 h-10 rounded-full bg-black/25 border border-white/20 items-center justify-center"
              >
                <Icon name="more_vert" size={20} color="#ffffff" />
              </Pressable>
            </View>

            <View className="absolute bottom-0 left-0 w-full p-5 gap-2">
              <View className="flex-row items-end gap-2 flex-wrap">
                <Text className="font-display text-2xl text-white font-semibold">
                  {exploreFeedProfile.name}, {exploreFeedProfile.age}
                </Text>
                <View className="flex-row items-center gap-1 mb-1">
                  <Icon name="location_on" size={16} color="rgba(255,255,255,0.8)" />
                  <Text className="font-body text-sm text-white/80">
                    {exploreFeedProfile.city}, {exploreFeedProfile.country}
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-2 mt-1">
                <View className="bg-white/20 border border-white/30 px-3 py-1 rounded-full flex-row items-center gap-1.5">
                  <Icon name="verified" size={14} color={colors.verificationGold} fill />
                  <Text className="font-body text-xs text-white">Verified</Text>
                </View>
                <View className="bg-white/20 border border-white/30 px-3 py-1 rounded-full">
                  <Text className="font-body text-xs text-white">Managed by family</Text>
                </View>
              </View>

              <Text className="font-body text-sm text-white/90 mt-2 font-medium">
                {exploreFeedProfile.matchPercentage}% match · Same sect · Same city
              </Text>
            </View>
          </View>

          {/* Action Row */}
          <View className="p-5 flex-row items-center justify-between gap-4 bg-surface-white">
            <Pressable
              onPress={handlePass}
              accessibilityLabel="Pass"
              className="w-14 h-14 rounded-full border-2 border-outline-variant items-center justify-center active:scale-90"
            >
              <Icon name="close" size={28} color={colors.outline} />
            </Pressable>

            <Pressable
              onPress={handleExpressInterest}
              className="flex-1 h-14 bg-primary-container rounded-lg flex-row items-center justify-center gap-2 active:scale-95"
            >
              <Icon name="favorite" size={20} color="#ffffff" fill />
              <Text className="font-body text-xs font-semibold text-white uppercase tracking-widest">
                Express Interest
              </Text>
            </Pressable>

            <Pressable
              onPress={handleFavorite}
              accessibilityLabel="Favourite"
              className={`w-14 h-14 rounded-full border-2 items-center justify-center active:scale-90 ${
                isFavorited
                  ? 'bg-primary-container border-primary-container'
                  : 'border-primary-container'
              }`}
            >
              <Icon
                name="star"
                size={28}
                color={isFavorited ? '#ffffff' : colors.primaryContainer}
                fill={isFavorited}
              />
            </Pressable>
          </View>
        </View>

        {/* Tease Card 1 */}
        <View className="bg-surface-white rounded-xl border border-border-subtle overflow-hidden">
          <View className="aspect-[4/5] relative bg-surface-container-low overflow-hidden">
            <Image
              source={{ uri: blurredTeaseImages.tease1 }}
              className="w-full h-full opacity-60"
              contentFit="cover"
            />
            <View className="absolute inset-0 bg-black/35 items-center justify-center p-6">
              <View className="w-16 h-16 rounded-full bg-white/20 border border-white/40 items-center justify-center mb-6">
                <Icon name="lock" size={32} color="#ffffff" fill />
              </View>
              <Text className="font-display text-2xl text-white mb-2 text-center">
                Unlock with Premium
              </Text>
              <Text className="font-body text-sm text-white/90 mb-6 text-center">
                28 · Karachi
              </Text>
              <Pressable
                onPress={onUnlockPremium}
                className="w-full h-14 bg-gold rounded-lg items-center justify-center active:scale-95"
              >
                <Text className="font-body text-xs font-semibold text-white uppercase tracking-widest text-center">
                  Unlock 20+ More Profiles Today
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Tease Card 2 */}
        <View className="bg-surface-white rounded-xl border border-border-subtle overflow-hidden opacity-90">
          <View className="aspect-[4/5] relative bg-surface-container-low overflow-hidden">
            <Image
              source={{ uri: blurredTeaseImages.tease2 }}
              className="w-full h-full opacity-50"
              contentFit="cover"
            />
            <View className="absolute inset-0 bg-black/40 items-center justify-center p-6">
              <View className="w-16 h-16 rounded-full bg-white/10 border border-white/20 items-center justify-center mb-6">
                <Icon name="lock" size={32} color="rgba(255,255,255,0.8)" />
              </View>
              <Text className="font-display text-lg text-white/90 mb-1 text-center">
                Hidden Profile
              </Text>
              <Text className="font-body text-sm text-white/70 text-center">
                Upgrade to see who's waiting.
              </Text>
            </View>
          </View>
        </View>

        {/* End of feed */}
        <View className="py-8 items-center opacity-60">
          <Icon name="auto_awesome" size={28} color={colors.primaryContainer} />
          <Text className="font-body text-sm text-on-surface-variant mt-2 text-center">
            You've reached the end of today's suggestions.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};
