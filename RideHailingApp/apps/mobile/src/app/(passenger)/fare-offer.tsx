import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";
import { formatCurrency } from "@/utils/currency";

// All fare numbers (recommended, minimum, maximum, step) come from the server quote fetched on the
// ride-select screen. This screen has no fare formula or constants of its own.
export default function PassengerFareOfferScreen() {
  const router = useRouter();
  const {
    pickup,
    destination,
    selectedRideType,
    proposedFare,
    setProposedFare,
    fareQuotes,
  } = usePassengerRideStore();

  const quote = fareQuotes[selectedRideType];

  // Start from a previously chosen fare if it is still inside the quote's range, else the
  // server-recommended fare.
  const [fare, setFare] = useState<number | null>(() => {
    if (!quote) return null;
    if (proposedFare && proposedFare >= quote.minimumFare && proposedFare <= quote.maximumFare) {
      return proposedFare;
    }
    return quote.recommendedFare;
  });

  const pickupDisplay = pickup?.name || pickup?.address || "Pickup Location";
  const destDisplay = destination?.name || destination?.address || "Destination";

  if (!quote || fare === null) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.mapBg} />
        <View style={styles.topNav}>
          <Pressable
            style={styles.menuBtn}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
          </Pressable>
          <Text style={styles.brand}>Ryde</Text>
          <View style={styles.menuBtn} />
        </View>
        <View style={styles.card}>
          <View style={styles.cardBody}>
            <Text style={styles.fareContextTitle}>Fare not available</Text>
            <Text style={styles.fareContextSub}>
              We could not load the fare for this trip. Go back and choose your ride again.
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.btnRequest, pressed && styles.pressed]}
            >
              <Text style={styles.btnRequestText}>Go back</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const atMin = fare <= quote.minimumFare;
  const atMax = fare >= quote.maximumFare;

  const handleDecrease = () => setFare((f) => Math.max(quote.minimumFare, (f ?? 0) - quote.fareStep));
  const handleIncrease = () => setFare((f) => Math.min(quote.maximumFare, (f ?? 0) + quote.fareStep));
  const handleRequest = () => {
    setProposedFare(fare);
    router.push("/(passenger)/ride-confirm" as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Neutral backdrop (the route map is shown on the route-preview screen) */}
      <View style={styles.mapBg} />

      {/* Map markers */}
      <View style={styles.pickupMarker} />
      <View style={styles.destMarker}>
        <MaterialIcons name="location-on" size={28} color={themeColors.onSurface} />
        <View style={styles.destShadow} />
      </View>

      {/* Top nav */}
      <View style={styles.topNav}>
        <Pressable
          style={styles.menuBtn}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
        </Pressable>
        <Text style={styles.brand}>Ryde</Text>
        <View style={styles.menuBtn} />
      </View>

      {/* Bottom Card */}
      <View style={styles.card}>
        {/* Drag handle */}
        <View style={styles.dragHandleRow}>
          <View style={styles.dragHandle} />
        </View>

        <View style={styles.cardBody}>
          {/* Route summary */}
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={styles.routePickupDot} />
              <Text style={styles.routeText} numberOfLines={1}>{pickupDisplay}</Text>
            </View>
            <View style={styles.routeConnector} />
            <View style={styles.routeRow}>
              <MaterialIcons name="stop" size={12} color={themeColors.onSurfaceVariant} />
              <Text style={styles.routeText} numberOfLines={1}>{destDisplay}</Text>
            </View>
          </View>

          {/* Fare context */}
          <View style={styles.fareContext}>
            <Text style={styles.fareContextTitle}>Offer your fare</Text>
            <Text style={styles.fareContextSub}>
              Suggested {formatCurrency(quote.recommendedFare)} · allowed{" "}
              {formatCurrency(quote.minimumFare)} – {formatCurrency(quote.maximumFare)}
            </Text>
          </View>

          {/* Fare stepper */}
          <View style={styles.fareRow}>
            <Pressable
              onPress={handleDecrease}
              style={({ pressed }) => [
                styles.fareBtn,
                pressed && styles.fareBtnPressed,
                atMin && styles.fareBtnDisabled,
              ]}
              disabled={atMin}
              accessibilityLabel="Decrease fare"
              accessibilityState={{ disabled: atMin }}
            >
              <MaterialIcons name="remove" size={24} color={themeColors.onSurface} />
            </Pressable>

            {/* Fare display */}
            <View style={styles.fareDisplay}>
              <Text style={styles.fareInteger} accessibilityLabel={`Offered fare ${formatCurrency(fare)}`}>
                {formatCurrency(fare)}
              </Text>
            </View>

            <Pressable
              onPress={handleIncrease}
              style={({ pressed }) => [
                styles.fareBtn,
                pressed && styles.fareBtnPressed,
                atMax && styles.fareBtnDisabled,
              ]}
              disabled={atMax}
              accessibilityLabel="Increase fare"
              accessibilityState={{ disabled: atMax }}
            >
              <MaterialIcons name="add" size={24} color={themeColors.onSurface} />
            </Pressable>
          </View>

          {atMin && (
            <Text style={styles.limitNote}>
              {formatCurrency(quote.minimumFare)} is the lowest fare drivers can be offered for this trip.
            </Text>
          )}
          {atMax && (
            <Text style={styles.limitNote}>
              {formatCurrency(quote.maximumFare)} is the highest fare allowed for this trip.
            </Text>
          )}

          {/* CTA */}
          <Pressable
            onPress={handleRequest}
            style={({ pressed }) => [styles.btnRequest, pressed && styles.pressed]}
          >
            <Text style={styles.btnRequestText}>Request Ryde</Text>
            <MaterialIcons name="arrow-forward" size={20} color={themeColors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: themeColors.surfaceVariant,
    overflow: "hidden",
  },
  mapBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: themeColors.surfaceContainer,
  },
  limitNote: {
    fontSize: 13,
    lineHeight: 18,
    color: themeColors.onSurfaceVariant,
    textAlign: "center",
  },
  // ── Map markers ──
  pickupMarker: {
    position: "absolute",
    top: "38%",
    left: "42%",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: themeColors.primary,
    borderWidth: 2,
    borderColor: themeColors.surfaceContainerLowest,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  destMarker: {
    position: "absolute",
    top: "52%",
    left: "60%",
    zIndex: 5,
    alignItems: "center",
  },
  destShadow: {
    width: 8,
    height: 3,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  // ── Top Nav ──
  topNav: {
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
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
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
    borderWidth: 1,
    borderColor: themeColors.surfaceContainerLowest,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarImg: {
    width: 40,
    height: 40,
  },
  // ── Bottom Card ──
  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    maxWidth: 420,
    alignSelf: "center",
    width: "100%",
    backgroundColor: themeColors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(199,196,216,0.3)",
  },
  dragHandleRow: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(199,196,216,0.6)",
  },
  cardBody: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 8,
    gap: 20,
  },
  // ── Route Summary ──
  routeCard: {
    backgroundColor: "rgba(231,238,254,0.5)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: themeColors.surfaceContainerHigh,
    gap: 0,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  routePickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: themeColors.primary,
    shadowColor: "rgba(53,37,205,0.4)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
    flexShrink: 0,
  },
  routeConnector: {
    width: 1,
    height: 16,
    backgroundColor: themeColors.outlineVariant,
    marginLeft: 4,
    marginVertical: 2,
    opacity: 0.5,
  },
  routeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: themeColors.onSurface,
    lineHeight: 24,
  },
  // ── Fare Context ──
  fareContext: {
    alignItems: "center",
    gap: 4,
  },
  fareContextTitle: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
  },
  fareContextSub: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.secondary,
    lineHeight: 16,
  },
  // ── Fare Stepper ──
  fareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  fareBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: themeColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: themeColors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  fareBtnPressed: {
    backgroundColor: themeColors.surfaceContainer,
    transform: [{ scale: 0.95 }],
  },
  fareBtnDisabled: {
    opacity: 0.38,
  },
  fareDisplay: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    paddingHorizontal: 16,
  },
  fareCurrency: {
    fontSize: 24,
    fontWeight: "700",
    color: themeColors.primary,
    lineHeight: 32,
    opacity: 0.8,
    marginBottom: 4,
  },
  fareInteger: {
    fontSize: 34,
    fontWeight: "700",
    color: themeColors.primary,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  fareDecimal: {
    fontSize: 24,
    fontWeight: "700",
    color: themeColors.primary,
    lineHeight: 32,
    marginBottom: 4,
    opacity: 0.8,
  },
  // ── CTA ──
  btnRequest: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "rgba(53,37,205,1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  btnRequestText: {
    color: themeColors.onPrimary,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
