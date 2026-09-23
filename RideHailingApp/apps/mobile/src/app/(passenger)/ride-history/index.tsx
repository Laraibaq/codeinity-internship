import React from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { PassengerHeader } from "@/components/passenger/passenger-header";
import { usePassengerRides } from "@/hooks/passenger/use-passenger-rides";

export default function PassengerRideHistoryScreen() {
  const router = useRouter();
  const { history, isLoadingHistory } = usePassengerRides();

  return (
    <View className="flex-1 bg-background">
      <PassengerHeader title="Ride History" />

      {isLoadingHistory ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text className="mt-3 text-sm text-secondary">Loading your ride history...</Text>
        </View>
      ) : !history || history.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-16 h-16 rounded-full bg-surface-container items-center justify-center mb-3">
            <MaterialIcons name="history" size={32} color={themeColors.secondary} />
          </View>
          <Text className="text-base font-bold text-on-surface">No Trips Yet</Text>
          <Text className="text-secondary text-sm text-center mt-1">
            Your completed and cancelled rides will appear here once you take a ride.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(passenger)/ride-history/${item.id}`)}
              className="p-4 mb-3 rounded-2xl bg-surface border border-outline-variant/20 shadow-sm active:scale-98"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-secondary text-xs">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recent"}
                </Text>
                <View className="flex-row items-center gap-2">
                  <View
                    className={`px-2 py-0.5 rounded-full ${
                      item.status === "completed"
                        ? "bg-emerald-500/10"
                        : "bg-amber-500/10"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-semibold uppercase ${
                        item.status === "completed"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {item.status}
                    </Text>
                  </View>
                  <Text className="text-on-surface text-base font-bold">
                    ${(item.fare ?? 0).toFixed(2)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-1">
                <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
                <Text className="text-on-surface text-sm font-medium flex-1" numberOfLines={1}>
                  {item.pickupAddress}
                </Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2" />
                <Text className="text-on-surface text-sm font-medium flex-1" numberOfLines={1}>
                  {item.destinationAddress || item.dropoffAddress}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
