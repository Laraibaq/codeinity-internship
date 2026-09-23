import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

const MAP_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBIrPXW3NEDrb-V426l7_W0vAptuy3Kjmk4sDi4RBNKDr1UcgZDkaoNJH627P3IyTvzYptM9PcyLq0OrDkr3jgslAEQjaCWXvet0S4q5-CB-rrSc6xNxxi6kkjFEYlv1P9KMoNyrtcJUlPlPYCyy_X1EfXxQK2DCW2BevNvn_f57Si0Cup8yneKQ_y20S_j0ZZARR-wQd_4RIHmzOmyXi1RS-L5RF4rT2ChlFm-wIrDB1-3WNYfCQGT";

const AVATAR_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAwNbTtRWyysdMspLZq9DRcGyktGwIUVSg33rUj_zTUhiuwiXJlX6utJhNlp_y1uTbPZXZi6JqB1EsK1jGOY5qQsxkH_aUCvi0hAVb4uvw-QqkKi5xSgt7TH8wqs1h8oclVx36Nxly4voEeEGLCx138DbnF-CHRqwxTr7wIhgVycQfoZPVdGWz9L_SkvNsysBqEm8VyxoJ3WJM7HQHMhtPIC3xAnfKBe9Qs9UlWfNw0PwYWLZUemazY";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min(280, SCREEN_WIDTH - 60);
const CARD_GAP = 16;

const RIDE_TYPES = [
  {
    id: "standard",
    name: "Standard",
    eta: "3 mins away",
    price: "$32.50",
    strikePrice: "$38.00",
    seats: 4,
    badge: "Fastest",
    imageUri:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC-rjpzNhR8F7suM5WaSXbnfI-u_lebF7KKhEWN3O8uNL4be_1uvBquAhyXRAc0DYIiOoWVglYKFyxHq25zSqpnlC38SD4OIVWVZsgoKu4OigKVZ6NtDqAQ7kxW6k1CQdlOpE5YYiPjiQsIWtA0qmK_WxdJw3a5gHvuqHbATB2jqymeT5ljjCmrs_CkBWvMdz52VBuXu4FZ1qnaFNJRBHrFbcYOLwdN-g9b2eBpv3XAyeG4tO3F6MGd",
  },
  {
    id: "premium",
    name: "Premium",
    eta: "7 mins away",
    price: "$54.20",
    strikePrice: null,
    seats: 4,
    badge: null,
    imageUri:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCVuFuNBIs5Q1rl3c1DscpZb68YnrshU1sHH-KGwYvNwCm8dw4L_QaNi5Uhnyp3epbOjAyV3vDzsyW2TKs8zwnNGqO0VO637btGklmG0mdCQjpp5AEDEvvKFbZRiEATX05_yk_MldD8yhy2ZZXbCX4NZYqfziUjSWoENW2GHGv2SzyDHkhH0xlXJY91yG7hXSiXPeP5Yf3uOonD4mJFS6EeOr--QkBE3RSxeA7gphrKPh4y6VqdrO3Y",
  },
  {
    id: "xl",
    name: "XL",
    eta: "5 mins away",
    price: "$68.90",
    strikePrice: null,
    seats: 6,
    badge: null,
    imageUri:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBeJB9ix1AIlHzb98MXpXgaIdfxfaojTv03EJF_Tyb-XXoahvDRBVttTyBqTKAONmlKhcgbfq7z7aIDYZxioubHWcrgZZ0zMyXFezIwh1W5p5zrSB9uX6Y4KvzSluIpOCBxcqRCaRge-ErVWDHH5OiWU2eyAwHIxQXt7qI1Mi98xZ8fJvrLn8PAGnf02BNNAf4fyrSF9bAKHld88XJzvV2qPoo43ZLzqHI4WotX-_JAC6RAF1UFAB7M",
  },
  {
    id: "bike",
    name: "Bike",
    eta: "1 min away",
    price: "$12.00",
    strikePrice: null,
    seats: 1,
    badge: null,
    imageUri:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC5KSlpeiEvnrjJE3MTAtGaDYjWVx4EqUJARGl7mPH1Q1iFC3tWJ6qI3sNpim1NV--yqqwTtIcRnn2F9Y9_RzClqO8tjoUG8mUczOinW7yGgXbhK-kDMsE9hBC-alTnnWuhfmECm3_qRLH-szJtqw7g-tn4jMA5snQAL4DN0-tfPnp3WxWNZBgK0B9a5ColvCaeOnTL9wNDnYLNI2NySJ8_lsx22rwUo256zisq7V_hI5DdICda9Gf4",
  },
];

import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";

export default function PassengerRideSelectScreen() {
  const router = useRouter();
  const {
    pickup,
    destination,
    estimatedDistanceKm,
    selectedRideType,
    setSelectedRideType,
    paymentMethod,
    setPaymentMethod,
  } = usePassengerRideStore();

  const [selectedId, setSelectedId] = useState(selectedRideType || "standard");

  const distance = estimatedDistanceKm && estimatedDistanceKm > 0 ? estimatedDistanceKm : 6.5;

  const rideTypes = RIDE_TYPES.map((r) => {
    let priceNum = 25;
    if (r.id === "standard") priceNum = Math.round(5 + distance * 2.5);
    else if (r.id === "bike") priceNum = Math.round(3 + distance * 1.4);
    else if (r.id === "premium") priceNum = Math.round(8 + distance * 3.8);
    else if (r.id === "xl") priceNum = Math.round(10 + distance * 4.5);

    return {
      ...r,
      price: `$${priceNum.toFixed(2)}`,
      numericPrice: priceNum,
    };
  });

  const selectedRide = rideTypes.find((r) => r.id === selectedId) || rideTypes[0];

  const handleConfirm = () => {
    setSelectedRideType(selectedId);
    router.push("/(passenger)/fare-offer" as any);
  };

  const pickupDisplay = pickup?.name || pickup?.address || "Pickup Location";
  const destDisplay = destination?.name || destination?.address || "Destination";

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map background */}
      <Image source={{ uri: MAP_URI }} style={styles.mapBg} resizeMode="cover" />

      {/* Map markers */}
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
        <Pressable style={styles.avatarBtn}>
          <Image source={{ uri: AVATAR_URI }} style={styles.avatarImg} resizeMode="cover" />
        </Pressable>
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

        {/* Horizontal ride cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={styles.cardsContainer}
          style={styles.cardsScroll}
        >
          {rideTypes.map((ride) => {
            const isSelected = ride.id === selectedId;
            return (
              <Pressable
                key={ride.id}
                onPress={() => {
                  setSelectedId(ride.id);
                  setSelectedRideType(ride.id);
                }}
                style={[
                  styles.rideCard,
                  { width: CARD_WIDTH },
                  isSelected && styles.rideCardSelected,
                  !isSelected && styles.rideCardUnselected,
                ]}
              >
                {/* Badge */}
                {ride.badge && (
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>{ride.badge}</Text>
                  </View>
                )}

                {/* Car image + price */}
                <View style={styles.cardTopRow}>
                  <Image
                    source={{ uri: ride.imageUri }}
                    style={styles.carImg}
                    resizeMode="contain"
                  />
                  <View style={styles.priceBlock}>
                    <Text style={styles.priceText}>{ride.price}</Text>
                    {ride.strikePrice && (
                      <Text style={styles.strikePrice}>{ride.strikePrice}</Text>
                    )}
                  </View>
                </View>

                {/* Name + seats */}
                <View style={styles.cardBottomRow}>
                  <View>
                    <Text style={styles.rideName}>{ride.name}</Text>
                    <Text style={styles.rideEta}>{ride.eta}</Text>
                  </View>
                  <View style={styles.seatChip}>
                    <MaterialIcons name="person" size={14} color={themeColors.onSurfaceVariant} />
                    <Text style={styles.seatCount}>{ride.seats}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Payment + CTA */}
        <View style={styles.actionArea}>
          {/* Payment selector */}
          <Pressable
            style={styles.paymentRow}
            onPress={() => {
              const nextMethod =
                paymentMethod === "cash" ? "wallet" : paymentMethod === "wallet" ? "card" : "cash";
              setPaymentMethod(nextMethod);
            }}
          >
            <View style={styles.paymentCardIcon}>
              <MaterialIcons
                name={
                  paymentMethod === "cash"
                    ? "attach-money"
                    : paymentMethod === "wallet"
                    ? "account-balance-wallet"
                    : "credit-card"
                }
                size={18}
                color={themeColors.primary}
              />
            </View>
            <View style={styles.paymentTextBlock}>
              <Text style={styles.paymentName}>
                {paymentMethod === "cash"
                  ? "Cash Payment"
                  : paymentMethod === "wallet"
                  ? "In-App Wallet"
                  : "Credit / Debit Card"}
              </Text>
              <Text style={styles.paymentSwitch}>Switch</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={themeColors.onSurfaceVariant} />
          </Pressable>

          {/* Confirm button */}
          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [styles.btnConfirm, pressed && styles.pressed]}
          >
            <Text style={styles.btnConfirmText}>Confirm {selectedRide.name}</Text>
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
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
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
  carImg: {
    width: 96,
    height: 64,
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
