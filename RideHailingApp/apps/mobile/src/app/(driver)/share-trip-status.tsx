import { useState } from "react";
import { Pressable, Share, Switch, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// New screen: safety-center.tsx's "Share Trip Status" row previously had no destination (a bare,
// unwired Pressable). No live-location backend exists yet, so the toggle below is local UI state
// only, same pattern as Settings' notification toggles -- but "Share via..." is real, using RN's
// built-in `Share` API (no backend needed) to open the device's native share sheet with a message,
// the same category of "real, no-backend-needed action" as Linking-based call/email buttons
// elsewhere in this project.

export default function ShareTripStatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [liveShareEnabled, setLiveShareEnabled] = useState(false);

  const handleShare = () => {
    Share.share({
      message:
        "I'm currently driving a trip. You can check in with me anytime -- sharing my status for safety.",
    });
  };

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="w-full bg-surface shadow-sm">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Share Trip Status
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="mx-auto w-full max-w-4xl gap-stack-md px-container-margin py-stack-md">
        <View className="gap-stack-sm rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="font-body-md text-body-md font-semibold text-on-surface">
                Live Location Sharing
              </Text>
              <Text className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                Trusted contacts can see your live location and ETA while this is on.
              </Text>
            </View>
            <Switch
              value={liveShareEnabled}
              onValueChange={setLiveShareEnabled}
              trackColor={{ false: themeColors.surfaceContainerHigh, true: themeColors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <Pressable
          onPress={handleShare}
          className="w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4 shadow-sm active:scale-[0.98]"
        >
          <MaterialIcons name="ios-share" size={20} color={themeColors.onPrimary} />
          <Text className="font-body-md text-body-md font-semibold text-on-primary">
            Share via...
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
