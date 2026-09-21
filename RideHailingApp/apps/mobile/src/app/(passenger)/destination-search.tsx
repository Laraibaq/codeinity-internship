import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import {
  searchPlaces,
  type GeocodedPlace,
} from "@/lib/location/location-service";
import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";

const MAP_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAQ-jCefL67HW4mlBdPwpp1TwSoR8F2ZzgKb05KvTDnKqXTgYtQ-OTp8TeOMQ5nhURI63YmJiOyDgPmqqYEdlmuorzAhwqS2Sa4vnHsV7ynG4pQruML-I8UbmRaDcSMXWmzz_cAjYgcGabm0v3Y4h0FBFVdYwbOhPkZGCLeWdLpjB4d9FK-_vz9DxLvRz23WtfOCh9tVT0JuhXyXY9xBpxCAncRHk52otKlwp0E-wUnYBsUu9R9KlV-";

const SAVED_PLACES = [
  { key: "home", label: "Home", icon: "home" as const, address: "123 Main St", query: "123 Main St" },
  { key: "work", label: "Work", icon: "work" as const, address: "Tech Hub, Downtown", query: "Downtown" },
];

export default function PassengerDestinationSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodedPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const currentLocation = usePassengerRideStore((s) => s.currentLocation);
  const pickup = usePassengerRideStore((s) => s.pickup);
  const setPickup = usePassengerRideStore((s) => s.setPickup);
  const setDestination = usePassengerRideStore((s) => s.setDestination);

  const searchDebounceTimer = useRef<any>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    searchDebounceTimer.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const proximity = pickup || currentLocation || undefined;
        const places = await searchPlaces(trimmed, proximity ? { latitude: proximity.latitude, longitude: proximity.longitude } : undefined);
        setResults(places);
      } catch {
        setSearchError("Search failed — check your network connection");
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, [query, pickup, currentLocation]);

  const handleSelectPlace = (place: { latitude: number; longitude: number; name: string; address?: string }) => {
    // Ensure pickup is initialized
    if (!pickup && currentLocation) {
      setPickup(currentLocation);
    }
    setDestination({
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      address: place.address || place.name,
    });
    router.push("/(passenger)/route-preview" as any);
  };

  const handleMapPicker = () => {
    router.push("/(passenger)/destination-map-picker" as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map background */}
      <Image source={{ uri: MAP_URI }} style={styles.mapBg} resizeMode="cover" />
      {/* Glassmorphism overlay */}
      <View style={styles.glassOverlay} />

      {/* Glass content panel */}
      <View style={styles.panel}>
        {/* Search Header */}
        <View style={styles.searchHeader}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurface} />
          </Pressable>

          <View style={styles.inputWrapper}>
            {/* Origin + Destination connector visual */}
            <View style={styles.connectorStack}>
              <View style={styles.connectorOriginDot} />
              <View style={styles.connectorLine} />
              <View style={styles.connectorDestSquare} />
            </View>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Where to?"
              placeholderTextColor={themeColors.outline}
              style={styles.searchInput}
              autoFocus
            />

            {isSearching && (
              <ActivityIndicator size="small" color={themeColors.primary} style={{ marginRight: 8 }} />
            )}

            {query.length > 0 && !isSearching && (
              <Pressable
                onPress={() => setQuery("")}
                style={styles.clearBtn}
              >
                <MaterialIcons name="close" size={18} color={themeColors.onSurfaceVariant} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Live Search Results */}
          {query.trim().length >= 2 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {isSearching ? "Searching..." : results.length > 0 ? "Search Results" : "No Results"}
              </Text>

              {searchError && (
                <View style={styles.errorBox}>
                  <MaterialIcons name="error-outline" size={20} color={themeColors.error} />
                  <Text style={styles.errorText}>{searchError}</Text>
                </View>
              )}

              {results.length === 0 && !isSearching && !searchError && (
                <View style={styles.emptyBox}>
                  <MaterialIcons name="location-off" size={32} color={themeColors.outline} />
                  <Text style={styles.emptyText}>No places found for "{query}"</Text>
                  <Text style={styles.emptySub}>Try searching a street, airport, or landmark.</Text>
                </View>
              )}

              {results.length > 0 && (
                <View style={styles.resultsCard}>
                  {results.map((item, index) => (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [
                        styles.resultRow,
                        index < results.length - 1 && styles.resultRowBorder,
                        pressed && styles.resultRowPressed,
                      ]}
                      onPress={() => handleSelectPlace(item)}
                    >
                      <View style={styles.resultIconCircle}>
                        <MaterialIcons name="place" size={22} color={themeColors.primary} />
                      </View>
                      <View style={styles.resultTextBlock}>
                        <Text style={styles.resultName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.resultSub} numberOfLines={1}>
                          {item.address}
                        </Text>
                      </View>
                      {item.distanceKm != null && (
                        <Text style={styles.resultDistance}>
                          {item.distanceKm} km
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <>
              {/* Saved Places */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Saved Places</Text>
                <View style={styles.savedGrid}>
                  {SAVED_PLACES.map((place) => (
                    <Pressable
                      key={place.key}
                      style={({ pressed }) => [styles.savedCard, pressed && styles.savedCardPressed]}
                      onPress={() => setQuery(place.query)}
                    >
                      <View style={styles.savedIconBox}>
                        <MaterialIcons name={place.icon} size={22} color={themeColors.primary} />
                      </View>
                      <Text style={styles.savedLabel}>{place.label}</Text>
                      <Text style={styles.savedAddress} numberOfLines={1}>
                        {place.address}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Set on map */}
          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [styles.mapPickerBtn, pressed && styles.pressed]}
              onPress={handleMapPicker}
            >
              <MaterialIcons name="map" size={22} color={themeColors.primary} />
              <Text style={styles.mapPickerText}>Set location on map</Text>
            </Pressable>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: themeColors.surfaceContainerLow,
    overflow: "hidden",
  },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(249,249,255,0.12)",
  },
  panel: {
    flex: 1,
    backgroundColor: "rgba(249,249,255,0.88)",
    maxWidth: 448,
    width: "100%",
    alignSelf: "center",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  // ── Search Header ──
  searchHeader: {
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.5)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.surfaceContainerHigh,
    borderRadius: 12,
    height: 56,
    paddingRight: 12,
    overflow: "hidden",
  },
  connectorStack: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 2,
  },
  connectorOriginDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.primary,
  },
  connectorLine: {
    width: 1,
    height: 10,
    backgroundColor: themeColors.outlineVariant,
    opacity: 0.5,
  },
  connectorDestSquare: {
    width: 7,
    height: 7,
    borderRadius: 1,
    backgroundColor: themeColors.onSurface,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: themeColors.onSurface,
    lineHeight: 24,
    height: "100%",
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: themeColors.surfaceVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Scroll ──
  scrollArea: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.onSurfaceVariant,
    lineHeight: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  // ── Saved Places ──
  savedGrid: {
    flexDirection: "row",
    gap: 12,
  },
  savedCard: {
    flex: 1,
    backgroundColor: themeColors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.3)",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 1,
  },
  savedCardPressed: {
    borderColor: "rgba(53,37,205,0.4)",
    backgroundColor: themeColors.surfaceContainerLow,
    shadowColor: themeColors.primary,
    shadowOpacity: 0.08,
    elevation: 2,
  },
  savedIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(53,37,205,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  savedLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.onSurface,
    lineHeight: 24,
    marginBottom: 4,
  },
  savedAddress: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.onSurfaceVariant,
    lineHeight: 16,
    opacity: 0.8,
  },
  // ── Results Card ──
  resultsCard: {
    backgroundColor: themeColors.surfaceContainerLowest,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.3)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 24,
    elevation: 1,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  resultRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: themeColors.surfaceVariant,
  },
  resultRowPressed: {
    backgroundColor: themeColors.surfaceContainerHigh,
  },
  resultIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resultTextBlock: {
    flex: 1,
    overflow: "hidden",
  },
  resultName: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.onSurface,
    lineHeight: 24,
  },
  resultSub: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.onSurfaceVariant,
    lineHeight: 16,
  },
  resultDistance: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.onSurfaceVariant,
    flexShrink: 0,
  },
  resultDistancePrimary: {
    color: themeColors.primary,
  },
  // ── Map Picker btn ──
  mapPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: themeColors.surfaceVariant,
    borderWidth: 1,
    borderColor: themeColors.outlineVariant,
  },
  mapPickerText: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.onSurface,
    lineHeight: 24,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "rgba(186, 26, 26, 0.08)",
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: themeColors.error,
    flex: 1,
  },
  emptyBox: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeColors.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.3)",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.onSurface,
    marginTop: 8,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: themeColors.onSurfaceVariant,
    marginTop: 4,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.88,
  },
});
