import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import { PatternOverlay } from "../common/PatternOverlay";
import type { ScreenType, BoostPack, ToastType } from "../../types/settings";

interface BoostScreenProps {
  onNavigate: (screen: ScreenType) => void;
  boostPacks: BoostPack[];
  showToast: (msg: string, type?: ToastType) => void;
}

export const BoostScreen: React.FC<BoostScreenProps> = ({
  onNavigate,
  boostPacks,
  showToast,
}) => {
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(86400);
  const [extraBoosts, setExtraBoosts] = useState(0);

  useEffect(() => {
    if (!isBoostActive || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isBoostActive, secondsRemaining]);

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleActivateBoost = () => {
    if (isBoostActive) {
      showToast("Boost is already active on your profile!", "info");
      return;
    }
    setIsBoostActive(true);
    setSecondsRemaining(86400);
    showToast(
      "🚀 Profile Boost Activated! You are now featured on Explore for 24 hours.",
      "success"
    );
  };

  const handleBuyPack = (pack: BoostPack) => {
    setExtraBoosts((prev) => prev + pack.count);
    showToast(
      `Purchased ${pack.name} (${pack.price})! Added ${pack.count} boost(s) to your account.`,
      "success"
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="border-b border-border-subtle bg-background flex-row justify-between items-center px-5 h-14">
        <Pressable
          onPress={() => onNavigate("settings")}
          className="p-2 -ml-2 active:opacity-80"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow_back" size={20} color="#003527" />
        </Pressable>
        <Text className="font-display text-2xl font-bold text-primary">
          Rishta
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-6 pb-24 gap-8 max-w-md self-center w-full"
      >
        <View className="relative bg-surface-white rounded-xl shadow-lg border border-border-subtle p-6 overflow-hidden items-center">
          <PatternOverlay opacity={0.5} />

          <View className="relative z-10 bg-gold/10 w-20 h-20 rounded-full items-center justify-center mb-4">
            <Icon name="rocket" size={40} color="#B45309" />
          </View>

          <Text className="font-display text-xl font-bold text-primary mb-2">
            Boost Your Profile
          </Text>

          <Text className="text-sm text-on-surface-variant mb-6 text-center leading-relaxed font-body">
            Appear higher in others' Explore for 24 hours. Get noticed by more
            potential matches.
          </Text>

          <View className="bg-surface-container-low rounded-lg py-3 px-4 w-full flex-row items-center justify-between mb-6 border border-border-subtle">
            <View className="flex-row items-center gap-2 flex-1">
              <Icon name="check_circle" size={16} color="#B45309" fill />
              <Text className="text-sm text-on-surface font-medium font-body">
                1 boost included this month
              </Text>
            </View>
            <Text className="text-xs font-semibold text-gold uppercase tracking-wider">
              FREE
            </Text>
          </View>

          {isBoostActive ? (
            <View className="w-full bg-primary-container p-4 rounded-lg shadow-md gap-2">
              <View className="flex-row items-center justify-center gap-2">
                <Icon name="bolt" size={16} color="#B45309" />
                <Text className="font-semibold text-sm text-white">
                  BOOST ACTIVE
                </Text>
              </View>
              <Text className="text-xs text-primary-fixed text-center">
                Time Remaining:{" "}
                <Text className="font-bold text-white">
                  {formatTimer(secondsRemaining)}
                </Text>
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={handleActivateBoost}
              className="bg-primary-container w-full h-14 rounded-lg items-center justify-center flex-row gap-2 active:bg-primary shadow-md"
            >
              <Icon name="bolt" size={20} color="#b0f0d6" />
              <Text className="text-white text-base font-medium font-body">
                Activate Boost
              </Text>
            </Pressable>
          )}

          <Text className="text-xs text-outline mt-4 text-center font-body">
            Only one active boost at a time.
            {extraBoosts > 0 && ` (Inventory: ${extraBoosts} extra boost packs)`}
          </Text>
        </View>

        <View className="gap-4">
          <View className="flex-row items-center justify-between px-2">
            <Text className="font-display text-xl font-bold text-primary">
              Buy Extra Boosts
            </Text>
            {extraBoosts > 0 && (
              <View className="bg-gold/10 px-2.5 py-1 rounded-full">
                <Text className="text-xs font-semibold text-gold">
                  {extraBoosts} Owned
                </Text>
              </View>
            )}
          </View>

          {boostPacks.map((pack) => (
            <Pressable
              key={pack.id}
              onPress={() => handleBuyPack(pack)}
              className={`relative bg-surface-white rounded-xl p-4 flex-row items-center justify-between active:scale-[0.98] ${
                pack.popular
                  ? "shadow-md border-2 border-gold"
                  : "shadow-sm border border-border-subtle"
              }`}
            >
              {pack.popular && (
                <View className="absolute -top-3 self-center left-0 right-0 items-center">
                  <View className="bg-gold px-3 py-0.5 rounded-full">
                    <Text className="text-white text-[11px] font-bold tracking-wider uppercase">
                      Most Popular
                    </Text>
                  </View>
                </View>
              )}

              <View className="flex-row items-center gap-4 mt-1 flex-1">
                <View className="bg-gold/10 w-12 h-12 rounded-full items-center justify-center relative">
                  <Icon name="rocket" size={24} color="#B45309" />
                  {pack.count > 1 && (
                    <View className="absolute -bottom-1 -right-1 bg-surface-white rounded-full w-5 h-5 items-center justify-center border border-border-subtle">
                      <Text className="text-[10px] text-gold font-bold">
                        x{pack.count}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-on-surface font-body">
                    {pack.name}
                  </Text>
                  <Text className="text-sm text-on-surface-variant font-body">
                    {pack.subtitle}
                  </Text>
                </View>
              </View>

              <View className="items-end mt-1">
                <Text className="font-display text-lg font-bold text-primary">
                  {pack.price}
                </Text>
                {pack.originalPrice && (
                  <Text className="text-xs text-outline line-through font-body">
                    {pack.originalPrice}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
