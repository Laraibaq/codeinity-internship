import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Icon } from '../common/Icon';
import type { FeedFilters } from '../../types/feed';
import { colors } from '../../../shared/tokens';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters?: (filters: FeedFilters) => void;
}

const CITY_OPTIONS = [
  { value: 'All', label: 'All Cities (Lahore, Karachi, Dubai, Islamabad)' },
  { value: 'Lahore', label: 'Lahore, Pakistan' },
  { value: 'Karachi', label: 'Karachi, Pakistan' },
  { value: 'Islamabad', label: 'Islamabad, Pakistan' },
  { value: 'Dubai', label: 'Dubai, UAE' },
];

const SECT_OPTIONS = [
  { value: 'All', label: 'Any Sect' },
  { value: 'Sunni', label: 'Sunni' },
  { value: 'Shia', label: 'Shia' },
  { value: 'Just Muslim', label: 'Just Muslim' },
];

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          className={`px-3 py-2 rounded-lg border ${
            value === opt.value
              ? 'border-primary-container bg-primary-container/10'
              : 'border-border-subtle bg-surface-white'
          }`}
        >
          <Text
            className={`font-body text-xs ${
              value === opt.value ? 'text-primary font-semibold' : 'text-on-surface'
            }`}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
}) => {
  const [minAge, setMinAge] = useState(21);
  const [maxAge, setMaxAge] = useState(35);
  const [city, setCity] = useState('All');
  const [sect, setSect] = useState('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters?.({ minAge, maxAge, city, sect, verifiedOnly });
    onClose();
  };

  const handleReset = () => {
    setMinAge(21);
    setMaxAge(35);
    setCity('All');
    setSect('All');
    setVerifiedOnly(false);
    onClose();
  };

  return (
    <View className="absolute inset-0 z-50 justify-end bg-on-surface/40">
      <Pressable className="absolute inset-0" onPress={onClose} accessibilityLabel="Close filters" />

      <View className="bg-surface-white rounded-t-3xl p-6 max-h-[90%]">
        <View className="flex-row items-center justify-between border-b border-border-subtle pb-4 mb-6">
          <Text className="font-display text-xl text-primary font-semibold">
            Filter Matches
          </Text>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-full items-center justify-center active:bg-surface-container-low"
          >
            <Icon name="close" size={24} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ gap: 24, paddingBottom: 16 }}>
          {/* Age Range */}
          <View className="gap-3">
            <Text className="font-display text-sm text-rich-green font-semibold">
              Age Range: {minAge} - {maxAge}
            </Text>
            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-1 items-center gap-2">
                <Text className="font-body text-xs text-on-surface-variant">Min</Text>
                <View className="flex-row items-center gap-3">
                  <Pressable
                    onPress={() => setMinAge((v) => Math.max(18, v - 1))}
                    className="w-10 h-10 rounded-full bg-surface-container items-center justify-center"
                  >
                    <Icon name="remove" size={18} color={colors.primary} />
                  </Pressable>
                  <Text className="font-body text-lg text-primary font-semibold w-8 text-center">
                    {minAge}
                  </Text>
                  <Pressable
                    onPress={() => setMinAge((v) => Math.min(maxAge - 1, v + 1))}
                    className="w-10 h-10 rounded-full bg-surface-container items-center justify-center"
                  >
                    <Icon name="add" size={18} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
              <View className="flex-1 items-center gap-2">
                <Text className="font-body text-xs text-on-surface-variant">Max</Text>
                <View className="flex-row items-center gap-3">
                  <Pressable
                    onPress={() => setMaxAge((v) => Math.max(minAge + 1, v - 1))}
                    className="w-10 h-10 rounded-full bg-surface-container items-center justify-center"
                  >
                    <Icon name="remove" size={18} color={colors.primary} />
                  </Pressable>
                  <Text className="font-body text-lg text-primary font-semibold w-8 text-center">
                    {maxAge}
                  </Text>
                  <Pressable
                    onPress={() => setMaxAge((v) => Math.min(50, v + 1))}
                    className="w-10 h-10 rounded-full bg-surface-container items-center justify-center"
                  >
                    <Icon name="add" size={18} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* City */}
          <View className="gap-2">
            <Text className="font-body text-xs text-on-surface-variant">Location / City</Text>
            <ChipRow options={CITY_OPTIONS} value={city} onChange={setCity} />
          </View>

          {/* Sect */}
          <View className="gap-2">
            <Text className="font-body text-xs text-on-surface-variant">Sect Preference</Text>
            <ChipRow options={SECT_OPTIONS} value={sect} onChange={setSect} />
          </View>

          {/* Verified Toggle */}
          <Pressable
            onPress={() => setVerifiedOnly(!verifiedOnly)}
            className="flex-row items-center justify-between p-3 rounded-xl border border-border-subtle bg-surface-container-low"
          >
            <View className="flex-row items-center gap-2">
              <Icon name="verified" size={20} color={colors.verificationGold} fill />
              <Text className="font-body text-sm text-on-surface font-medium">
                Verified Profiles Only
              </Text>
            </View>
            <View
              className={`w-12 h-6 rounded-full ${
                verifiedOnly ? 'bg-primary-container' : 'bg-surface-container-highest'
              }`}
            >
              <View
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                style={{ left: verifiedOnly ? 26 : 2 }}
              />
            </View>
          </Pressable>
        </ScrollView>

        {/* Actions */}
        <View className="flex-row gap-3 pt-4 border-t border-border-subtle mt-2">
          <Pressable
            onPress={handleReset}
            className="flex-1 py-3 border border-border-subtle rounded-xl items-center active:bg-surface-container-low"
          >
            <Text className="font-body text-sm text-on-surface font-semibold">Reset</Text>
          </Pressable>
          <Pressable
            onPress={handleApply}
            className="flex-1 py-3 bg-primary-container rounded-xl items-center active:bg-primary"
          >
            <Text className="font-body text-sm text-white font-semibold">Apply Filters</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
