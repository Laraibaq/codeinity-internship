import { useRef } from "react";
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import type {
  GestureEvent,
  HandlerStateChangeEvent,
  PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { themeColors } from "@/constants/theme-colors";
import { formatCurrency } from "@/utils/currency";

// Merged screen: passenger-accepted.tsx (a brief "Offer Accepted!" hand-off card) and this screen's
// own prior content (live turn-by-turn navigation to the pickup) are one screen -- a single
// full-screen map with a draggable bottom sheet. dashboard.tsx's inline request cards' "Accept"
// button pushes straight here; passenger-accepted.tsx has been deleted, its hand-off content folded
// into this sheet's default "peek" state instead of being its own screen. (ride-request-
// notification.tsx, ride-request-detail.tsx, and nearby-requests.tsx -- all former callers of this
// screen -- have since been deleted too, superseded by dashboard.tsx's inline cards.)
//
// Map background: kept this screen's own pre-existing static map treatment (Image + route-line dots
// + turn-instruction bar + my-location/volume-up controls) -- the turn-instruction bar and side
// controls aren't part of the bottom-sheet redesign below, and their removal wasn't requested.
//
// Bottom sheet: built with PanGestureHandler + Animated.View, per explicit instruction not to add
// @gorhom/bottom-sheet or any other new package. PanGestureHandler is RNGH's older component-based
// API (its own type declares it "@deprecated ... Use Gesture.Pan() instead," but it's still present
// and functional in the installed react-native-gesture-handler version, and is what was literally
// asked for). `useAnimatedGestureHandler` no longer exists in this reanimated version (~4.1, dropped
// from 2/3's compatibility layer), so the drag is driven by plain onGestureEvent/onHandlerStateChange
// JS-thread callbacks assigning directly into a shared value (`translateY.value = ...`) rather than a
// worklet-based gesture handler -- reanimated still picks up the mutation and drives the transform
// normally.
//
// Three snap points, per explicit instruction:
// - COLLAPSED: near-zero sheet height (just enough for the drag handle to stay grabbable) -- map is
//   close to fully visible. Reached by dragging the sheet down from default.
// - DEFAULT: exactly 30% of screen height (`useWindowDimensions` height * 0.3, so it's a true 70/30
//   split on any device, not a fixed pixel guess) -- shows passenger name, fare, and the drag handle.
//   This is the sheet's resting state on first entering the screen.
// - EXPANDED: 85% of screen height (matching this project's existing convention for capped detail
//   sheets, e.g. ride-request-detail.tsx) -- shows passenger info, pickup/dropoff, ETA, chat/call
//   icons, Cancel Ride, Share Ride, and "I've Arrived".
//
// Mechanics: the sheet is one Animated.View, fixed at EXPANDED_HEIGHT (+ bottom safe-area inset)
// tall -- its layout height never changes, only its Y position does. It's anchored with
// `bottom: -revealDistance` (mostly below the screen at rest) and moved with `translateY`:
// - translateY = 0 (collapsedY): only COLLAPSED_HEIGHT is on-screen.
// - translateY = -(defaultHeight - COLLAPSED_HEIGHT) (defaultY): DEFAULT_HEIGHT is on-screen.
// - translateY = -revealDistance (expandedY): the sheet's bottom edge is flush with the screen's
//   bottom edge, so the full EXPANDED_HEIGHT (+ inset) is on-screen.
// A physical device's screen edge hides the off-screen portion at rest -- no overflow-hidden clipping
// needed, same technique used by e.g. counter-offer.tsx's bottom sheet, just with a drag added.
// Because the container's actual layout height never changes, the detail content below the peek row
// can use a normal `flex-1` ScrollView + a bottom-pinned button without any special handling for a
// "growing" container -- it's the same fixed-height-column layout regardless of which snap point is
// currently revealed.
//
// On release: snaps to whichever of the three points is closest to the drag's end position, biased
// by fling velocity -- a fast enough flick moves one snap point further in that direction even from
// near the opposite end (e.g. a fast upward flick from COLLAPSED can jump straight to EXPANDED).
// Uses `withSpring` (damping 20, stiffness 200) for the snap animation.
//
// Expanded-only content: the pickup/dropoff timeline reuses ride-request-notification.tsx's exact
// two-stop visual pattern (connector line + pickup dot + dropoff flag) rather than inventing a new
// one; dropoff address ("Pier 39, Fisherman's Wharf") matches the same fictitious ride already used
// on ride-request-notification.tsx/ride-request-detail.tsx for continuity. "Cancel Ride" now calls
// `handleCancelRide` (dismisses back to the dashboard, online/searching) -- there's still no real
// cancellation API to notify the rider, but leaving this button inert entirely defeated the point of
// a "cancel" action a driver is looking at right now. "Share Ride" stays an inert Pressable with a
// TODO comment: no share/deep-link mechanism exists yet, and unlike Cancel there's no frontend-only
// fallback that means anything for it.
//
// "I've Arrived" -> active-ride.tsx, unchanged. Chat and call icon buttons remain inert with their
// original TODOs (no in-app messaging screen, no telephony wired).
//
// Ride data now comes from route params (dashboard.tsx's inline request cards' Accept button passes
// them -- see that file), same pattern ride-details.tsx already established: only the fields that
// actually vary per request (name, rating, fare, pickup/dropoff labels) are read from params, each
// falling back to this screen's own original literal example if missing. ETA/distance and the
// passenger photo have no equivalent in dashboard.tsx's request-card data model (RideRequest's
// pickupMeta/dropoffMeta are pre-formatted strings like "2 min (0.8 mi)", not separate time/distance
// fields), so -- per that same ride-details.tsx precedent -- they keep this screen's own literal
// values regardless of which request was accepted, rather than guessing at a string-parsing scheme
// that isn't actually there.
const DEFAULT_NAME = "Sarah";
const DEFAULT_RATING = 4.9;
const DEFAULT_FARE = 24.5;
const DEFAULT_PICKUP = "Blue Bottle Coffee, 2nd St";
const DEFAULT_DROPOFF = "Pier 39, Fisherman's Wharf";

const COLLAPSED_HEIGHT = 32;
const DEFAULT_HEIGHT_RATIO = 0.3;
const EXPANDED_HEIGHT_RATIO = 0.85;
const FLING_VELOCITY_THRESHOLD = 800;

export default function NavigateToPickupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const params = useLocalSearchParams<{
    name?: string;
    rating?: string;
    fare?: string;
    pickup?: string;
    dropoff?: string;
  }>();

  const name = params.name || DEFAULT_NAME;
  const parsedRating = Number(params.rating);
  const rating = Number.isFinite(parsedRating) && parsedRating > 0 ? parsedRating : DEFAULT_RATING;
  const parsedFare = Number(params.fare);
  const fare = Number.isFinite(parsedFare) && parsedFare > 0 ? parsedFare : DEFAULT_FARE;
  const pickupLabel = params.pickup || DEFAULT_PICKUP;
  const dropoffLabel = params.dropoff || DEFAULT_DROPOFF;

  // No cancellation API exists yet (no backend endpoint to notify the rider/mark the ride
  // cancelled) -- this at least does the one thing that's actually in the driver's control on the
  // frontend: leave this screen and return to a searching dashboard, the same outcome Reject
  // already gives a request that's never accepted. `dismissTo` (not `push`) so this pickup screen
  // doesn't linger one swipe-back away after cancelling.
  const handleCancelRide = () => {
    router.dismissTo({
      pathname: "/(driver)/(drawer)/(tabs)/dashboard",
      params: { status: "online" },
    });
  };

  const defaultHeight = screenHeight * DEFAULT_HEIGHT_RATIO;
  const expandedHeight = screenHeight * EXPANDED_HEIGHT_RATIO;
  // The peek row is given this explicit height (rather than sizing to its own content) so the
  // default snap point reveals *exactly* the handle + peek row and nothing from the ScrollView
  // below it -- if the peek row were left to its natural (shorter) height, the ScrollView's own
  // content would start right after it and a sliver of the passenger/pickup card would already be
  // visible at the "default" reveal amount, contradicting the "peek shows only name, fare, and
  // handle" spec.
  const peekZoneHeight = Math.max(0, defaultHeight - COLLAPSED_HEIGHT);

  const containerHeight = expandedHeight + insets.bottom;
  const revealDistance = containerHeight - COLLAPSED_HEIGHT;

  const collapsedY = 0;
  const defaultY = -(defaultHeight - COLLAPSED_HEIGHT);
  const expandedY = -revealDistance;
  const snapPoints = [collapsedY, defaultY, expandedY];

  const translateY = useSharedValue(defaultY);
  const dragStartY = useRef(defaultY);

  const onHandleGestureEvent = (event: GestureEvent<PanGestureHandlerEventPayload>) => {
    const next = dragStartY.current + event.nativeEvent.translationY;
    translateY.value = Math.min(collapsedY, Math.max(expandedY, next));
  };

  const onHandleStateChange = (event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
    const { state, velocityY } = event.nativeEvent;
    if (state === State.BEGAN) {
      dragStartY.current = translateY.value;
      return;
    }
    if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      snapPoints.forEach((point, index) => {
        const distance = Math.abs(point - translateY.value);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      if (velocityY < -FLING_VELOCITY_THRESHOLD) {
        nearestIndex = Math.min(nearestIndex + 1, snapPoints.length - 1);
      } else if (velocityY > FLING_VELOCITY_THRESHOLD) {
        nearestIndex = Math.max(nearestIndex - 1, 0);
      }

      translateY.value = withSpring(snapPoints[nearestIndex], {
        damping: 20,
        stiffness: 200,
      });
    }
  };

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View className="h-screen w-screen flex-1 bg-surface">
      <View className="absolute inset-0 z-0 overflow-hidden bg-surface-container-low">
        {/* Fixed: this URI used to point at a screenshot of an entirely different mockup card
            ("Navigate To Pickup" / "742 Evergreen Terrace, Springfield" / "Begin Route" baked
            into the image pixels as its own UI, not a map) -- rendered as this screen's "map"
            background, it looked like two overlapping screens even though only one was actually
            mounted. Swapped for the same plain map screenshot dashboard.tsx already uses as its
            offline-state background, which is a real map with no UI baked in. */}
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFyWmsppKp780nLLlL3AsgX2qtpTgOD1yJv761joNOqSnPBw6HRlT_ndHUdE8JrGlEI95RpLtYmz53Cko5COeKB4qYguYETwq9Uhp06DrwBph4bikKNamU4tNrTbQV-6ofR_9rWI1NlAuR3OqjDx2CI32zLY6Sy37zgynZFC2CIxoep3KV3UlVxZzAFVQVvVVdp9RwEwt4nd0qiZLmNTURNAakTjOxsTtSqaMH3MwArnGgEp8xqWJQ",
          }}
          resizeMode="cover"
          className="h-full w-full opacity-60"
        />
        <View className="absolute bottom-[20%] left-[20%] h-3 w-3 rounded-full border-[0.5px] border-primary bg-white" />
        <View
          className="absolute bottom-[20%] left-[20%] h-0.5 w-[60%] border border-dashed border-primary"
          style={{ transform: [{ rotate: "-30deg" }, { translateY: -60 }] }}
        />
        <View className="absolute right-[20%] top-[20%] h-3 w-3 items-center justify-center rounded-full bg-on-surface" />
      </View>

      <View
        style={{ paddingTop: 48 + insets.top }}
        className="absolute left-0 top-0 z-20 w-full px-4 pb-4"
      >
        <View className="mx-auto max-w-md flex-row items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-lowest bg-opacity-90 p-4 shadow-lg">
          <View className="flex-row items-center gap-4">
            <View className="rounded-full bg-primary-container p-3">
              <MaterialIcons name="turn-right" size={24} color={themeColors.onPrimaryContainer} />
            </View>
            <View>
              <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Turn right
              </Text>
              <Text className="mt-1 font-body-md text-body-md text-on-surface-variant">
                on Market St
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="font-fare-display text-fare-display text-primary">0.2</Text>
            <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              mi
            </Text>
          </View>
        </View>
      </View>

      <View className="absolute right-4 top-1/2 z-20 -translate-y-1/2 gap-4">
        <Pressable className="h-12 w-12 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-lowest shadow-sm active:scale-95">
          <MaterialIcons name="my-location" size={24} color={themeColors.onSurface} />
        </Pressable>
        <Pressable className="h-12 w-12 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-lowest shadow-sm active:scale-95">
          <MaterialIcons name="volume-up" size={24} color={themeColors.onSurface} />
        </Pressable>
      </View>

      <Animated.View
        style={[
          { position: "absolute", left: 0, right: 0, bottom: -revealDistance, height: containerHeight },
          sheetAnimatedStyle,
        ]}
        className="z-30 w-full"
      >
        <View className="mx-auto h-full w-full max-w-md flex-col overflow-hidden rounded-t-3xl border-x border-t border-outline-variant/30 bg-surface-container-lowest shadow-lg">
          <PanGestureHandler
            onGestureEvent={onHandleGestureEvent}
            onHandlerStateChange={onHandleStateChange}
            hitSlop={{ top: 12, bottom: 12 }}
          >
            <Animated.View style={{ height: COLLAPSED_HEIGHT }} className="items-center justify-center">
              <View className="h-1 w-10 rounded-full bg-outline-variant/50" />
            </Animated.View>
          </PanGestureHandler>

          <View style={{ height: peekZoneHeight }} className="justify-center px-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                {name}
              </Text>
              <Text className="font-fare-display text-fare-display text-primary">
                {formatCurrency(fare)}
              </Text>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-4 px-4 pb-4"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
              <View className="flex-row items-center gap-4">
                <View className="relative">
                  <Image
                    source={{
                      uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDKFxyUMeviViwYvb1D85npTLjp3fiS3loR6fzX1-fQ_1pH-I8EKhjQYAP5qRC0lIzzlbGGPPnnlJ24NrxH7K89R-ocr7yCDSp6xl9uH4gXgmeKFUawardSxvuDppBG7EMrQwWIPvWKpaCicjq_MS-XzEmBelbkQSjlKAVnYo7hAHPrBoaR3CCLtcG2B-j2npsLd5Hnm57C5yFg_Qb6udmdwLIUVIv0i_ytgW4RUPLKUV-m92SAygr",
                    }}
                    resizeMode="cover"
                    className="h-14 w-14 rounded-full border-2 border-surface-container-lowest"
                  />
                  <View className="absolute -bottom-1 -right-1 rounded-full border border-outline-variant/20 bg-surface-container-lowest p-0.5">
                    <MaterialIcons name="star" size={14} color={themeColors.primary} />
                  </View>
                </View>
                <Text className="font-label-sm text-label-sm text-primary">{rating.toFixed(1)}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                {/* TODO: no in-app messaging screen exists yet. */}
                <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-lowest shadow-sm active:scale-95">
                  <MaterialIcons name="chat" size={20} color={themeColors.onSurface} />
                </Pressable>
                {/* TODO: no telephony wired. */}
                <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-lowest shadow-sm active:scale-95">
                  <MaterialIcons name="call" size={20} color={themeColors.onSurface} />
                </Pressable>
              </View>
            </View>

            <View className="relative flex-col gap-stack-md rounded-2xl border border-outline-variant/20 bg-surface-container-low py-3 pl-10 pr-2">
              <View className="absolute bottom-4 left-[19px] top-4 w-[2px] bg-surface-container-highest" />
              <View className="relative">
                <View className="absolute -left-[35px] top-0 z-10 h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-surface-container-lowest">
                  <View className="h-2 w-2 rounded-full bg-primary" />
                </View>
                <Text className="mb-0.5 font-label-sm text-label-sm text-on-surface-variant">
                  Pickup
                </Text>
                <Text
                  className="font-body-md text-body-md font-semibold text-on-surface"
                  numberOfLines={1}
                >
                  {pickupLabel}
                </Text>
              </View>
              <View className="relative">
                <View className="absolute -left-[35px] top-0 z-10 h-6 w-6 items-center justify-center rounded-full bg-on-surface">
                  <MaterialIcons name="flag" size={14} color={themeColors.surface} />
                </View>
                <Text className="mb-0.5 font-label-sm text-label-sm text-on-surface-variant">
                  Dropoff
                </Text>
                <Text
                  className="font-body-md text-body-md font-semibold text-on-surface"
                  numberOfLines={1}
                >
                  {dropoffLabel}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-primary" />
                <Text className="font-fare-display text-fare-display text-on-surface">4 min</Text>
                <Text className="font-body-md text-body-md text-on-surface-variant">away</Text>
              </View>
              <Text className="font-body-md text-body-md text-on-surface-variant">1.2 mi</Text>
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={handleCancelRide}
                className="h-12 flex-1 items-center justify-center rounded-lg border border-error bg-transparent active:scale-[0.98]"
              >
                <Text className="font-label-sm text-label-sm text-error">Cancel Ride</Text>
              </Pressable>
              {/* TODO: no share/deep-link mechanism exists yet -- this is a UI-shell placeholder. */}
              <Pressable className="h-12 flex-1 items-center justify-center rounded-lg border border-outline-variant bg-surface-container active:scale-[0.98]">
                <Text className="font-label-sm text-label-sm text-on-surface">Share Ride</Text>
              </Pressable>
            </View>
          </ScrollView>

          <View className="px-4 pb-4 pt-2">
            <Pressable
              onPress={() => router.push("/(driver)/active-ride")}
              className="w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4 shadow-lg active:scale-[0.98]"
            >
              <Text className="text-lg font-headline-lg-mobile text-headline-lg-mobile text-on-primary">
                I&apos;ve Arrived
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color={themeColors.onPrimary} />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
