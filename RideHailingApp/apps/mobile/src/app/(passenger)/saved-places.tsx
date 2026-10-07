import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { isAxiosError } from "axios";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { PassengerHeader } from "@/components/passenger/passenger-header";
import { passengerLocationsApi, type SavedPlace } from "@/lib/api/passenger/locations";

type LoadState = "loading" | "ready" | "unavailable" | "error";

export default function PassengerSavedPlacesScreen() {
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      setPlaces(await passengerLocationsApi.getSavedPlaces());
      setState("ready");
    } catch (err) {
      // The backend has no saved-places endpoint yet; a 404 means "not built", not "broken".
      setState(isAxiosError(err) && err.response?.status === 404 ? "unavailable" : "error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getIconForType = (type: SavedPlace["type"]) => {
    switch (type) {
      case "home":
        return "home";
      case "work":
        return "work";
      default:
        return "favorite";
    }
  };

  return (
    <View className="flex-1 bg-background">
      <PassengerHeader
        title="Saved Places"
        rightAction={
          <Pressable className="w-10 h-10 rounded-xl bg-primary-fixed items-center justify-center active:scale-95">
            <MaterialIcons name="add" size={22} color={themeColors.primary} />
          </Pressable>
        }
      />

      {state === "loading" ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : state === "unavailable" ? (
        <StatusMessage
          icon="hourglass-empty"
          title="Not available yet"
          body="Saved places aren't available yet. Check back in a future update."
        />
      ) : state === "error" ? (
        <StatusMessage
          icon="error-outline"
          title="Couldn't load saved places"
          body="Check your connection and try again."
          onRetry={load}
        />
      ) : (
      <FlatList
        data={places}
        ListEmptyComponent={
          <StatusMessage
            icon="favorite-border"
            title="No saved places yet"
            body="Places you save will show up here."
          />
        }
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View className="flex-row items-center p-4 mb-3 rounded-2xl bg-surface border border-outline-variant/20 shadow-sm">
            <View className="w-12 h-12 rounded-xl bg-surface-container items-center justify-center mr-3">
              <MaterialIcons
                name={getIconForType(item.type)}
                size={22}
                color={themeColors.primary}
              />
            </View>
            <View className="flex-1">
              <Text className="text-on-surface text-base font-bold">{item.name}</Text>
              <Text className="text-secondary text-xs mt-0.5" numberOfLines={1}>
                {item.address}
              </Text>
            </View>
            <Pressable className="p-2 active:scale-90">
              <MaterialIcons name="more-vert" size={20} color={themeColors.secondary} />
            </Pressable>
          </View>
        )}
      />
      )}
    </View>
  );
}

function StatusMessage({
  icon,
  title,
  body,
  onRetry,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  title: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <MaterialIcons name={icon} size={40} color={themeColors.secondary} />
      <Text className="text-on-surface text-base font-bold mt-3">{title}</Text>
      <Text className="text-secondary text-xs mt-1 text-center">{body}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          className="mt-4 px-5 py-2 rounded-xl bg-primary-fixed active:scale-95"
        >
          <Text className="text-primary text-sm font-bold">Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
