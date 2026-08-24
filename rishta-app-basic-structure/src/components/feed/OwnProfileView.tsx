import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle } from 'react-native-svg';
import { Icon } from '../common/Icon';
import { PatternOverlay } from '../common/PatternOverlay';
import { ownProfileData } from '../../data/feedMock';
import { colors } from '../../../shared/tokens';

interface OwnProfileViewProps {
  onEditPersonal: () => void;
  onBack?: () => void;
  onOpenSettings?: () => void;
  onPreviewPublicProfile?: () => void;
}

function CompletenessRing({ percent }: { percent: number }) {
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <View className="w-12 h-12 items-center justify-center">
      <Svg width={48} height={48} viewBox="0 0 36 36" style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={18}
          cy={18}
          r={radius}
          fill="none"
          stroke={colors.surfaceContainerHigh}
          strokeWidth={3}
        />
        <Circle
          cx={18}
          cy={18}
          r={radius}
          fill="none"
          stroke={colors.primary}
          strokeWidth={3}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text className="absolute font-body text-xs font-semibold text-primary">
        {percent}%
      </Text>
    </View>
  );
}

export const OwnProfileView: React.FC<OwnProfileViewProps> = ({
  onEditPersonal,
  onBack,
  onOpenSettings,
  onPreviewPublicProfile,
}) => {
  const [completedItems, setCompletedItems] = useState({
    selfie: false,
    family: false,
  });
  const [boostToast, setBoostToast] = useState<string | null>(null);

  useEffect(() => {
    if (!boostToast) return;
    const timer = setTimeout(() => setBoostToast(null), 3000);
    return () => clearTimeout(timer);
  }, [boostToast]);

  const toggleItem = (key: 'selfie' | 'family') => {
    setCompletedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completeness = Math.min(
    100,
    ownProfileData.completeness +
      (completedItems.selfie ? 10 : 0) +
      (completedItems.family ? 10 : 0),
  );

  const sections: {
    icon: string;
    label: string;
    subtitle?: string;
    highlight: boolean;
  }[] = [
    { icon: 'person', label: 'Basics', highlight: false },
    { icon: 'favorite', label: 'Intent', highlight: false },
    { icon: 'school', label: 'Education & Work', highlight: false },
    {
      icon: 'fingerprint',
      label: 'Personal & Background',
      subtitle: 'Height, Sect, Ethnicity, Household',
      highlight: true,
    },
    { icon: 'palette', label: 'Lifestyle & Interests', highlight: false },
    { icon: 'photo_library', label: 'Photos', highlight: false },
    { icon: 'family_restroom', label: 'Family Background', highlight: false },
  ];

  return (
    <View className="flex-1 bg-background">
      {boostToast && (
        <View className="absolute top-20 self-center z-50 bg-gold px-4 py-2.5 rounded-full">
          <Text className="font-body text-xs text-white">{boostToast}</Text>
        </View>
      )}

      {/* Header */}
      <View className="flex-row justify-between items-center px-5 h-14 border-b border-border-subtle/50 bg-surface">
        <Pressable onPress={onBack} className="w-10 h-10 items-center justify-start">
          <Icon name="arrow_back" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
        <Text className="font-display text-lg text-primary font-semibold">
          Own Profile
        </Text>
        <Pressable onPress={onOpenSettings} className="w-10 h-10 items-center justify-end">
          <Icon name="settings" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 112, gap: 24 }}
      >
        {/* Profile Header Card */}
        <View className="bg-surface-white rounded-xl border border-border-subtle/50 p-6 items-center overflow-hidden relative">
          <PatternOverlay opacity={0.03} className="absolute inset-0" />

          <View className="relative w-32 h-32 mb-4">
            <Image
              source={{ uri: ownProfileData.avatarUrl }}
              className="w-full h-full rounded-full border-4 border-surface-white"
              contentFit="cover"
              accessibilityLabel={ownProfileData.name}
            />
            <Pressable
              onPress={onEditPersonal}
              className="absolute bottom-0 right-0 w-10 h-10 bg-primary-container rounded-full items-center justify-center border-2 border-surface-white active:scale-95"
            >
              <Icon name="edit" size={16} color="#ffffff" fill />
            </Pressable>
          </View>

          <Text className="font-display text-lg text-on-surface mb-1">
            {ownProfileData.name}, {ownProfileData.age}
          </Text>

          <View className="flex-row items-center px-3 py-1 bg-surface-container-low rounded-full mb-6 border border-border-subtle">
            <Icon name="group" size={16} color={colors.onSurfaceVariant} />
            <Text className="font-body text-xs text-on-surface-variant ml-1.5">
              Managed by family
            </Text>
          </View>

          <View className="w-full flex-row items-center justify-between p-4 bg-background rounded-lg border border-border-subtle">
            <View className="flex-row items-center gap-4">
              <CompletenessRing percent={completeness} />
              <View>
                <Text className="font-body text-xs font-semibold text-on-surface">
                  Profile Completeness
                </Text>
                <Text className="font-body text-xs text-on-surface-variant">
                  Almost there!
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Nudge Card */}
        <View className="bg-surface-white rounded-xl p-5 border-l-4 border-secondary-container border border-border-subtle/50">
          <Text className="font-display text-lg text-on-surface mb-2">
            Complete your profile
          </Text>
          <Text className="font-body text-sm text-on-surface-variant mb-4">
            Profiles with complete details get 3x more interest.
          </Text>

          <Pressable
            onPress={() => toggleItem('selfie')}
            className="flex-row items-center mb-3 active:opacity-80"
          >
            <Icon
              name={completedItems.selfie ? 'check_circle' : 'radio_button_unchecked'}
              size={22}
              color={completedItems.selfie ? colors.primaryContainer : colors.outlineVariant}
              fill={completedItems.selfie}
            />
            <Text
              className={`font-body text-sm ml-3 ${
                completedItems.selfie ? 'line-through text-outline' : 'text-on-surface'
              }`}
            >
              Selfie verification
            </Text>
          </Pressable>

          <Pressable
            onPress={() => toggleItem('family')}
            className="flex-row items-center active:opacity-80"
          >
            <Icon
              name={completedItems.family ? 'check_circle' : 'radio_button_unchecked'}
              size={22}
              color={completedItems.family ? colors.primaryContainer : colors.outlineVariant}
              fill={completedItems.family}
            />
            <Text
              className={`font-body text-sm ml-3 ${
                completedItems.family ? 'line-through text-outline' : 'text-on-surface'
              }`}
            >
              Family background details
            </Text>
          </Pressable>

          <Pressable
            onPress={onEditPersonal}
            className="mt-4 w-full h-11 border border-primary rounded-lg items-center justify-center active:bg-surface-container-low"
          >
            <Text className="font-body text-xs font-semibold text-primary">
              Add Details
            </Text>
          </Pressable>
        </View>

        {/* Verification Banner */}
        <View className="bg-background rounded-xl p-5 border border-border-subtle">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 bg-surface-container rounded-full items-center justify-center">
              <Icon name="verified" size={22} color={colors.verificationGold} fill />
            </View>
            <View className="flex-1">
              <Text className="font-body text-base text-on-surface font-semibold">
                Verify your profile
              </Text>
              <Text className="font-body text-xs text-on-surface-variant">
                Build trust with potential matches
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => Alert.alert('Verification', 'Verification process started!')}
            className="w-full h-10 bg-surface-white border border-border-subtle rounded-lg items-center justify-center active:bg-surface-container-low"
          >
            <Text className="font-body text-xs font-semibold text-on-surface">
              Verify now
            </Text>
          </Pressable>
        </View>

        {/* Sections List */}
        <View className="bg-surface-white rounded-xl border border-border-subtle/50 overflow-hidden">
          {sections.map((section, index) => (
            <Pressable
              key={section.label}
              onPress={onEditPersonal}
              className={`flex-row items-center justify-between p-4 active:bg-surface-container-low ${
                section.highlight ? 'bg-primary-container/5' : ''
              } ${index > 0 ? 'border-t border-border-subtle' : ''}`}
            >
              <View className="flex-row items-center gap-4 flex-1">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    section.highlight
                      ? 'bg-primary-container'
                      : 'bg-surface-container-low'
                  }`}
                >
                  <Icon
                    name={section.icon}
                    size={20}
                    color={section.highlight ? '#ffffff' : colors.onSurfaceVariant}
                    fill={section.highlight}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`font-body text-sm ${
                      section.highlight
                        ? 'text-primary font-semibold'
                        : 'text-on-surface font-medium'
                    }`}
                  >
                    {section.label}
                  </Text>
                  {section.subtitle && (
                    <Text className="text-[11px] text-on-surface-variant">
                      {section.subtitle}
                    </Text>
                  )}
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                {section.highlight && (
                  <View className="bg-primary-container px-2 py-0.5 rounded-full">
                    <Text className="text-xs text-white font-body font-semibold">Edit</Text>
                  </View>
                )}
                <Icon
                  name="chevron_right"
                  size={20}
                  color={section.highlight ? colors.primary : colors.outlineVariant}
                />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Promo Cards */}
        <View className="gap-4">
          <Pressable
            onPress={() =>
              setBoostToast('Boost Activated! Your profile will be highlighted for 24h. ⚡')
            }
            className="bg-[#FFF8E7] rounded-xl p-5 border border-[#FDE0A6] overflow-hidden active:opacity-95"
          >
            <View className="flex-row items-center gap-2 mb-2">
              <Icon name="bolt" size={22} color={colors.verificationGold} fill />
              <Text className="font-display text-base text-on-surface font-semibold">
                Boost my profile
              </Text>
            </View>
            <Text className="font-body text-xs text-on-surface-variant mb-4">
              Get seen by up to 10x more matches for 24 hours.
            </Text>
            <View className="flex-row items-center">
              <Text className="font-body text-xs font-semibold text-gold">Learn more</Text>
              <Icon name="arrow_forward" size={16} color={colors.verificationGold} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => Alert.alert('Premium', 'Upgrade to Rishta Premium!')}
            className="bg-surface-white rounded-xl p-5 border border-border-subtle active:border-primary/30"
          >
            <View className="flex-row items-center gap-2 mb-2">
              <Icon name="workspace_premium" size={22} color={colors.primary} />
              <Text className="font-display text-base text-on-surface font-semibold">
                Your plan: Free
              </Text>
            </View>
            <Text className="font-body text-xs text-on-surface-variant mb-4">
              Unlock premium filters and see who liked you.
            </Text>
            <View className="flex-row items-center">
              <Text className="font-body text-xs font-semibold text-primary">Upgrade</Text>
              <Icon name="arrow_forward" size={16} color={colors.primary} />
            </View>
          </Pressable>
        </View>

        <Pressable
          onPress={onPreviewPublicProfile}
          className="flex-row items-center justify-center pt-4 opacity-80 active:opacity-100"
        >
          <Icon name="visibility" size={18} color={colors.primary} />
          <Text className="font-body text-sm text-primary ml-2">
            Preview how others see you
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};
