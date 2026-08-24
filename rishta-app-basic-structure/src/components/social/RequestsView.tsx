import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { Icon } from "../common/Icon";
import type { RequestItem } from "../../types/social";

interface RequestsViewProps {
  requests: RequestItem[];
  onAcceptRequest: (reqId: string) => void;
  onDeclineRequest: (reqId: string) => void;
  onWithdrawRequest: (reqId: string) => void;
  onNavigateToExplore: () => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  requests,
  onAcceptRequest,
  onDeclineRequest,
  onWithdrawRequest,
  onNavigateToExplore,
}) => {
  const [subTab, setSubTab] = useState<"received" | "sent">("received");

  const receivedRequests = requests.filter(
    (r) => r.type === "received" && r.status === "pending",
  );
  const sentRequests = requests.filter(
    (r) => r.type === "sent" && r.status === "pending",
  );

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 96 }}>
      <View className="px-5 py-4 bg-background/95">
        <View className="flex-row bg-surface-container-highest p-1 rounded-full w-full max-w-sm mx-auto">
          <Pressable
            onPress={() => setSubTab("received")}
            className={`flex-1 py-2 rounded-full items-center ${subTab === "received" ? "bg-surface-white shadow-sm" : ""}`}
          >
            <Text
              className={`font-body text-xs font-semibold ${subTab === "received" ? "text-primary" : "text-on-surface-variant"}`}
            >
              Received ({receivedRequests.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSubTab("sent")}
            className={`flex-1 py-2 rounded-full items-center ${subTab === "sent" ? "bg-surface-white shadow-sm" : ""}`}
          >
            <Text
              className={`font-body text-xs font-semibold ${subTab === "sent" ? "text-primary" : "text-on-surface-variant"}`}
            >
              Sent
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="px-5 py-2 flex-1 max-w-3xl w-full mx-auto">
        {subTab === "received" && (
          <View className="gap-4">
            <Text className="font-display text-xl font-semibold text-primary mb-2">
              Pending Approvals
            </Text>

            {receivedRequests.length === 0 ? (
              <View className="items-center justify-center py-16 px-4">
                <View className="w-24 h-24 rounded-full bg-surface-container-low items-center justify-center mb-4 border border-border-subtle">
                  <Icon name="inbox" size={40} color="#2b6954" />
                </View>
                <Text className="font-display text-[22px] font-bold text-primary mb-2 text-center">
                  No pending requests
                </Text>
                <Text className="font-body text-sm text-on-surface-variant max-w-xs text-center mb-6">
                  You have reviewed all incoming connection requests for now.
                </Text>
                <Pressable
                  onPress={onNavigateToExplore}
                  className="px-6 h-11 rounded-full bg-primary-container items-center justify-center active:bg-primary"
                >
                  <Text className="text-white font-body text-[13px] font-semibold">
                    Discover More Profiles
                  </Text>
                </Pressable>
              </View>
            ) : (
              receivedRequests.map((req) => (
                <View
                  key={req.id}
                  className="bg-surface-white rounded-xl p-4 border border-border-subtle overflow-hidden"
                >
                  <View className="flex-row gap-4">
                    <View className="relative">
                      <Image
                        source={{ uri: req.profile.avatar }}
                        className="w-16 h-16 rounded-full border-2 border-surface-white"
                        contentFit="cover"
                        accessibilityLabel={`${req.profile.name}'s avatar`}
                      />
                      {req.profile.verified && (
                        <View className="absolute -bottom-1 -right-1 bg-surface-white rounded-full p-0.5">
                          <Icon name="verified" size={16} color="#B45309" fill />
                        </View>
                      )}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1 pr-2">
                          <Text className="font-display text-xl font-semibold text-primary">
                            {req.profile.name}, {req.profile.age}
                          </Text>
                          <View className="flex-row items-center gap-1 mt-0.5">
                            <Icon name="location_on" size={14} color="#404944" />
                            <Text className="font-body text-sm text-on-surface-variant">
                              {req.profile.city}, {req.profile.country}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-xs font-medium text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
                          {req.timestamp}
                        </Text>
                      </View>

                      <Text className="font-body text-sm text-rich-green mt-2 font-medium" numberOfLines={1}>
                        {req.profile.occupation} · {req.profile.sect} · {req.profile.maritalStatus}
                      </Text>

                      {req.profile.managerRole && (
                        <View className="flex-row gap-2 mt-3 flex-wrap">
                          <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-high border border-border-subtle">
                            <Icon name="family_home" size={12} color="#404944" />
                            <Text className="text-xs font-medium text-on-surface-variant">
                              {req.profile.managerRole}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>

                  <View className="flex-row gap-3 mt-4 pt-4 border-t border-border-subtle">
                    <Pressable
                      onPress={() => onDeclineRequest(req.id)}
                      className="flex-1 h-11 rounded-lg border-[1.5px] border-outline items-center justify-center active:bg-surface-container-low"
                    >
                      <Text className="font-body text-[13px] font-semibold text-on-surface">Decline</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onAcceptRequest(req.id)}
                      className="flex-1 h-11 rounded-lg bg-primary-container items-center justify-center active:bg-primary"
                    >
                      <Text className="text-white font-body text-[13px] font-semibold">Accept</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {subTab === "sent" && (
          <View className="gap-4">
            <Text className="font-display text-xl font-semibold text-primary mb-2">
              Sent Requests
            </Text>

            {sentRequests.length === 0 ? (
              <View className="items-center justify-center py-16 px-4 mt-4">
                <View className="w-32 h-32 rounded-full bg-surface-container-low items-center justify-center mb-6 border border-border-subtle">
                  <Icon name="favorite" size={48} color="#2b6954" />
                </View>
                <Text className="font-display text-2xl font-bold text-primary mb-2 text-center">
                  No sent requests
                </Text>
                <Text className="font-body text-base text-on-surface-variant max-w-[250px] text-center">
                  Your journey is just beginning. Keep exploring to find your perfect match.
                </Text>
                <Pressable
                  onPress={onNavigateToExplore}
                  className="mt-8 px-6 h-12 rounded-full border-[1.5px] border-primary-container items-center justify-center active:bg-primary-container"
                >
                  <Text className="text-primary-container font-body text-[13px] font-semibold active:text-white">
                    Explore Profiles
                  </Text>
                </Pressable>
              </View>
            ) : (
              sentRequests.map((req) => (
                <View
                  key={req.id}
                  className="bg-surface-white rounded-xl p-4 border border-border-subtle"
                >
                  <View className="flex-row gap-4">
                    <Image
                      source={{ uri: req.profile.avatar }}
                      className="w-14 h-14 rounded-full border border-surface-container-highest"
                      contentFit="cover"
                      accessibilityLabel={req.profile.name}
                    />
                    <View className="flex-1">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1 pr-2">
                          <Text className="font-body text-base font-semibold text-primary">
                            {req.profile.name}, {req.profile.age}
                          </Text>
                          <Text className="font-body text-sm text-on-surface-variant" numberOfLines={1}>
                            {req.profile.occupation} · {req.profile.city}, {req.profile.country}
                          </Text>
                        </View>
                        <View className="px-2.5 py-1 rounded-full bg-secondary-fixed">
                          <Text className="text-xs font-semibold text-[#331200]">Pending</Text>
                        </View>
                      </View>
                      <View className="flex-row justify-end mt-3">
                        <Pressable
                          onPress={() => onWithdrawRequest(req.id)}
                          className="px-3 py-1 rounded-md active:bg-error-container/40"
                        >
                          <Text className="text-sm font-semibold text-error">Withdraw</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}

            <View className="items-center justify-center py-10 px-4 mt-4 border-t border-border-subtle">
              <View className="w-16 h-16 rounded-full bg-surface-container-low items-center justify-center mb-3 border border-border-subtle">
                <Icon name="favorite" size={32} color="#2b6954" />
              </View>
              <Text className="font-display text-xl font-bold text-primary mb-1 text-center">
                Explore More Matches
              </Text>
              <Text className="font-body text-sm text-on-surface-variant max-w-[260px] text-center mb-4">
                Send interests to verified profiles aligned with your family's preferences.
              </Text>
              <Pressable
                onPress={onNavigateToExplore}
                className="px-6 h-11 rounded-full border-[1.5px] border-primary-container items-center justify-center active:bg-primary-container"
              >
                <Text className="text-primary-container font-body text-xs font-semibold">
                  Browse Profiles
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};
