import React from "react";
import { Tabs, useRouter } from "expo-router";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../src/components/common/Icon";
import { useSocial } from "../../src/context/SocialContext";
import { Header } from "../../src/components/social/Header";
import { MatchCelebrationModal } from "../../src/components/social/MatchCelebrationModal";
import { DailyLimitModal } from "../../src/components/social/DailyLimitModal";
import { NotificationDrawer } from "../../src/components/social/NotificationDrawer";
import type { NavTab } from "../../src/types/social";

const TAB_CONFIG: {
  name: NavTab;
  title: string;
  icon: string;
  fill?: boolean;
}[] = [
  { name: "explore", title: "Explore", icon: "search" },
  { name: "requests", title: "Requests", icon: "person_add", fill: true },
  { name: "matches", title: "Matches", icon: "favorite", fill: true },
  { name: "inbox", title: "Inbox", icon: "mail", fill: true },
  { name: "profile", title: "Profile", icon: "account_circle" },
];

function MobileTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { pendingRequestsCount, unreadMessagesCount } = useSocial();

  return (
    <View
      className="bg-surface-white border-t border-border-subtle"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="flex-row justify-around items-center px-2 py-2">
        {state.routes.map((route: any, index: number) => {
          const cfg = TAB_CONFIG.find((t) => t.name === route.name);
          if (!cfg) return null;
          const isActive = state.index === index;
          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              className="items-center justify-center min-w-[64px] py-1"
            >
              <View className="relative">
                <Icon
                  name={cfg.icon}
                  size={22}
                  color={isActive ? "#003527" : "#707974"}
                  fill={isActive && !!cfg.fill}
                />
                {cfg.name === "requests" && pendingRequestsCount > 0 && (
                  <View className="absolute -top-1 -right-2 bg-error min-w-[16px] h-4 px-1 rounded-full items-center justify-center">
                    <Text className="text-white text-[9px] font-bold">
                      {pendingRequestsCount}
                    </Text>
                  </View>
                )}
                {cfg.name === "inbox" && unreadMessagesCount > 0 && (
                  <View className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gold rounded-full" />
                )}
              </View>
              <Text
                className={`font-body text-[10px] mt-1 ${isActive ? "text-primary font-semibold" : "text-outline"}`}
              >
                {cfg.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function WideTopNav({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (name: string) => void;
}) {
  const { pendingRequestsCount, unreadMessagesCount } = useSocial();

  return (
    <View className="bg-surface-white border-b border-border-subtle flex-row justify-center gap-10 py-3">
      {TAB_CONFIG.map((cfg) => {
        const isActive = active === cfg.name;
        return (
          <Pressable
            key={cfg.name}
            onPress={() => onSelect(cfg.name)}
            className={`flex-row items-center gap-2 ${isActive ? "border-b-2 border-primary-container pb-1" : ""}`}
          >
            <Icon
              name={cfg.icon}
              size={20}
              color={isActive ? "#003527" : "#404944"}
              fill={isActive && !!cfg.fill}
            />
            <Text
              className={`font-body text-sm font-semibold ${isActive ? "text-primary" : "text-on-surface-variant"}`}
            >
              {cfg.title}
            </Text>
            {cfg.name === "requests" && pendingRequestsCount > 0 && (
              <View className="bg-error px-1.5 py-0.5 rounded-full">
                <Text className="text-white text-[10px] font-bold">
                  {pendingRequestsCount}
                </Text>
              </View>
            )}
            {cfg.name === "inbox" && unreadMessagesCount > 0 && (
              <View className="w-2 h-2 bg-gold rounded-full" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const {
    user,
    pendingRequestsCount,
    unreadMessagesCount,
    setShowNotifications,
    matchedCelebrationProfile,
    setMatchedCelebrationProfile,
    handleOpenChat,
    showDailyLimitModal,
    setShowDailyLimitModal,
    handleUpgradePlan,
    showNotifications,
    setActiveTab,
    activeTab,
  } = useSocial();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return (
    <View className="flex-1 bg-background">
      <Header
        user={user}
        onOpenMenu={() => router.push("/")}
        onOpenNotifications={() => setShowNotifications(true)}
        unreadNotificationsCount={pendingRequestsCount + unreadMessagesCount}
      />

      {isWide && (
        <WideTopNav
          active={activeTab}
          onSelect={(name) => {
            setActiveTab(name as NavTab);
            router.push(`/(tabs)/${name}` as any);
          }}
        />
      )}

      <Tabs
        tabBar={(props) => (isWide ? null : <MobileTabBar {...props} />)}
        screenOptions={{ headerShown: false }}
        screenListeners={{
          state: (e) => {
            const routes = e.data.state?.routes;
            const index = e.data.state?.index ?? 0;
            const name = routes?.[index]?.name as NavTab | undefined;
            if (name) setActiveTab(name);
          },
        }}
      >
        {TAB_CONFIG.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{ title: tab.title }}
          />
        ))}
      </Tabs>

      {matchedCelebrationProfile && (
        <MatchCelebrationModal
          user={user}
          matchedProfile={matchedCelebrationProfile}
          onSaySalaam={(profileId) => {
            setMatchedCelebrationProfile(null);
            handleOpenChat(profileId);
            router.push(`/chat/${profileId}`);
          }}
          onKeepBrowsing={() => setMatchedCelebrationProfile(null)}
        />
      )}

      {showDailyLimitModal && (
        <DailyLimitModal
          user={user}
          onUpgrade={handleUpgradePlan}
          onClose={() => setShowDailyLimitModal(false)}
        />
      )}

      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNavigateToRequests={() => {
          setShowNotifications(false);
          router.push("/(tabs)/requests");
        }}
        onNavigateToMatches={() => {
          setShowNotifications(false);
          router.push("/(tabs)/matches");
        }}
      />
    </View>
  );
}
