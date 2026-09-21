import React from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { PassengerHeader } from "@/components/passenger/passenger-header";
import type { SavedPlace } from "@/lib/api/passenger/locations";

const MOCK_SAVED_PLACES: SavedPlace[] = [
  {
    id: "sp-1",
    name: "Home",
    address: "2480 Mission St, Apt 4B, San Francisco, CA",
    latitude: 37.7599,
    longitude: -122.419,
    type: "home",
  },
  {
    id: "sp-2",
    name: "Work Office",
    address: "500 Howard St, Suite 300, San Francisco, CA",
    latitude: 37.7885,
    longitude: -122.3972,
    type: "work",
  },
  {
    id: "sp-3",
    name: "Gym",
    address: "1000 Van Ness Ave, San Francisco, CA",
    latitude: 37.785,
    longitude: -122.421,
    type: "favorite",
  },
];

export default function PassengerSavedPlacesScreen() {
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

      <FlatList
        data={MOCK_SAVED_PLACES}
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
    </View>
  );
}
