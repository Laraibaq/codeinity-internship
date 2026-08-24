import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '../common/Icon';
import { reportModalBackdropProfile, reportReasons } from '../../data/feedMock';
import { colors } from '../../../shared/tokens';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport?: (reason: string, details: string) => void;
  onBlockUser?: () => void;
}

const inputStyle =
  Platform.OS === 'web'
    ? ({ outlineStyle: 'none' } as unknown as object)
    : undefined;

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitReport,
  onBlockUser,
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedReason('');
      setDetails('');
      setSubmitted(false);
      setBlocked(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!submitted && !blocked) return;
    const timer = setTimeout(() => {
      setSubmitted(false);
      setBlocked(false);
      onClose();
    }, 1800);
    return () => clearTimeout(timer);
  }, [submitted, blocked, onClose]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedReason) {
      Alert.alert('Report', 'Please select a reason for reporting.');
      return;
    }
    setSubmitted(true);
    onSubmitReport?.(selectedReason, details);
  };

  const handleBlock = () => {
    setBlocked(true);
    onBlockUser?.();
  };

  const profile = reportModalBackdropProfile;

  return (
    <View className="absolute inset-0 z-50">
      {/* Backdrop profile preview */}
      <View className="absolute inset-0 bg-surface-container-lowest">
        <View className="flex-row items-center justify-between px-5 h-16 border-b border-border-subtle bg-surface-container-lowest">
          <View className="w-10 h-10 items-center justify-center">
            <Icon name="arrow_back" size={24} color={colors.primary} />
          </View>
          <Text className="font-display text-base text-primary">
            {profile.name}, {profile.age}
          </Text>
          <View className="w-10 h-10 items-center justify-center">
            <Icon name="more_vert" size={24} color={colors.primary} />
          </View>
        </View>

        <ScrollView className="flex-1" scrollEnabled={false}>
          <View className="w-full aspect-[4/5] relative">
            <Image
              source={{ uri: profile.imageUrl }}
              className="w-full h-full rounded-b-3xl"
              contentFit="cover"
              accessibilityLabel="Profile photo"
            />
            <View className="absolute bottom-4 left-4 right-4 flex-row flex-wrap gap-2">
              <View className="bg-surface-white/90 px-3 py-1.5 rounded-full flex-row items-center gap-1">
                <Icon name="verified" size={16} color={colors.verificationGold} fill />
                <Text className="font-body text-xs text-on-surface">Verified</Text>
              </View>
              <View className="bg-surface-white/90 px-3 py-1.5 rounded-full">
                <Text className="font-body text-xs text-on-surface">
                  {profile.city}, {profile.country}
                </Text>
              </View>
            </View>
          </View>

          <View className="px-5 pt-6 pb-4">
            <Text className="font-display text-2xl text-on-surface mb-2">
              {profile.name}, {profile.age}
            </Text>
            <Text className="font-body text-base text-on-surface-variant">
              {profile.profession} • {profile.height} • {profile.sect}
            </Text>
            <View className="mt-6">
              <Text className="font-display text-base text-primary mb-2 font-semibold">
                About Me
              </Text>
              <Text className="font-body text-sm text-on-surface-variant leading-relaxed">
                I value a balance between modern professional life and traditional family roots.
                Looking for someone who is driven, kind, and respects mutual growth...
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Scrim */}
      <Pressable
        className="absolute inset-0 bg-on-surface/40"
        onPress={onClose}
        accessibilityLabel="Close report modal"
      />

      {/* Bottom Sheet */}
      <View className="absolute bottom-0 left-0 right-0 bg-surface-white rounded-t-3xl max-h-[90%] overflow-hidden">
        <View className="w-full items-center pt-3 pb-1">
          <View className="w-12 h-1.5 bg-border-subtle rounded-full" />
        </View>

        <View className="flex-row items-center justify-between px-5 py-4 border-b border-border-subtle">
          <Text className="font-display text-lg text-primary font-semibold flex-1">
            Report or block this profile
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close"
            className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-container-high"
          >
            <Icon name="close" size={24} color={colors.primary} />
          </Pressable>
        </View>

        {submitted ? (
          <View className="p-8 items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-primary-container items-center justify-center">
              <Icon name="check" size={24} color="#ffffff" />
            </View>
            <Text className="font-display text-base text-primary font-semibold">
              Report Submitted
            </Text>
            <Text className="font-body text-sm text-on-surface-variant text-center">
              Thank you. Our moderation team will review this profile shortly.
            </Text>
          </View>
        ) : blocked ? (
          <View className="p-8 items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-error items-center justify-center">
              <Icon name="block" size={24} color="#ffffff" />
            </View>
            <Text className="font-display text-base text-error font-semibold">
              User Blocked
            </Text>
            <Text className="font-body text-sm text-on-surface-variant text-center">
              This user has been blocked. They will no longer see your profile.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text className="font-display text-base text-on-surface font-semibold mb-2">
              Why are you reporting this profile?
            </Text>

            {reportReasons.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setSelectedReason(item.id)}
                className={`flex-row items-start gap-3 p-3.5 rounded-xl border ${
                  selectedReason === item.id
                    ? 'border-primary bg-primary-container/5'
                    : 'border-border-subtle bg-surface'
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mt-0.5 items-center justify-center ${
                    selectedReason === item.id
                      ? 'border-primary bg-primary'
                      : 'border-outline-variant'
                  }`}
                >
                  {selectedReason === item.id && (
                    <View className="w-2 h-2 rounded-full bg-white" />
                  )}
                </View>
                <Text className="font-body text-base text-on-surface flex-1">
                  {item.label}
                </Text>
              </Pressable>
            ))}

            <View className="gap-1 mt-2">
              <Text className="font-body text-xs text-on-surface-variant px-1">
                Add details (Optional)
              </Text>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Please provide any additional context..."
                placeholderTextColor={colors.outlineVariant}
                multiline
                numberOfLines={3}
                className="w-full bg-surface-white border border-border-subtle rounded-xl p-3 font-body text-sm text-on-surface min-h-[80px]"
                style={inputStyle}
                textAlignVertical="top"
              />
            </View>

            <View className="pt-4 mt-2 border-t border-border-subtle gap-4">
              <Pressable
                onPress={handleSubmit}
                className="w-full h-12 bg-primary-container rounded-xl flex-row items-center justify-center active:bg-primary"
              >
                <Text className="font-body text-base text-white font-medium">
                  Submit report
                </Text>
              </Pressable>

              <View className="items-center gap-2">
                <Pressable
                  onPress={handleBlock}
                  className="w-full h-12 bg-surface-white border-2 border-error rounded-xl flex-row items-center justify-center gap-2 active:bg-error-container/20"
                >
                  <Icon name="block" size={20} color={colors.error} />
                  <Text className="font-body text-base text-error font-medium">
                    Block instead
                  </Text>
                </Pressable>
                <Text className="font-body text-xs text-on-surface-variant opacity-80 text-center">
                  They'll no longer see you and you won't see them
                </Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
};
