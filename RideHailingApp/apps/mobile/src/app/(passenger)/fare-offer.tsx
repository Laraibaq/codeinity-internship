import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

const MAP_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBtjPmAgEADa4svU5-KkcW8mPUNuvFBscTmpdVvhWq2_zhkpX4-377F6WofwMSIgr_m9LCIsf3AkjZVgtSIC9SSZKtLh2hEniyywMDfp0MNEqrRT9VgVj0gi7usmV6wv_iiBz7Qe-fa-6j89cAvrX6ALT7kVes2whfB9x6gtNC74WswK3Vr85j5eaEHqo4Dw1LfG80INhquLoJAZupHng3VSiLJmse83vLn80uAIlUymuUPvKJ7O5oh";

const AVATAR_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCtkgf29G9WfIrjdG3Eia2IMb8MQcvthv1qBCZ6rS6CwYqeKDMEYbROXLnw4UWepRju3rln6sovn7TKc3AckBtsDfsLoh84CX0nsNCrHimqfZTLNcUQ_WZmsOUkJkwiJYX9qhi5uoBcTIc4U8MU0P0qi0NhvDNotjk_ad28jSLn4-iTBj6rTBeAHKNYTVnSCgfOGSPnR8oyKkL6qP_yPGcuJx6e30heLu20WeUHQ487djuLaOakmI-1";

import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";

// Half-dollars ($0.50) step
const MIN_FARE = 100;    // $1.00 minimum
const MAX_FARE = 50000;  // $500.00 maximum
const STEP = 50;         // $0.50

const formatFare = (cents: number) => ({
  integer: Math.floor(cents / 100).toString(),
  decimal: (cents % 100).toString().padStart(2, "0"),
});

export default function PassengerFareOfferScreen() {
  const router = useRouter();
  const {
    pickup,
    destination,
    estimatedDistanceKm,
    selectedRideType,
    proposedFare,
    setProposedFare,
  } = usePassengerRideStore();

  const distance = estimatedDistanceKm && estimatedDistanceKm > 0 ? estimatedDistanceKm : 6.5;

  // Compute baseline cents
  const baselineCents = React.useMemo(() => {
    if (proposedFare && proposedFare > 0) {
      return Math.round(proposedFare * 100);
    }
    let base = 5 + distance * 2.5;
    if (selectedRideType === "bike") base = 3 + distance * 1.4;
    else if (selectedRideType === "premium") base = 8 + distance * 3.8;
    else if (selectedRideType === "xl") base = 10 + distance * 4.5;
    return Math.round(base * 100);
  }, [proposedFare, distance, selectedRideType]);

  const [fareCents, setFareCents] = useState(baselineCents);

  const suggestedLow = ((baselineCents * 0.85) / 100).toFixed(2);
  const suggestedHigh = ((baselineCents * 1.15) / 100).toFixed(2);

  const handleDecrease = () => setFareCents((c) => Math.max(MIN_FARE, c - STEP));
  const handleIncrease = () => setFareCents((c) => Math.min(MAX_FARE, c + STEP));
  const handleRequest = () => {
    const finalFare = Math.round(fareCents) / 100;
    setProposedFare(finalFare);
    router.push("/(passenger)/ride-confirm" as any);
  };

  const { integer, decimal } = formatFare(fareCents);

  const pickupDisplay = pickup?.name || pickup?.address || "Pickup Location";
  const destDisplay = destination?.name || destination?.address || "Destination";

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map */}
      <Image source={{ uri: MAP_URI }} style={styles.mapBg} resizeMode="cover" />

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
        <Pressable style={styles.avatarBtn}>
          <Image source={{ uri: AVATAR_URI }} style={styles.avatarImg} resizeMode="cover" />
        </Pressable>
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
            <Text style={styles.fareContextSub}>Suggested range: ${suggestedLow} – ${suggestedHigh}</Text>
          </View>

          {/* Fare stepper */}
          <View style={styles.fareRow}>
            <Pressable
              onPress={handleDecrease}
              style={({ pressed }) => [
                styles.fareBtn,
                pressed && styles.fareBtnPressed,
                fareCents <= MIN_FARE && styles.fareBtnDisabled,
              ]}
              disabled={fareCents <= MIN_FARE}
              accessibilityLabel="Decrease fare"
            >
              <MaterialIcons name="remove" size={24} color={themeColors.onSurface} />
            </Pressable>

            {/* Fare display */}
            <View style={styles.fareDisplay}>
              <Text style={styles.fareCurrency}>$</Text>
              <Text style={styles.fareInteger}>{integer}</Text>
              <Text style={styles.fareDecimal}>.{decimal}</Text>
            </View>

            <Pressable
              onPress={handleIncrease}
              style={({ pressed }) => [
                styles.fareBtn,
                pressed && styles.fareBtnPressed,
                fareCents >= MAX_FARE && styles.fareBtnDisabled,
              ]}
              disabled={fareCents >= MAX_FARE}
              accessibilityLabel="Increase fare"
            >
              <MaterialIcons name="add" size={24} color={themeColors.onSurface} />
            </Pressable>
          </View>

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
    fontSize: 52,
    fontWeight: "700",
    color: themeColors.primary,
    lineHeight: 52,
    letterSpacing: -1.04,
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
