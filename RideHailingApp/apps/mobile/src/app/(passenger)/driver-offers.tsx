import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  Modal,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

const ERROR_COLOR = "#ba1a1a";
const ERROR_CONTAINER = "#ffdad6";

type SearchState = "searching" | "no_drivers";

import { usePassengerRideStore, type DriverOffer } from "@/store/passenger/passenger-ride-store";
import { passengerOffersApi } from "@/lib/api/passenger/offers";
import { DriverOfferCard } from "@/components/passenger/driver-offer-card";
import { PassengerMap } from "@/components/passenger/passenger-map";
import { NearbyDriverMarkers } from "@/components/passenger/nearby-driver-markers";
import { apiClient } from "@/lib/api-client";
import { socketClient } from "@/lib/realtime/socket-client";
import { negotiationApi } from "@/lib/api/negotiation";
import { nearbyDriversApi, type NearbyDriver } from "@/lib/api/passenger/nearby-drivers";
import { bidsFromNegotiations, type PendingCounter } from "@/lib/passenger-bids";
import { describeNegotiationError } from "@/lib/negotiation-errors";
import { formatCurrency } from "@/utils/currency";

const NEARBY_REFRESH_MS = 10000;

export default function PassengerDriverOffersScreen() {
  const router = useRouter();
  const {
    createdRideId,
    currentRideId,
    pickup,
    destination,
    proposedFare,
    offers,
    setOffers,
    selectOffer,
    setRideStatus,
    selectedRideType,
    fareQuotes,
  } = usePassengerRideStore();
  const quote = fareQuotes[selectedRideType];
  const [state, setState] = useState<SearchState>("searching");
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [waiting, setWaiting] = useState<PendingCounter[]>([]);
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const offersRef = useRef<DriverOffer[]>([]);
  const [counteringOffer, setCounteringOffer] = useState<DriverOffer | null>(null);
  const [counterFare, setCounterFare] = useState<number>(0);
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);

  const effectiveRideId = createdRideId || currentRideId;

  // Radar rings
  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.6);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0.6);

  // Search icon pulse
  const searchPulse = useSharedValue(1);

  // Error icon gentle pulse
  const errorPulse = useSharedValue(1);

  useEffect(() => {
    // Radar ring 1
    ring1Scale.value = withRepeat(
      withTiming(4, { duration: 2500, easing: Easing.out(Easing.quad) }),
      -1, false
    );
    ring1Opacity.value = withRepeat(
      withTiming(0, { duration: 2500 }),
      -1, false
    );
    // Radar ring 2 (delayed start)
    const t = setTimeout(() => {
      ring2Scale.value = withRepeat(
        withTiming(4, { duration: 2500, easing: Easing.out(Easing.quad) }),
        -1, false
      );
      ring2Opacity.value = withRepeat(
        withTiming(0, { duration: 2500 }),
        -1, false
      );
    }, 1250);

    // Search icon pulse
    searchPulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    // Error pulse (for no-drivers state)
    errorPulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    return () => {
      clearTimeout(t);
    };
  }, []);

  // Realtime updates + fallback polling for offers and ride status
  useEffect(() => {
    if (!effectiveRideId) return;

    let isMounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

    const fetchOffersAndStatus = async () => {
      try {
        // 1. Check ride status (in case a driver direct-accepted the original ask)
        const rideRes = await apiClient.get<any>(`/rides/${effectiveRideId}`);
        if (!isMounted) return;

        if (rideRes.data.status === "accepted" && rideRes.data.driver) {
          const driver = rideRes.data.driver;
          const assignedOffer: DriverOffer = {
            id: `assigned-${driver.id}`,
            negotiationId: "",
            driverId: driver.id,
            driverName: driver.name,
            driverRating: typeof driver.rating === "number" ? driver.rating : null,
            driverPhotoUrl: driver.profilePhotoUrl,
            vehicleModel: [driver.vehicle?.make, driver.vehicle?.model].filter(Boolean).join(" "),
            vehiclePlate: driver.vehicle?.registrationNumber ?? null,
            vehicleColor: driver.vehicle?.color ?? undefined,
            offeredFare: Number(rideRes.data.finalFare ?? rideRes.data.proposedFare),
            estimatedArrivalMinutes: null,
          };
          selectOffer(assignedOffer);
          setRideStatus("driver_assigned");
          router.push("/(passenger)/ride-tracking" as any);
          return;
        }

        // 2. Driver bids = pending driver counter-offers in the ride's negotiations
        const sessions = await negotiationApi.getNegotiations(effectiveRideId);
        if (!isMounted) return;

        const { bids, waiting: waitingCounters } = bidsFromNegotiations(sessions);
        offersRef.current = bids;
        setOffers(bids);
        setWaiting(waitingCounters);
      } catch (err: any) {
        console.warn("Error polling driver offers:", err);
      }
    };

    // Initial fetch
    fetchOffersAndStatus();

    // Connect socket and join ride room
    socketClient.connect().then(() => {
      if (isMounted) {
        socketClient.joinRoom(`ride:${effectiveRideId}`);
      }
    });

    // Handle real-time socket events
    const handleRealtimeUpdate = () => {
      if (isMounted) {
        fetchOffersAndStatus();
      }
    };

    const unsubOfferCreated = socketClient.on("ride:offer-created", handleRealtimeUpdate);
    const unsubOfferUpdated = socketClient.on("ride:offer-updated", handleRealtimeUpdate);
    const unsubRideAccepted = socketClient.on("ride:accepted", handleRealtimeUpdate);
    const unsubStatusChanged = socketClient.on("ride:status-changed", handleRealtimeUpdate);
    const unsubNegCreated = socketClient.on("negotiation:offer-created", handleRealtimeUpdate);
    const unsubNegAccepted = socketClient.on("negotiation:accepted", handleRealtimeUpdate);

    // Fallback polling every 4 seconds
    pollInterval = setInterval(fetchOffersAndStatus, 4000);

    // Timeout to "no_drivers" after 60s if 0 offers
    timeoutTimer = setTimeout(() => {
      if (isMounted && offersRef.current.length === 0) {
        setState("no_drivers");
      }
    }, 60000);

    return () => {
      isMounted = false;
      unsubOfferCreated();
      unsubOfferUpdated();
      unsubRideAccepted();
      unsubStatusChanged();
      unsubNegCreated();
      unsubNegAccepted();
      socketClient.leaveRoom(`ride:${effectiveRideId}`);
      if (pollInterval) clearInterval(pollInterval);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [effectiveRideId]);

  // Real nearby drivers for the map (coarse positions only, see GET /drivers/nearby).
  useEffect(() => {
    if (!pickup) return;
    let isMounted = true;
    const vehicleType = quote?.vehicleType;
    const load = async () => {
      try {
        const res = await nearbyDriversApi.getNearby({
          lat: pickup.latitude,
          lng: pickup.longitude,
          vehicleType,
        });
        if (isMounted) setNearbyDrivers(res.drivers);
      } catch {
        // Map markers are best-effort; the search itself does not depend on them.
      }
    };
    load();
    const t = setInterval(load, NEARBY_REFRESH_MS);
    return () => {
      isMounted = false;
      clearInterval(t);
    };
  }, [pickup?.latitude, pickup?.longitude, quote?.vehicleType]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  const searchPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchPulse.value }],
  }));

  const errorPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: errorPulse.value }],
  }));

  const handleKeepTrying = async () => {
    setState("searching");
    if (effectiveRideId) {
      try {
        await passengerOffersApi.matchRide(effectiveRideId);
      } catch (err) {
        console.warn("Could not re-trigger match:", err);
      }
    }
  };

  const handleChangeFare = () => {
    router.back();
  };

  const handleCancelRequest = () => {
    router.push("/(passenger)/ride-cancel-confirm" as any);
  };

  const handleClose = () => {
    router.push("/(passenger)/ride-cancel-confirm" as any);
  };

  const refreshBids = async () => {
    if (!effectiveRideId) return;
    try {
      const sessions = await negotiationApi.getNegotiations(effectiveRideId);
      const { bids, waiting: waitingCounters } = bidsFromNegotiations(sessions);
      offersRef.current = bids;
      setOffers(bids);
      setWaiting(waitingCounters);
    } catch {
      // The next poll will retry.
    }
  };

  // Accepting a driver's bid always goes through the negotiation-accept endpoint, which settles
  // Ride.finalFare at exactly the amount on the offer the passenger is looking at.
  const handleAcceptOffer = async (offer: DriverOffer) => {
    if (!effectiveRideId || isAccepting) return;
    setIsAccepting(true);
    setErrorMessage(null);
    try {
      const res = await negotiationApi.acceptNegotiation(effectiveRideId, offer.id);
      const agreed = Number(res?.ride?.finalFare);
      selectOffer(Number.isFinite(agreed) && agreed > 0 ? { ...offer, offeredFare: agreed } : offer);
      setRideStatus("driver_assigned");
      router.push("/(passenger)/ride-tracking" as any);
    } catch (err: unknown) {
      const failure = describeNegotiationError(err, "passenger", "Could not accept this offer. Please try again.");
      setErrorMessage(failure.message);
      if (failure.refresh) await refreshBids();
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectOffer = async (offer: DriverOffer) => {
    if (!effectiveRideId || isAccepting) return;
    setErrorMessage(null);
    try {
      await negotiationApi.rejectNegotiation(effectiveRideId, offer.negotiationId);
      setOffers(offers.filter((o) => o.id !== offer.id));
      offersRef.current = offersRef.current.filter((o) => o.id !== offer.id);
    } catch (err: unknown) {
      const failure = describeNegotiationError(err, "passenger", "Could not reject this offer. Please try again.");
      setErrorMessage(failure.message);
      if (failure.refresh) await refreshBids();
    }
  };

  // Counter stepper range and step come from the server quote for this ride's tier.
  const snapToStep = (value: number) => {
    if (!quote) return value;
    const stepped = Math.round(value / quote.fareStep) * quote.fareStep;
    return Math.min(quote.maximumFare, Math.max(quote.minimumFare, stepped));
  };

  const handleCounterOffer = (offer: DriverOffer) => {
    setCounteringOffer(offer);
    setCounterFare(snapToStep((offer.offeredFare + (proposedFare || offer.offeredFare)) / 2));
  };

  const handleSubmitCounter = async () => {
    if (!effectiveRideId || !counteringOffer || isSubmittingCounter) return;
    setIsSubmittingCounter(true);
    setErrorMessage(null);
    try {
      await negotiationApi.passengerCounter(
        effectiveRideId,
        counteringOffer.driverId,
        counterFare,
      );
      setCounteringOffer(null);
      await refreshBids();
    } catch (err: unknown) {
      const failure = describeNegotiationError(err, "passenger", "Could not send your counter-offer.");
      setErrorMessage(failure.message);
      setCounteringOffer(null);
      if (failure.refresh) await refreshBids();
    } finally {
      setIsSubmittingCounter(false);
    }
  };

  const searchMap = (
    <PassengerMap
      pickup={pickup ? { latitude: pickup.latitude, longitude: pickup.longitude } : null}
      showUserLocation={false}
      autoFitRoute={false}
      initialRegion={
        pickup
          ? {
              latitude: pickup.latitude,
              longitude: pickup.longitude,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }
          : undefined
      }
      style={styles.mapBg}
    >
      <NearbyDriverMarkers drivers={nearbyDrivers} />
    </PassengerMap>
  );

  if (state === "no_drivers") {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        {/* Dimmed map */}
        {searchMap}
        <View style={styles.dimOverlay} pointerEvents="none" />

        {/* Close button */}
        <View style={styles.topNavNoDrivers}>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            accessibilityLabel="Close"
          >
            <MaterialIcons name="close" size={24} color={themeColors.onSurface} />
          </Pressable>
        </View>

        {/* Bottom sheet */}
        <View style={styles.noDriversSheet}>
          <View style={styles.dragHandleRow}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.noDriversContent}>
            {/* Icon with pulse */}
            <View style={styles.errorIconWrapper}>
              <Animated.View style={[styles.errorPulseBlob, errorPulseStyle]} />
              <View style={styles.errorIconCircle}>
                <MaterialIcons name="schedule" size={32} color={ERROR_COLOR} />
              </View>
              {/* Small badge */}
              <View style={styles.errorBadge}>
                <MaterialIcons name="priority-high" size={14} color="#ffffff" />
              </View>
            </View>

            <Text style={styles.noDriversTitle}>No drivers nearby</Text>
            <Text style={styles.noDriversBody}>
              Demand is exceptionally high right now. You can continue waiting
              or adjust your fare to prioritize your request.
            </Text>

            <View style={styles.noDriversActions}>
              <Pressable
                onPress={handleKeepTrying}
                style={({ pressed }) => [styles.btnKeepTrying, pressed && styles.pressed]}
              >
                <MaterialIcons name="refresh" size={20} color={themeColors.onPrimary} />
                <Text style={styles.btnKeepTryingText}>KEEP TRYING</Text>
              </Pressable>
              <Pressable
                onPress={handleChangeFare}
                style={({ pressed }) => [styles.btnChangeFare, pressed && styles.pressed]}
              >
                <MaterialIcons name="account-balance-wallet" size={20} color={themeColors.onSurface} />
                <Text style={styles.btnChangeFareText}>CHANGE FARE</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const hasOffers = offers && offers.length > 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map: the passenger's pickup and real nearby available drivers */}
      {searchMap}

      {/* Bottom gradient */}
      <View style={styles.bottomGradient} />

      {/* Radar animation centered when searching and no offers */}
      {!hasOffers ? (
        <View style={styles.radarContainer}>
          {/* Center pin */}
          <View style={styles.radarPin}>
            <View style={styles.radarPinInner} />
          </View>
          {/* Expanding rings */}
          <Animated.View style={[styles.radarRing, ring1Style]} />
          <Animated.View style={[styles.radarRing, ring2Style]} />
        </View>
      ) : null}

      {/* Bottom card: either searching state or active offers list */}
      <View style={[styles.searchingCard, hasOffers && styles.offersCard]}>
        <View style={styles.dragHandleRow}>
          <View style={styles.dragHandle} />
        </View>

        {errorMessage ? (
          <View style={styles.errorAlert}>
            <MaterialIcons name="error-outline" size={18} color={ERROR_COLOR} />
            <Text style={styles.errorAlertText}>{errorMessage}</Text>
          </View>
        ) : null}

        {hasOffers ? (
          <View style={styles.offersContainer}>
            <View style={styles.offersHeaderRow}>
              <View>
                <Text style={styles.offersTitle}>Driver Offers ({offers.length})</Text>
                <Text style={styles.offersSubtitle}>Select a driver to confirm your ride</Text>
              </View>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            {waiting.map((w, i) => (
              <Text key={`${w.driverName}-${i}`} style={styles.offersSubtitle}>
                Waiting for {w.driverName} to answer your {formatCurrency(w.amount)} counter
              </Text>
            ))}

            <View style={styles.offersListContainer}>
              {offers.map((offer) => (
                <DriverOfferCard
                  key={offer.id}
                  offer={offer}
                  onAccept={handleAcceptOffer}
                  onReject={handleRejectOffer}
                  onCounter={quote ? handleCounterOffer : undefined}
                  disabled={isAccepting}
                />
              ))}
            </View>

            {/* Cancel button */}
            <Pressable
              onPress={handleCancelRequest}
              style={({ pressed }) => [styles.btnCancel, pressed && styles.btnCancelPressed]}
            >
              <MaterialIcons name="close" size={18} color={themeColors.onSurfaceVariant} />
              <Text style={styles.btnCancelText}>Cancel Request</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.searchingContent}>
            {/* Pulsing search icon */}
            <Animated.View style={searchPulseStyle}>
              <MaterialIcons name="search" size={32} color={themeColors.primary} />
            </Animated.View>

            <Text style={styles.searchingTitle}>Finding drivers nearby...</Text>
            <Text style={styles.searchingSubtitle}>
              Ride request submitted • Waiting for driver matching
            </Text>
            {proposedFare ? (
              <Text style={styles.searchingFare}>
                Offered Fare: {formatCurrency(proposedFare)}
              </Text>
            ) : null}

            {/* Cancel button */}
            <Pressable
              onPress={handleCancelRequest}
              style={({ pressed }) => [styles.btnCancel, pressed && styles.btnCancelPressed]}
            >
              <MaterialIcons name="close" size={18} color={themeColors.onSurfaceVariant} />
              <Text style={styles.btnCancelText}>Cancel Request</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Passenger Counter Offer Modal */}
      <Modal
        visible={counteringOffer !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCounteringOffer(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />
            <Text style={styles.modalTitle}>Counter Offer</Text>
            <Text style={styles.modalSubtitle}>
              Propose a counter fare to {counteringOffer?.driverName}
            </Text>

            <View style={styles.counterStepperRow}>
              <Pressable
                onPress={() => setCounterFare((v) => snapToStep(v - (quote?.fareStep ?? 0)))}
                disabled={!quote || counterFare <= quote.minimumFare}
                accessibilityLabel="Decrease counter fare"
                style={[styles.stepperBtn, (!quote || counterFare <= quote.minimumFare) && { opacity: 0.35 }]}
              >
                <MaterialIcons name="remove" size={24} color={themeColors.primary} />
              </Pressable>
              <Text style={styles.counterFareText}>
                {formatCurrency(counterFare)}
              </Text>
              <Pressable
                onPress={() => setCounterFare((v) => snapToStep(v + (quote?.fareStep ?? 0)))}
                disabled={!quote || counterFare >= quote.maximumFare}
                accessibilityLabel="Increase counter fare"
                style={[styles.stepperBtn, (!quote || counterFare >= quote.maximumFare) && { opacity: 0.35 }]}
              >
                <MaterialIcons name="add" size={24} color={themeColors.primary} />
              </Pressable>
            </View>

            {quote && (
              <Text style={styles.modalAiText}>
                Allowed range {formatCurrency(quote.minimumFare)} – {formatCurrency(quote.maximumFare)}
              </Text>
            )}

            <View style={styles.modalActionRow}>
              <Pressable
                onPress={() => setCounteringOffer(null)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitCounter}
                disabled={isSubmittingCounter}
                style={[styles.modalSubmitBtn, isSubmittingCounter && { opacity: 0.6 }]}
              >
                {isSubmittingCounter ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Send Counter</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: themeColors.background,
    overflow: "hidden",
  },
  mapBg: {
    ...StyleSheet.absoluteFill,
  },
  mapBlur: {
    opacity: 0.7,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(249,249,255,0.3)",
  },
  // ── Radar ──
  radarContainer: {
    position: "absolute",
    top: "45%",
    left: "50%",
    zIndex: 10,
    transform: [{ translateX: -32 }, { translateY: -32 }],
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  radarRing: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: themeColors.primaryContainer,
  },
  radarPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: themeColors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: themeColors.surfaceContainerLowest,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  radarPinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.surfaceContainerLowest,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(249,249,255,0.7)",
    zIndex: 0,
  },
  // ── Searching Card ──
  searchingCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    maxWidth: 448,
    alignSelf: "center",
    width: "100%",
    backgroundColor: themeColors.surfaceContainerLowest,
    borderRadius: 24,
    marginHorizontal: 0,
    marginBottom: 20,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
    borderWidth: 1,
    borderColor: themeColors.surfaceVariant,
  },
  dragHandleRow: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: themeColors.outlineVariant,
  },
  searchingContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    alignItems: "center",
    gap: 16,
  },
  searchingTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "600",
    color: themeColors.onSurface,
    letterSpacing: -0.28,
    textAlign: "center",
  },
  searchingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: themeColors.onSurfaceVariant,
    textAlign: "center",
    marginTop: -8,
  },
  searchingFare: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: themeColors.primary,
    textAlign: "center",
  },
  btnCancel: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.surfaceContainer,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnCancelPressed: {
    backgroundColor: themeColors.surfaceContainerHigh,
  },
  btnCancelText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: themeColors.onSurfaceVariant,
    lineHeight: 16,
  },
  // ── No Drivers ──
  topNavNoDrivers: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
    justifyContent: "space-between",
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: themeColors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.3)",
  },
  closeBtnPressed: {
    transform: [{ scale: 0.9 }],
  },
  noDriversSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    backgroundColor: themeColors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 10,
    borderTopWidth: 1,
    borderColor: "rgba(199,196,216,0.2)",
  },
  noDriversContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
    alignItems: "center",
    gap: 12,
  },
  errorIconWrapper: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  errorPulseBlob: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: ERROR_CONTAINER,
    opacity: 0.2,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: themeColors.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: ERROR_CONTAINER,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    zIndex: 1,
  },
  errorBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ERROR_COLOR,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: themeColors.surfaceContainerLowest,
    zIndex: 2,
  },
  noDriversTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "600",
    color: themeColors.onSurface,
    letterSpacing: -0.28,
    textAlign: "center",
  },
  noDriversBody: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
    textAlign: "center",
    maxWidth: 280,
  },
  noDriversActions: {
    width: "100%",
    gap: 12,
    marginTop: 8,
  },
  btnKeepTrying: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  btnKeepTryingText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: themeColors.onPrimary,
    lineHeight: 16,
  },
  btnChangeFare: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.outlineVariant,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnChangeFareText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: themeColors.onSurface,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  // ── Offers List ──
  offersCard: {
    maxHeight: "65%",
  },
  offersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 4,
    gap: 12,
  },
  offersHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  offersTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: themeColors.onSurface,
  },
  offersSubtitle: {
    fontSize: 13,
    color: themeColors.onSurfaceVariant,
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  liveText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.5,
  },
  offersListContainer: {
    maxHeight: 320,
  },
  errorAlert: {
    marginHorizontal: 20,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: ERROR_CONTAINER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorAlertText: {
    fontSize: 13,
    color: ERROR_COLOR,
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: "center",
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: themeColors.outlineVariant,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: themeColors.onSurface,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: themeColors.onSurfaceVariant,
    marginBottom: 20,
    textAlign: "center",
  },
  counterStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    backgroundColor: themeColors.surfaceContainer,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "100%",
    marginBottom: 16,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: themeColors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  counterFareText: {
    fontSize: 32,
    fontWeight: "800",
    color: themeColors.primary,
    minWidth: 120,
    textAlign: "center",
  },
  modalAiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 102, 137, 0.08)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 20,
  },
  modalAiText: {
    fontSize: 12,
    color: themeColors.primary,
    fontWeight: "600",
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: themeColors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: themeColors.onSurface,
  },
  modalSubmitBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: themeColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
});

