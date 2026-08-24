import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Icon } from '../common/Icon';
import type { PersonalEditData } from '../../types/feed';
import { colors } from '../../../shared/tokens';

interface EditPersonalViewProps {
  onCancel: () => void;
  onSave: (data: PersonalEditData) => void;
}

const inputStyle =
  Platform.OS === 'web'
    ? ({ outlineStyle: 'none' } as unknown as object)
    : undefined;

const SECT_OPTIONS = [
  { value: 'sunni', label: 'Sunni' },
  { value: 'shia', label: 'Shia' },
  { value: 'just-muslim', label: 'Just Muslim' },
  { value: 'other', label: 'Other' },
];

const ETHNICITY_OPTIONS = [
  { value: 'punjabi', label: 'Punjabi' },
  { value: 'sindhi', label: 'Sindhi' },
  { value: 'pathan', label: 'Pathan' },
  { value: 'urdu-speaking', label: 'Urdu Speaking' },
  { value: 'balochi', label: 'Balochi' },
  { value: 'other', label: 'Other' },
];

const HOUSE_SIZE_OPTIONS = [
  { value: 'under-5', label: 'Under 5 Marla' },
  { value: '5-10', label: '5 - 10 Marla' },
  { value: '1-kanal', label: '1 Kanal' },
  { value: 'above-1', label: 'Above 1 Kanal' },
];

const INCOME_OPTIONS = [
  { value: 'under-100k', label: 'Under 100,000' },
  { value: '100k-250k', label: '100,000 - 250,000' },
  { value: '250k-500k', label: '250,000 - 500,000' },
  { value: 'above-500k', label: 'Above 500,000' },
  { value: 'prefer-not', label: 'Prefer not to say' },
];

function formatHeight(totalInches: number) {
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
}

function OptionPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="font-body text-xs font-semibold text-on-surface-variant">
        {label}
      </Text>
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
              className={`font-body text-sm ${
                value === opt.value ? 'text-primary font-semibold' : 'text-on-surface'
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const EditPersonalView: React.FC<EditPersonalViewProps> = ({
  onCancel,
  onSave,
}) => {
  const [heightInches, setHeightInches] = useState(68);
  const [sect, setSect] = useState('sunni');
  const [ethnicity, setEthnicity] = useState('punjabi');
  const [caste, setCaste] = useState('Rajput');
  const [houseSize, setHouseSize] = useState('5-10');
  const [monthlyIncome, setMonthlyIncome] = useState('100k-250k');
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    if (!saveToast) return;
    const timer = setTimeout(() => {
      setSaveToast(false);
      onCancel();
    }, 1200);
    return () => clearTimeout(timer);
  }, [saveToast, onCancel]);

  const bumpHeight = (delta: number) => {
    setHeightInches((prev) => Math.min(84, Math.max(48, prev + delta)));
  };

  const handleSave = () => {
    setSaveToast(true);
    onSave({
      heightInches,
      sect,
      ethnicity,
      caste,
      houseSize,
      monthlyIncome,
    });
  };

  return (
    <View className="flex-1 bg-background">
      {saveToast && (
        <View className="absolute top-16 self-center z-50 bg-primary px-5 py-3 rounded-full flex-row items-center gap-2">
          <Icon name="check_circle" size={16} color="#ffffff" fill />
          <Text className="font-body text-xs text-white">
            Changes saved successfully!
          </Text>
        </View>
      )}

      {/* Header */}
      <View className="flex-row justify-between items-center px-5 h-14 bg-surface border-b border-border-subtle/50">
        <Pressable onPress={onCancel} className="min-h-12 min-w-12 justify-center">
          <Text className="font-body text-base text-on-surface-variant">Cancel</Text>
        </Pressable>
        <Text className="font-display text-lg text-primary font-semibold">
          Edit Personal & Background
        </Text>
        <Pressable onPress={handleSave} className="min-h-12 min-w-12 items-end justify-center">
          <Text className="font-body text-sm font-semibold text-primary-container">Save</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 80, gap: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Height */}
        <View className="gap-4">
          <Text className="font-display text-lg text-rich-green font-semibold">
            Height
          </Text>
          <View className="bg-surface-white p-6 rounded-xl border border-border-subtle">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-body text-sm text-on-surface-variant font-medium">
                4'0"
              </Text>
              <Text className="font-display text-xl text-primary-container font-bold">
                {formatHeight(heightInches)}
              </Text>
              <Text className="font-body text-sm text-on-surface-variant font-medium">
                7'0"
              </Text>
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <Pressable
                onPress={() => bumpHeight(-1)}
                className="h-12 w-12 rounded-full bg-surface-container items-center justify-center active:bg-surface-container-high"
              >
                <Icon name="remove" size={20} color={colors.primary} />
              </Pressable>
              <View className="flex-1 h-1.5 bg-surface-dim rounded-lg overflow-hidden">
                <View
                  className="h-full bg-primary-container rounded-lg"
                  style={{
                    width: `${((heightInches - 48) / (84 - 48)) * 100}%`,
                  }}
                />
              </View>
              <Pressable
                onPress={() => bumpHeight(1)}
                className="h-12 w-12 rounded-full bg-surface-container items-center justify-center active:bg-surface-container-high"
              >
                <Icon name="add" size={20} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Religious & Cultural */}
        <View className="gap-6">
          <Text className="font-display text-lg text-rich-green font-semibold border-b border-border-subtle pb-2">
            Religious & Cultural Background
          </Text>
          <OptionPicker label="Sect" value={sect} options={SECT_OPTIONS} onChange={setSect} />
          <OptionPicker
            label="Ethnicity"
            value={ethnicity}
            options={ETHNICITY_OPTIONS}
            onChange={setEthnicity}
          />
          <View className="gap-2">
            <Text className="font-body text-xs font-semibold text-on-surface-variant">
              Caste / Baradari (Optional)
            </Text>
            <View className="flex-row items-center bg-surface-white border border-border-subtle rounded-lg px-3 py-3">
              <Icon name="search" size={20} color={colors.onSurfaceVariant} />
              <TextInput
                value={caste}
                onChangeText={setCaste}
                placeholder="Search or type..."
                placeholderTextColor={colors.outlineVariant}
                className="flex-1 font-body text-base text-on-surface ml-2"
                style={inputStyle}
              />
            </View>
          </View>
        </View>

        {/* Household */}
        <View className="gap-6">
          <Text className="font-display text-lg text-rich-green font-semibold border-b border-border-subtle pb-2">
            Household Details (Optional)
          </Text>
          <OptionPicker
            label="House Size"
            value={houseSize}
            options={HOUSE_SIZE_OPTIONS}
            onChange={setHouseSize}
          />
          <OptionPicker
            label="Monthly Income (PKR)"
            value={monthlyIncome}
            options={INCOME_OPTIONS}
            onChange={setMonthlyIncome}
          />
        </View>

        <Pressable
          onPress={handleSave}
          className="w-full h-12 bg-primary-container rounded-lg items-center justify-center active:bg-primary"
        >
          <Text className="font-body text-xs font-semibold text-white uppercase tracking-wider">
            Save Changes
          </Text>
        </Pressable>
      </ScrollView>

      <View className="py-6 items-center bg-surface border-t border-border-subtle">
        <Text className="font-body text-sm text-on-surface-variant opacity-70">
          Last updated 3 days ago
        </Text>
      </View>
    </View>
  );
};
