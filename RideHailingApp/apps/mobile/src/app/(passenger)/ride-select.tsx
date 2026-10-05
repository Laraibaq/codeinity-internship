import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";
import { fareApi, type FareQuote, type FareTier } from "@/lib/api/fare";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/utils/currency";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min(280, SCREEN_WIDTH - 60);
const CARD_GAP = 16;

// Presentation only. These are fare TIERS (pricing/comfort); which vehicle body type serves each
// is decided by the backend and returned on the quote -- see lib/api/fare.ts. No prices, ETAs or
// promo badges live here: those numbers must come from the server or not be shown.
const RIDE_TIERS: {
  id: FareTier;
  name: string;
  seats: number;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
}[] = [
  { id: "standard", name: "Standard", seats: 4, icon: "directions-car" },
  { id: "premium", name: "Premium", seats: 4, icon: "local-taxi" },
  { id: "xl", name: "XL", seats: 6, icon: "airport-shuttle" },
  { id: "bike", name: "Bike", seats: 1, icon: "two-wheeler" },
];

export default function PassengerRideSelectScreen() {
  const router = useRouter();
  const {
    pickup,
    destination,
    estimatedDistanceKm,
    selectedRideType,
    setSelectedRideType,
    fareQuotes,
    setFareQuotes,
  } = usePassengerRideStore();

  const [selectedId, setSelectedId] = useState<FareTier>(selectedRideType || "standard");
  const [loading, setLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const hasRoute =
    !!pickup && !!destination && !!estimatedDistanceKm && estimatedDistanceKm > 0;

  const loadQuotes = useCallback(async () => {
    if (!pickup || !destination || !estimatedDistanceKm || estimatedDistanceKm <= 0) return;
    setLoading(true);
    setQuoteError(null);
    try {
      const results = await Promise.all(
        RIDE_TIERS.map((t) =>
          fareApi.getQuote({
            pickupLat: pickup.latitude,
            pickupLng: pickup.longitude,
            dropoffLat: destination.latitude,
            dropoffLng: destination.longitude,
            distanceKm: Number(estimatedDistanceKm.toFixed(2)),
            fareTier: t.id,
          }),
        ),
      );
      const next: Partial<Record<FareTier, FareQuote>> = {};
      for (const q of results) next[q.fareTier] = q;
      setFareQuotes(next);
    } catch (err) {
      setFareQuotes({});
      setQuoteError(getApiErrorMessage(err, "Could not load fares. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [pickup, destination, estimatedDistanceKm, setFareQuotes]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const selectedQuote = fareQuotes[selectedId];

  const handleConfirm = () => {
    if (!selectedQuote) return;
    setSelectedRideType(selectedId);
    router.push("/(passenger)/fare-offer" as any);
  };

  const pickupDisplay = pickup?.name || pickup?.address || "Pickup Location";
  const destDisplay = destination?.name || destination?.address || "Destination";
  const selectedTier = RIDE_TIERS.find((t) => t.id === selectedId) ?? RIDE_TIERS[0];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Neutral backdrop (the route map is shown on the route-preview screen) */}
      <View style={styles.mapBg} />
      <View style={styles.pickupMarker} />
      <View style={styles.destMarker}>
        <MaterialIcons name="location-on" size={28} color={themeColors.onSurface} />
      </View>

      {/* Top header */}
      <View style={styles.header}>
        <Pressable
          style={styles.menuBtn}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.brand}>Ryde</Text>
        <View style={styles.menuBtn} />
      </View>

      {/* Bottom sheet */}
      <View style={styles.bottomSheet}>
        {/* Drag handle */}
        <View style={styles.dragHandle} />

        {/* Sheet header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Choose a ride</Text>

          {/* Route summary */}
          <View style={styles.routeSummary}>
            <View style={styles.routeTimelineSmall}>
              <View style={styles.rtDot} />
              <View style={styles.rtLine} />
              <View style={styles.rtSquare} />
            </View>
            <View style={styles.routeStops}>
              <Text style={styles.rtStop} numberOfLines={1}>{pickupDisplay}</Text>
              <View style={styles.rtStopSep} />
              <Text style={styles.rtStop} numberOfLines={1}>{destDisplay}</Text>
            </View>
          </View>
        </View>

        {!hasRoute ? (
          <View style={styles.statusBlock}>
            <Text style={styles.statusText}>
              No route yet. Go back and pick a pickup and destination to see fares.
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.statusBlock}>
            <ActivityIndicator color={themeColors.primary} />
            <Text style={styles.statusText}>Getting fares…</Text>
          </View>
        ) : quoteError ? (
          <View style={styles.statusBlock}>
            <Text style={styles.statusText}>{quoteError}</Text>
            <Pressable onPress={loadQuotes} accessibilityRole="button" style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          /* Horizontal ride cards */
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            decelerationRate="fast"
            contentContainerStyle={styles.cardsContainer}
            style={styles.cardsScroll}
          >
            {RIDE_TIERS.map((ride) => {
              const quote = fareQuotes[ride.id];
              if (!quote) return null;
              const isSelected = ride.id === selectedId;
              return (
                <Pressable
                  key={ride.id}
                  onPress={() => {
                    setSelectedId(ride.id);
                    setSelectedRideType(ride.id);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.rideCard,
                    { width: CARD_WIDTH },
                    isSelected && styles.rideCardSelected,
                    !isSelected && styles.rideCardUnselected,
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.tierIcon}>
                      <MaterialIcons name={ride.icon} size={36} color={themeColors.primary} />
                    </View>
                    <View style={styles.priceBlock}>
                      <Text style={styles.priceText}>{formatCurrency(quote.recommendedFare)}</Text>
                      <Text style={styles.rideEta}>Suggested fare</Text>
                    </View>
                  </View>

                  <View style={styles.cardBottomRow}>
                    <Text style={styles.rideName}>{ride.name}</Text>
                    <View style={styles.seatChip}>
                      <MaterialIcons name="person" size={14} color={themeColors.onSurfaceVariant} />
                      <Text style={styles.seatCount}>{ride.seats}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Payment + CTA */}
        <View style={styles.actionArea}>
          {/* Payment indicator (MVP1 policy: cash only, PKR). The method is still sent with the
              ride request -- see ride-confirm.tsx. */}
          <View style={styles.paymentRow}>
            <View style={styles.paymentCardIcon}>
              <MaterialIcons
                name="payments"
                size={18}
                color={themeColors.primary}
              />
            </View>
            <View style={styles.paymentTextBlock}>
              <Text style={styles.paymentName}>Cash Payment (PKR)</Text>
              <Text style={styles.paymentSwitch}>Pay driver directly</Text>
            </View>
            <MaterialIcons name="check-circle" size={20} color="#059669" />
          </View>

          {/* Confirm button */}
          <Pressable
            onPress={handleConfirm}
            disabled={!selectedQuote}
            style={({ pressed }) => [
              styles.btnConfirm,
              !selectedQuote && styles.btnDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.btnConfirmText}>Confirm {selectedTier.name}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#e5e5e5",
    overflow: "hidden",
  },
  mapBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: themeColors.surfaceContainer,
  },
  // ── Map markers ──
  pickupMarker: {
    position: "absolute",
    top: "35%",
    left: "48%",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: themeColors.primary,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 5,
  },
  destMarker: {
    position: "absolute",
    top: "62%",
    right: "25%",
    zIndex: 5,
  },
  // ── Header ──
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 8,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: 28,
    fontWeight: "700",
    color: themeColors.primary,
    letterSpacing: -0.28,
    lineHeight: 36,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: themeColors.surfaceContainerHighest,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarImg: {
    width: 40,
    height: 40,
  },
  // ── Bottom Sheet ──
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: themeColors.outlineVariant,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.surfaceContainerHigh,
    gap: 8,
  },
  sheetTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "600",
    color: themeColors.onSurface,
    letterSpacing: -0.28,
  },
  routeSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: themeColors.surfaceContainerLow,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: themeColors.surfaceContainerHigh,
    gap: 16,
  },
  routeTimelineSmall: {
    alignItems: "center",
    gap: 2,
    paddingVertical: 2,
  },
  rtDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.primary,
  },
  rtLine: {
    width: 1,
    height: 16,
    backgroundColor: themeColors.outlineVariant,
  },
  rtSquare: {
    width: 8,
    height: 8,
    borderRadius: 1,
    backgroundColor: themeColors.onSurface,
  },
  routeStops: {
    flex: 1,
    gap: 2,
  },
  rtStop: {
    fontSize: 16,
    fontWeight: "500",
    color: themeColors.onSurface,
    lineHeight: 24,
  },
  rtStopSep: {
    height: 1,
    backgroundColor: themeColors.surfaceContainerHigh,
    marginVertical: 8,
  },
  // ── Cards ──
  cardsScroll: {
    marginVertical: 12,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: CARD_GAP,
  },
  rideCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    position: "relative",
    overflow: "hidden",
  },
  rideCardSelected: {
    backgroundColor: "rgba(79,70,229,0.06)",
    borderWidth: 2,
    borderColor: themeColors.primary,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  rideCardUnselected: {
    backgroundColor: themeColors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: themeColors.surfaceContainerHighest,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 1,
    opacity: 0.85,
  },
  cardBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: themeColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 14,
    zIndex: 2,
  },
  cardBadgeText: {
    color: themeColors.onPrimary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tierIcon: {
    width: 96,
    height: 64,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  statusBlock: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: "center",
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    color: themeColors.onSurfaceVariant,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: themeColors.primary,
  },
  retryText: {
    color: themeColors.primary,
    fontWeight: "600",
  },
  btnDisabled: {
    opacity: 0.4,
  },
  priceBlock: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    letterSpacing: 0.48,
    color: themeColors.onSurface,
  },
  strikePrice: {
    fontSize: 14,
    color: themeColors.onSurfaceVariant,
    textDecorationLine: "line-through",
    lineHeight: 20,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rideName: {
    fontSize: 18,
    fontWeight: "600",
    color: themeColors.onSurface,
    lineHeight: 28,
  },
  rideEta: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.onSurfaceVariant,
    lineHeight: 16,
  },
  seatChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: themeColors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  seatCount: {
    fontSize: 12,
    fontWeight: "600",
    color: themeColors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  // ── Action Area ──
  actionArea: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: themeColors.surfaceContainerHighest,
    gap: 12,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  paymentCardIcon: {
    width: 40,
    height: 24,
    backgroundColor: themeColors.surfaceContainerHighest,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: themeColors.outlineVariant,
    overflow: "hidden",
  },
  paymentCardGradient: {
    width: 24,
    height: 12,
    borderRadius: 2,
    backgroundColor: themeColors.primary,
    opacity: 0.8,
  },
  paymentTextBlock: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: "500",
    color: themeColors.onSurface,
    lineHeight: 24,
  },
  paymentSwitch: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.primary,
    lineHeight: 16,
  },
  btnConfirm: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(53,37,205,1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  btnConfirmText: {
    color: themeColors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
