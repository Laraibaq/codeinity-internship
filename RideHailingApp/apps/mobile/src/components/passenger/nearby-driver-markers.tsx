import React from "react";
import { View, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import type { NearbyDriver } from "@/lib/api/passenger/nearby-drivers";

// Anonymous markers for the coarse driver positions returned by GET /drivers/nearby. The API gives
// no ids (by design), so markers are keyed by position+index and carry no tap behavior.
export function NearbyDriverMarkers({ drivers }: { drivers: NearbyDriver[] }) {
  return (
    <>
      {drivers.map((d, i) => (
        <Marker
          key={`${d.lat}:${d.lng}:${i}`}
          coordinate={{ latitude: d.lat, longitude: d.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          tappable={false}
        >
          <View style={styles.dot}>
            <MaterialIcons
              name={d.vehicleType === "bike" ? "two-wheeler" : "directions-car"}
              size={16}
              color={themeColors.onPrimary}
            />
          </View>
        </Marker>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: themeColors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: themeColors.surfaceContainerLowest,
  },
});
