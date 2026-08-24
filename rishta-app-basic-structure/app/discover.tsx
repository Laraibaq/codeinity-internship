import React, { useState } from "react";
import { View, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { DiscoverView } from "../src/components/feed/DiscoverView";
import { ExploreView } from "../src/components/feed/ExploreView";
import { FilterModal } from "../src/components/feed/FilterModal";
import { ReportModal } from "../src/components/feed/ReportModal";
import { Icon } from "../src/components/common/Icon";
import type { FeedProfile } from "../src/types/feed";

type FeedMode = "discover" | "explore";

export default function DiscoverScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<FeedMode>("discover");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-border-subtle bg-surface-white">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 px-2 py-1.5"
        >
          <Icon name="arrow_back" size={20} color="#003527" />
          <Text className="font-body text-sm text-primary font-semibold">Back</Text>
        </Pressable>
        <View className="flex-row bg-surface-container rounded-full p-1">
          {(["discover", "explore"] as FeedMode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              className={`px-4 py-1.5 rounded-full ${mode === m ? "bg-primary" : ""}`}
            >
              <Text
                className={`font-body text-xs font-semibold capitalize ${mode === m ? "text-white" : "text-on-surface-variant"}`}
              >
                {m}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => router.push("/own-profile")}
          className="px-2 py-1.5"
        >
          <Icon name="person" size={20} color="#003527" />
        </Pressable>
      </View>

      <View className="flex-1">
        {mode === "discover" ? (
          <DiscoverView
            onOpenFilters={() => setFiltersOpen(true)}
            onSelectProfile={(profile: FeedProfile) => {
              showToast(`Viewing ${profile.name}'s profile`);
              setMode("explore");
            }}
            onOpenMenu={() => router.push("/")}
            onOpenNotifications={() => showToast("You have 2 new profile views")}
          />
        ) : (
          <ExploreView
            onOpenFilters={() => setFiltersOpen(true)}
            onOpenReportModal={() => setReportOpen(true)}
            onOpenMenu={() => router.push("/")}
            onOpenNotifications={() => showToast("You have 2 new profile views")}
            onUnlockPremium={() => router.push("/settings")}
          />
        )}
      </View>

      <FilterModal
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApplyFilters={(filters) => {
          showToast(`Filters applied: ${filters.city}, ${filters.sect}`);
        }}
      />

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmitReport={(reason) => showToast(`Report received for ${reason}`)}
        onBlockUser={() => showToast("User has been blocked")}
      />

      {toast && (
        <View className="absolute top-20 left-0 right-0 items-center z-50 px-4">
          <View className="bg-primary px-4 py-2.5 rounded-full">
            <Text className="text-white font-body text-xs">{toast}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
