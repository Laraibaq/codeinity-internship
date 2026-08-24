import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";

interface Props {
  onNext: () => void;
  onSkip: () => void;
}

export const VerificationScreen: React.FC<Props> = ({ onNext, onSkip }) => {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Progress Bar (12 of 12) */}
      <View className="w-full px-5 pt-4 pb-2 flex-row gap-1 items-center justify-between">
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={i}
            className="flex-1 h-1.5 rounded-full bg-primary"
          />
        ))}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1">
          {/* Header Section */}
          <View className="px-5 mt-6 gap-4">
            <Text className="font-display text-2xl font-bold text-primary tracking-tight">
              Verify it's really you
            </Text>
            <View className="max-w-[320px]">
              <Text className="font-body text-sm text-on-surface-variant">
                Earn the Verified Badge. Help matches trust this profile is
                authentic. Please take a clear photo of the person this profile
                is for.
              </Text>
            </View>
          </View>

          {/* Main Content: Viewfinder */}
          <View className="flex-1 items-center justify-center px-5 mt-8 mb-8">
            {/* Camera Viewfinder Frame */}
            <View className="items-center">
              {/* Oval Frame */}
              <View
                className="rounded-[130px] border-4 border-dashed bg-surface-white/60 items-center justify-center overflow-hidden shadow-lg"
                style={{
                  width: 260,
                  height: 360,
                  borderColor: "rgba(0,53,39,0.4)",
                }}
              >
                {/* Inner guidance face SVG */}
                <View
                  className="absolute inset-0 items-center justify-center"
                  style={{ opacity: 0.2 }}
                  pointerEvents="none"
                >
                  <Svg width={140} height={180} viewBox="0 0 140 180" fill="none">
                    <Ellipse
                      cx={70}
                      cy={80}
                      rx={50}
                      ry={70}
                      stroke="#003527"
                      strokeWidth={4}
                      strokeDasharray="8 8"
                    />
                    <Path
                      d="M45 75C45 75 55 70 60 70"
                      stroke="#003527"
                      strokeWidth={4}
                      strokeLinecap="round"
                    />
                    <Path
                      d="M95 75C95 75 85 70 80 70"
                      stroke="#003527"
                      strokeWidth={4}
                      strokeLinecap="round"
                    />
                    <Path
                      d="M70 100V110"
                      stroke="#003527"
                      strokeWidth={4}
                      strokeLinecap="round"
                    />
                    <Path
                      d="M55 130C55 130 65 140 70 140C75 140 85 130 85 130"
                      stroke="#003527"
                      strokeWidth={4}
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>

                <View className="absolute bottom-6 flex-row items-center gap-2 bg-surface-white/90 px-4 py-2 rounded-full shadow-sm">
                  <Icon name="photo_camera" size={18} color="#003527" />
                </View>
              </View>

              {/* Instructions */}
              <View className="mt-8 items-center gap-3">
                <View className="flex-row items-center gap-4">
                  <View className="items-center gap-1">
                    <Icon name="person" size={24} color="#003527" />
                    <Text className="font-body text-xs font-semibold text-on-surface-variant">
                      Hold still
                    </Text>
                  </View>
                  <View className="w-px h-8 bg-border-subtle" />
                  <View className="items-center gap-1">
                    <Icon name="auto_awesome" size={24} color="#003527" />
                    <Text className="font-body text-xs font-semibold text-on-surface-variant">
                      Good lighting
                    </Text>
                  </View>
                  <View className="w-px h-8 bg-border-subtle" />
                  <View className="items-center gap-1">
                    <Icon name="face" size={24} color="#003527" />
                    <Text className="font-body text-xs font-semibold text-on-surface-variant">
                      Face visible
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="px-5 pb-6 pt-4 gap-4 bg-background border-t border-border-subtle max-w-md mx-auto w-full">
        <Pressable
          onPress={onNext}
          className="w-full h-14 rounded-full bg-primary-container active:bg-primary items-center justify-center active:scale-[0.98]"
        >
          <Text className="text-white font-body text-base font-medium">
            Verify now
          </Text>
        </Pressable>
        <Pressable
          onPress={onSkip}
          className="w-full py-3 items-center active:opacity-70"
        >
          <Text className="font-body text-xs font-semibold text-primary">
            Skip for now
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};
