import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import type { UserFormData } from "../../types";

interface Props {
  formData: UserFormData;
  updateFormData: (fields: Partial<UserFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const AddPhotosScreen: React.FC<Props> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
}) => {
  const photos = formData.photos || [null, null, null, null, null, null];

  const handlePhotoUpload = (index: number) => {
    // Simulated upload - set a placeholder photo
    const newPhotos = [...photos];
    newPhotos[index] = `https://images.unsplash.com/photo-${
      index === 0 ? "1534528741775-53994a69daeb" : "1517841905240-472988babdf9"
    }?auto=format&fit=crop&q=80&w=400`;
    updateFormData({ photos: newPhotos });
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos[index] = null;
    updateFormData({ photos: newPhotos });
  };

  const uploadedCount = photos.filter(Boolean).length;
  const isContinueEnabled = uploadedCount >= 2;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Top App Bar */}
      <View className="bg-background w-full border-b border-border-subtle flex-row justify-between items-center px-5 h-14">
        <Pressable
          onPress={onBack}
          className="h-12 w-12 items-center justify-center -ml-2 rounded-full active:bg-surface-container-highest active:scale-95"
        >
          <Icon name="arrow_back" size={24} color="#404944" />
        </Pressable>
        <Text className="font-display text-xl font-bold text-primary tracking-tight">
          Rishta
        </Text>
        <View className="h-12 w-12" />
      </View>

      {/* Progress Bar Segment 9 Active */}
      <View className="w-full flex-row gap-1 px-5 pt-3 pb-2 bg-background">
        {Array.from({ length: 9 }).map((_, i) => (
          <View
            key={`f-${i}`}
            className="h-1 flex-1 bg-primary rounded-full"
          />
        ))}
        {Array.from({ length: 3 }).map((_, i) => (
          <View
            key={`e-${i}`}
            className="h-1 flex-1 bg-surface-container-highest rounded-full"
          />
        ))}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-5 pt-6">
          <View className="mb-8">
            <Text className="font-display text-2xl font-bold text-on-surface mb-2">
              Add photos
            </Text>
            <Text className="font-body text-sm text-on-surface-variant">
              Please add at least 2 recent photos. Clear, well-lit photos help
              you get better matches.
            </Text>
          </View>

          {/* Photo Grid */}
          <View className="flex-row flex-wrap -mx-2 mb-8">
            {photos.map((photo, idx) => (
              <View key={idx} className="w-1/2 px-2 mb-4">
                <Pressable
                  onPress={() => handlePhotoUpload(idx)}
                  className={`relative aspect-[3/4] bg-surface-white border-2 border-dashed rounded-xl items-center justify-center overflow-hidden ${
                    idx === 0
                      ? "border-primary-container/30 active:border-primary-container"
                      : "border-outline-variant active:border-primary-container"
                  }`}
                >
                  {photo ? (
                    <>
                      <Image
                        source={{ uri: photo }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                      <Pressable
                        onPress={() => removePhoto(idx)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full items-center justify-center active:bg-black"
                      >
                        <Icon name="close" size={14} color="#ffffff" />
                      </Pressable>
                      {idx === 0 && (
                        <View className="absolute bottom-2 left-2 bg-primary px-2 py-1 rounded-full">
                          <Text className="text-white font-body text-[10px] font-semibold uppercase tracking-wider">
                            Primary
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <>
                      <View
                        className="absolute top-2 left-2 right-2 flex-row justify-between z-10"
                        pointerEvents="none"
                      >
                        {idx === 0 ? (
                          <View className="bg-primary px-2 py-1 rounded-full">
                            <Text className="text-white font-body text-[10px] font-semibold uppercase tracking-wider">
                              PRIMARY
                            </Text>
                          </View>
                        ) : (
                          <View />
                        )}
                        {idx < 2 && (
                          <View className="bg-gold/10 px-2 py-1 rounded-full flex-row items-center gap-1">
                            <Icon name="star" size={12} color="#B45309" />
                            <Text className="text-gold font-body text-[10px] font-semibold">
                              Required
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className="items-center justify-center">
                        <Icon
                          name={idx === 0 ? "add_a_photo" : "add"}
                          size={32}
                          color="#707974"
                        />
                        <Text className="mt-1 font-body text-xs font-semibold uppercase text-outline">
                          Upload
                        </Text>
                      </View>
                    </>
                  )}
                </Pressable>
              </View>
            ))}
          </View>

          <View className="flex-1" />

          {/* Privacy Note */}
          <View className="bg-surface-white p-4 rounded-lg shadow-sm border border-border-subtle flex-row items-start gap-3 mt-auto">
            <View className="mt-0.5">
              <Icon name="lock" size={20} color="#064e3b" fill />
            </View>
            <Text className="font-body text-xs text-on-surface-variant flex-1">
              Photos are only shown to profiles you choose to interact with.
              Your privacy is our priority.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Area */}
      <View className="w-full bg-background border-t border-border-subtle p-5">
        <Pressable
          onPress={onNext}
          disabled={!isContinueEnabled}
          className={`w-full h-14 rounded-lg flex-row items-center justify-center ${
            isContinueEnabled
              ? "bg-primary-container active:bg-primary"
              : "bg-primary-container/50"
          }`}
        >
          <Text
            className={`font-body font-semibold ${
              isContinueEnabled ? "text-white" : "text-white/50"
            }`}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};
