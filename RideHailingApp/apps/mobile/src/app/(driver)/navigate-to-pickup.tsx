import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { formatCurrency } from "@/utils/currency";

// Rebuilt from scratch, replacing the previous draggable-bottom-sheet version. That version used
// PanGestureHandler + Reanimated to snap between collapsed/default/expanded heights -- on web
// (react-native-web) the drag never registered correctly, so the sheet got stuck at a broken
// height showing only the name/fare peek row with a large dead blank area below it, with the rest
// of the ride details (passenger card, pickup/dropoff, Cancel Ride, "I've Arrived") never
// reachable. Rather than debug a gesture library's web behavior, this is a single always-fully-
// visible card instead: same information, same actions, no drag/snap-point logic to get wrong on
// any platform.
//
// Map background: dashboard.tsx's own map screenshot (a real San Francisco map, not the earlier
// mismatched "Navigate To Pickup" mockup image this screen used to carry).
//
// Ride data comes from route params (dashboard.tsx's inline request cards' Accept button passes
// them), each falling back to a literal example if missing -- same pattern ride-details.tsx uses.
// ETA/distance have no equivalent in dashboard.tsx's request-card data model, so they keep this
// screen's own literal values regardless of which request was accepted.
//
// "Cancel Ride" dismisses back to the dashboard (online/searching) -- there's no real cancellation
// API yet to notify the rider, but this is the one thing actually in the driver's control on the
// frontend, the same outcome Reject already gives a request that's never accepted.
// "Share Ride" stays inert: no share/deep-link mechanism exists yet, and there's no meaningful
// frontend-only stand-in for it the way there is for Cancel.
// "I've Arrived" pushes to active-ride.tsx, unchanged.
// Chat/Call icons stay inert: no in-app messaging screen or telephony wired.
const DEFAULT_NAME = "Sarah";
const DEFAULT_RATING = 4.9;
const DEFAULT_FARE = 24.5;
const DEFAULT_PICKUP = "Blue Bottle Coffee, 2nd St";
const DEFAULT_DROPOFF = "Pier 39, Fisherman's Wharf";

export default function NavigateToPickupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const handleCancelRide = () => {
    router.dismissTo({
      pathname: "/(driver)/(drawer)/(tabs)/dashboard",
      params: { status: "online" },
    });
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="relative flex-1 overflow-hidden bg-surface-container-low">
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFyWmsppKp780nLLlL3AsgX2qtpTgOD1yJv761joNOqSnPBw6HRlT_ndHUdE8JrGlEI95RpLtYmz53Cko5COeKB4qYguYETwq9Uhp06DrwBph4bikKNamU4tNrTbQV-6ofR_9rWI1NlAuR3OqjDx2CI32zLY6Sy37zgynZFC2CIxoep3KV3UlVxZzAFVQVvVVdp9RwEwt4nd0qiZLmNTURNAakTjOxsTtSqaMH3MwArnGgEp8xqWJQ",
          }}
          resizeMode="cover"
          className="absolute inset-0 h-full w-full opacity-70"
        />

        <View
          style={{ paddingTop: 20 + insets.top }}
          className="absolute left-0 right-0 top-0 z-20 px-container-margin"
        >
          <View className="flex-row items-center justify-between rounded-2xl border border-outline-variant/30 bg-surface p-4 shadow-lg">
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

        <View style={{ top: 140 + insets.top }} className="absolute right-4 z-20 gap-4">
          <Pressable className="h-12 w-12 items-center justify-center rounded-full border border-outline-variant/30 bg-surface shadow-sm active:scale-95">
            <MaterialIcons name="my-location" size={24} color={themeColors.onSurface} />
          </Pressable>
          <Pressable className="h-12 w-12 items-center justify-center rounded-full border border-outline-variant/30 bg-surface shadow-sm active:scale-95">
            <MaterialIcons name="volume-up" size={24} color={themeColors.onSurface} />
          </Pressable>
        </View>
      </View>

      <View className="z-30 w-full rounded-t-3xl border-x border-t border-outline-variant/30 bg-surface shadow-lg">
        <View className="w-full items-center pb-1 pt-3">
          <View className="h-1 w-10 rounded-full bg-outline-variant/50" />
        </View>

        <View className="flex-row items-center justify-between px-container-margin pb-3">
          <Text className="text-xl font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            {name}
          </Text>
          <Text className="font-fare-display text-fare-display text-primary">
            {formatCurrency(fare)}
          </Text>
        </View>

        <ScrollView
          className="max-h-[50vh]"
          contentContainerClassName="gap-4 px-container-margin pb-4"
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
              <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 bg-surface shadow-sm active:scale-95">
                <MaterialIcons name="chat" size={20} color={themeColors.onSurface} />
              </Pressable>
              {/* TODO: no telephony wired. */}
              <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 bg-surface shadow-sm active:scale-95">
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

        <View
          style={{ paddingBottom: 16 + insets.bottom }}
          className="border-t border-surface-container-high px-container-margin pt-3"
        >
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
    </View>
  );
}
