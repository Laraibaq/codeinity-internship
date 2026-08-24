import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";

interface Props {
  onSeeMatches: () => void;
}

export const ProfileActivatingScreen: React.FC<Props> = ({ onSeeMatches }) => {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 max-w-md mx-auto w-full px-5">
          {/* Top App Bar / Progress */}
          <View className="w-full pt-6 pb-4 gap-4">
            {/* Progress Bar (12 of 12) */}
            <View className="w-full flex-row gap-1 h-1.5 rounded-full overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <View
                  key={i}
                  className="flex-1 bg-primary-container"
                />
              ))}
            </View>
            <View className="flex-row items-center justify-center">
              <Text className="font-display text-2xl font-bold text-primary tracking-tight">
                Matrimonial Grace
              </Text>
            </View>
          </View>

          {/* Main Content */}
          <View className="flex-1 items-center justify-center py-8">
            {/* Illustration Area */}
            <View className="w-64 h-64 mb-8 items-center justify-center">
              {/* Central Image/Illustration */}
              <View className="w-48 h-48 rounded-full overflow-hidden shadow-2xl border-4 border-white bg-surface-white items-center justify-center">
                <Image
                  source={{
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdUb9DEZL2u6Wb6JUxc-LsfIH97z-ZilsVvQ3zPyEbZd2Q-aBHIYWYoSRpRVD2PesqtUjHWd6ek74cy0Bc6S3GrIwKry7R6kACZGT6LDnY6eddvAwI_jFeUNPQnUoWMcMdsiwSDvOJVfkcJXQRsTK9fr4vWdz4S_zND0fdWHPj8eCxvC4hX-jsanp30-W-UdTQiCvYBTFkYcnzTGDZIfncDtZJqquN9zAf5k-FEzFh6La16dBYgviUTQ",
                  }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
                {/* Overlay verified badge */}
                <View className="absolute bottom-4 right-4 w-10 h-10 bg-surface-white rounded-full items-center justify-center shadow-lg border border-border-subtle">
                  <Icon name="verified" size={20} color="#B45309" fill />
                </View>
              </View>
            </View>

            {/* Typography */}
            <View className="items-center gap-4 mb-8">
              <Text className="font-display text-2xl font-bold text-rich-green text-center">
                Jazakallah — your profile is activating
              </Text>
              <View className="max-w-[300px]">
                <Text className="font-body text-sm text-on-surface-variant text-center">
                  We are carefully reviewing your details to ensure a safe,
                  verified community. Your matches will be ready shortly.
                </Text>
              </View>
            </View>

            {/* Reassurance Chips */}
            <View className="flex-row flex-wrap justify-center gap-3 py-2 mb-6">
              <View className="flex-row items-center px-4 py-2 rounded-full bg-surface-white border border-border-subtle shadow-sm">
                <Icon name="verified" size={14} color="#B45309" fill />
                <Text className="ml-2 font-body text-xs font-semibold text-on-surface">
                  Verified Community
                </Text>
              </View>
              <View className="flex-row items-center px-4 py-2 rounded-full bg-surface-white border border-border-subtle shadow-sm">
                <Icon name="lock" size={14} color="#003527" fill />
                <Text className="ml-2 font-body text-xs font-semibold text-on-surface">
                  Privacy First
                </Text>
              </View>
            </View>

            <View className="flex-1" />
          </View>

          {/* Bottom Action Area */}
          <View className="w-full pb-8 pt-4">
            <Pressable
              onPress={onSeeMatches}
              className="w-full h-14 bg-primary-container active:bg-primary rounded-xl flex-row items-center justify-center gap-2 active:scale-95 shadow-md"
            >
              <Text className="text-white font-body text-sm font-semibold">
                See your matches
              </Text>
              <Icon name="arrow_forward" size={20} color="#ffffff" />
            </Pressable>
            <View className="mt-4 flex-row items-center justify-center gap-2">
              <Icon name="verified" size={16} color="#B45309" fill />
              <Text className="text-on-surface-variant font-body text-xs font-semibold">
                Secure & Encrypted
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
