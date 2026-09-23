import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";
import { passengerRidesApi } from "@/lib/api/passenger/rides";
import { getApiErrorMessage } from "@/lib/api-client";

const MAP_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCEACPBGCHIKOhhqW1fmYqLqUkXMDY3tWM0gaE3k9METXUf2_qAnZROH3W_UuXCphVU7jj4S3s_Dp0jIw-XGoD7Z3Cc-PvjRNkNfc6DyIR9WPInvT7imfV-ky1xOtzvoScZTQ5sVbYNNglRJNfnPCcubg1k2UNwStlYEm17n_4DEbXUzEX8s_TyhQFiKO1tmmWvVI1ZjM9e6e6XeriQeNHKSAo61aBBQZS2NjlSUnMne4P5faibxwiJ";

const CAR_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCP7I0xH4OJSPi0daWgx-7xUthVQCfKfonKVoSjGbv1loht5LADudEy6wwj_McDUZHrGcDDnPsnfguVuMTeFXiMyZdsoJcWoG6YQrjeV2hi7Fp0YY5t-gDw9mXDKGS44g1HoeKl1cMl7w5UCdTM3nICDIa18xePevA5RqIBi1ifgirsz0BbiXwZT26EAsAik_HQPZNwj13jPfjyxmLyQYguvomBp1y1vhZgtTcVId2MuY_BnJOwalp5";

export default function PassengerRideConfirmScreen() {
  const router = useRouter();
  const {
    pickup,
    destination,
    estimatedDistanceKm,
    estimatedDurationMinutes,
    selectedRideType,
    proposedFare,
    isCreatingRide,
    createRideError,
    paymentMethod,
    setCreatedRideId,
    setIsCreatingRide,
    setCreateRideError,
    setRideStatus,
    setPaymentMethod,
  } = usePassengerRideStore();

  const [localError, setLocalError] = useState<string | null>(null);

  const pickupName = pickup?.name || pickup?.address || "Current Location";
  const destName = destination?.name || destination?.address || "Destination";
  const fare = proposedFare && proposedFare > 0 ? proposedFare : 25.0;
  const eta = estimatedDurationMinutes && estimatedDurationMinutes > 0 ? Math.round(estimatedDurationMinutes) : 12;
  const distance = estimatedDistanceKm && estimatedDistanceKm > 0 ? estimatedDistanceKm : 5.0;

  const vehicleName =
    selectedRideType === "bike"
      ? "Ryde Moto"
      : selectedRideType === "premium"
      ? "Ryde Black"
      : selectedRideType === "xl"
      ? "Ryde XL"
      : "Ryde X";

  const seats = selectedRideType === "bike" ? "1" : selectedRideType === "xl" ? "6" : "4";

  const handleConfirm = async () => {
    if (isCreatingRide) return;
    setLocalError(null);
    setCreateRideError(null);

    if (!pickup || !pickup.latitude || !pickup.longitude) {
      setLocalError("Please select a valid pickup location.");
      return;
    }

    if (!destination || !destination.latitude || !destination.longitude) {
      setLocalError("Please select a valid destination.");
      return;
    }

    if (!proposedFare || proposedFare <= 0) {
      setLocalError("Please enter a valid positive proposed fare.");
      return;
    }

    setIsCreatingRide(true);

    try {
      const response = await passengerRidesApi.createRideRequest({
        pickupLat: pickup.latitude,
        pickupLng: pickup.longitude,
        pickupAddress: pickup.name || pickup.address || "Pickup Location",
        dropoffLat: destination.latitude,
        dropoffLng: destination.longitude,
        dropoffAddress: destination.name || destination.address || "Destination",
        distanceKm: Number(distance.toFixed(2)),
        etaMinutes: Math.max(1, eta),
        proposedFare: Number(fare.toFixed(2)),
      });

      if (response && response.id) {
        setCreatedRideId(response.id);
        setRideStatus("waiting_for_drivers");
        router.push("/(passenger)/driver-offers" as any);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Failed to request ride. Please check your connection and try again.");
      setLocalError(message);
      setCreateRideError(message);
    } finally {
      setIsCreatingRide(false);
    }
  };

  const activeError = localError || createRideError;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map */}
      <Image source={{ uri: MAP_URI }} style={styles.mapBg} resizeMode="cover" />

      {/* Route markers */}
      <View style={styles.destinationMarker}>
        <View style={styles.destEtaChip}>
          <Text style={styles.destEtaText}>{eta} min</Text>
        </View>
        <View style={styles.destCircle}>
          <MaterialIcons name="location-on" size={14} color={themeColors.surface} />
        </View>
        <View style={styles.destStem} />
        <View style={styles.destStemShadow} />
      </View>
      <View style={styles.originMarker} />

      {/* Back button only header */}
      <View style={styles.topNav}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurface} />
        </Pressable>
      </View>

      {/* Bottom sheet */}
      <View style={styles.bottomSheet}>
        {/* Drag handle */}
        <View style={styles.dragHandle} />

        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Confirm Ryde</Text>
            <Text style={styles.sheetSubtitle}>Review details before requesting</Text>
          </View>

          {/* Ride details card */}
          <View style={styles.detailsCard}>
            {/* Locations */}
            <View style={styles.locationsBlock}>
              {/* Timeline line */}
              <View style={styles.timelineAbsolute} />

              {/* Origin */}
              <View style={styles.locRow}>
                <View style={styles.originDotOuter}>
                  <View style={styles.originDotInner} />
                </View>
                <View style={styles.locText}>
                  <Text style={styles.locLabel}>PICKUP</Text>
                  <Text style={styles.locName} numberOfLines={1}>{pickupName}</Text>
                </View>
              </View>

              {/* Destination */}
              <View style={styles.locRow}>
                <View style={styles.destDotOuter}>
                  <MaterialIcons name="stop" size={12} color={themeColors.onSurface} />
                </View>
                <View style={styles.locText}>
                  <Text style={styles.locLabel}>DROPOFF</Text>
                  <Text style={styles.locName} numberOfLines={1}>{destName}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Vehicle */}
            <View style={styles.vehicleRow}>
              <Image source={{ uri: CAR_URI }} style={styles.carImg} resizeMode="contain" />
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{vehicleName}</Text>
                <View style={styles.vehicleSeatRow}>
                  <MaterialIcons name="person" size={14} color={themeColors.onSurfaceVariant} />
                  <Text style={styles.vehicleSeatText}>{seats}</Text>
                </View>
              </View>
              <Text style={styles.vehiclePrice}>${fare.toFixed(2)}</Text>
            </View>
          </View>

          {/* Payment method selector */}
          <View style={styles.paymentContainer}>
            <Text style={styles.paymentHeaderLabel}>PAYMENT METHOD</Text>
            <View style={styles.paymentMethodRow}>
              <Pressable
                onPress={() => setPaymentMethod("cash")}
                style={[
                  styles.methodPill,
                  paymentMethod === "cash" && styles.methodPillActive,
                ]}
              >
                <MaterialIcons
                  name="payments"
                  size={16}
                  color={paymentMethod === "cash" ? "#ffffff" : themeColors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.methodPillText,
                    paymentMethod === "cash" && styles.methodPillTextActive,
                  ]}
                >
                  Cash
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setPaymentMethod("wallet")}
                style={[
                  styles.methodPill,
                  paymentMethod === "wallet" && styles.methodPillActive,
                ]}
              >
                <MaterialIcons
                  name="account-balance-wallet"
                  size={16}
                  color={paymentMethod === "wallet" ? "#ffffff" : themeColors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.methodPillText,
                    paymentMethod === "wallet" && styles.methodPillTextActive,
                  ]}
                >
                  Wallet
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setPaymentMethod("card")}
                style={[
                  styles.methodPill,
                  paymentMethod === "card" && styles.methodPillActive,
                ]}
              >
                <MaterialIcons
                  name="credit-card"
                  size={16}
                  color={paymentMethod === "card" ? "#ffffff" : themeColors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.methodPillText,
                    paymentMethod === "card" && styles.methodPillTextActive,
                  ]}
                >
                  Card
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Error Banner */}
          {activeError && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={18} color="#ba1a1a" />
              <Text style={styles.errorText}>{activeError}</Text>
            </View>
          )}

          {/* Confirm button with double-submission protection */}
          <Pressable
            onPress={handleConfirm}
            disabled={isCreatingRide}
            style={({ pressed }) => [
              styles.btnConfirm,
              pressed && styles.pressed,
              isCreatingRide && styles.btnDisabled,
            ]}
          >
            {isCreatingRide ? (
              <ActivityIndicator color={themeColors.onPrimary} size="small" />
            ) : (
              <Text style={styles.btnConfirmText}>Confirm & Request</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: themeColors.surface,
    overflow: "hidden",
  },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
  },
  // ── Markers ──
  destinationMarker: {
    position: "absolute",
    top: "28%",
    left: "58%",
    zIndex: 5,
    alignItems: "center",
  },
  destEtaChip: {
    backgroundColor: themeColors.onSurface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  destEtaText: {
    color: themeColors.surface,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  destCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: themeColors.onSurface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  destStem: {
    width: 4,
    height: 24,
    backgroundColor: themeColors.onSurface,
  },
  destStemShadow: {
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.2)",
    marginTop: 2,
  },
  originMarker: {
    position: "absolute",
    top: "58%",
    left: "29%",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: themeColors.primary,
    borderWidth: 2,
    borderColor: themeColors.surfaceContainerLowest,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 5,
  },
  // ── Top Nav ──
  topNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  backBtnPressed: {
    backgroundColor: themeColors.surfaceContainerHigh,
  },
  // ── Bottom Sheet ──
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(199,196,216,0.3)",
    maxHeight: "75%",
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  // ── Header ──
  sheetHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: themeColors.onSurface,
    letterSpacing: -0.28,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: themeColors.onSurfaceVariant,
    lineHeight: 20,
  },
  // ── Details Card ──
  detailsCard: {
    backgroundColor: themeColors.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.5)",
    marginBottom: 16,
  },
  locationsBlock: {
    position: "relative",
    gap: 16,
    marginBottom: 16,
  },
  timelineAbsolute: {
    position: "absolute",
    left: 11,
    top: 28,
    bottom: 28,
    width: 2,
    backgroundColor: "rgba(199,196,216,0.5)",
    zIndex: 0,
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 1,
  },
  originDotOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: themeColors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    zIndex: 2,
  },
  originDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.primary,
  },
  destDotOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: themeColors.surface,
    borderWidth: 2,
    borderColor: themeColors.onSurface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    zIndex: 2,
  },
  locText: {
    flex: 1,
    overflow: "hidden",
  },
  locLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: themeColors.onSurfaceVariant,
    lineHeight: 14,
    marginBottom: 2,
  },
  locName: {
    fontSize: 16,
    fontWeight: "700",
    color: themeColors.onSurface,
    lineHeight: 24,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(199,196,216,0.5)",
    marginBottom: 16,
  },
  // ── Vehicle ──
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  carImg: {
    width: 64,
    height: 48,
  },
  vehicleInfo: {
    flex: 1,
    gap: 4,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: "700",
    color: themeColors.onSurface,
    lineHeight: 28,
  },
  vehicleSeatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  vehicleSeatText: {
    fontSize: 14,
    color: themeColors.onSurfaceVariant,
    lineHeight: 20,
  },
  vehiclePrice: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    letterSpacing: 0.48,
    color: themeColors.onSurface,
  },
  // ── Payment ──
  paymentContainer: {
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  paymentHeaderLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: themeColors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  methodPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: themeColors.outlineVariant,
    backgroundColor: themeColors.surface,
  },
  methodPillActive: {
    borderColor: themeColors.primary,
    backgroundColor: themeColors.primary,
  },
  methodPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: themeColors.onSurface,
  },
  methodPillTextActive: {
    color: "#ffffff",
  },
  // ── CTA ──
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
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 28,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffdad6",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#ba1a1a",
    fontWeight: "500",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
