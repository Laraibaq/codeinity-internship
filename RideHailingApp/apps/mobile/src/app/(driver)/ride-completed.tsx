import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { themeColors } from "@/constants/theme-colors";
import { formatCurrency } from "@/utils/currency";
import { apiClient } from "@/lib/api-client";

// Source: "Ride Completed". Replaces the earlier placeholder built before this screen's real
// design existed -- this pass only changes visual content; the `dismissTo` navigation approach
// below was already verified correct against this flow's real stack shape and is unchanged.
//
// Reached by tapping the "Swipe to Start Ride" placeholder on active-ride.tsx (a flagged shortcut --
// see that file's header comment -- since there's no real "trip in progress" screen yet).
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("check_circle", "route", "schedule") verified against the installed glyph map.
// - The radial-gradient success wash and the map background image are both purely decorative
//   here (the source keeps them at low opacity behind an opaque card, unlike screens where the map
//   is the primary content) -- kept as plain low-opacity Views/Image, no blur needed since the
//   source doesn't blur them either.
// - `animate-bounce` on the success icon has no equivalent without animation code beyond a
//   mechanical conversion; renders in its static resting frame.
// - `hover:*` / `transition-*` / `duration-*` dropped throughout: no hover state on touch devices.
//
// Flagged, not guessed (rule 6), then resolved: this source has no "Ride Details" button or link
// anywhere on it -- only "Go Online" and "Back to Home" -- so per explicit confirmation,
// ride-details.tsx is NOT wired from here. It's reached instead from (tabs)/history.tsx's ride
// rows (a past-trip detail view fits browsing ride history better than a just-finished trip
// anyway), reading that row's data via params.
//
// Fixed (Root Cause B of this batch): the card's content wasn't in a ScrollView, sitting in a
// plain centered View -- on a shorter device this vertically-stacked card (icon, headline,
// subtitle, earnings, stats row, 2 buttons) could exceed the screen with no way to reach the
// bottom, and attempting to scroll it was instead triggering the OS's edge-swipe-back gesture.
//
// Both actions return to the dashboard tab, so both use the same `router.dismissTo` call this
// screen's navigation was already verified with: it clears the entire ride-flow stack (detail/
// notification, navigate-to-pickup, active-ride, this screen) in one call, landing on the existing
// dashboard.tsx instance rather than stacking a new one on top of it. The source gives "Go Online"
// and "Back to Home" different copy but no different destination or backend effect -- there's
// nothing else for "Back to Home" to mean here (dashboard already stays "online" throughout this
// whole flow; see dashboard.tsx), so rather than inventing a distinct behavior neither the source
// nor this task specifies, both pass `status: "online"` and land in the same place.
export default function RideCompletedScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ rideId?: string; fare?: string }>();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  useEffect(() => {
    if (params.rideId && !params.rideId.startsWith("req-")) {
      apiClient
        .patch(`/rides/${params.rideId}/status`, { status: "completed" })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["driver", "ride-history"] });
          queryClient.invalidateQueries({ queryKey: ["driver", "earnings"] });
        })
        .catch(() => {});
    }
  }, [params.rideId, queryClient]);

  const parsedFare = Number(params.fare);
  const earnings = Number.isFinite(parsedFare) && parsedFare > 0 ? parsedFare : 18.5;

  const handleSubmitRating = async () => {
    if (!params.rideId || params.rideId.startsWith("req-") || ratingSubmitted) {
      return;
    }
    setIsSubmittingRating(true);
    setRatingError(null);
    try {
      await apiClient.post(`/rides/${params.rideId}/rate`, {
        score: rating,
        comment: comment.trim() || undefined,
      });
      setRatingSubmitted(true);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setRatingSubmitted(true);
      } else {
        setRatingError(err?.response?.data?.message || "Failed to submit rating.");
      }
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const backToDashboard = () =>
    router.dismissTo({
      pathname: "/(driver)/(drawer)/(tabs)/dashboard",
      params: { status: "online" },
    });

  return (
    <View className="relative flex-1 overflow-hidden bg-surface">
      <View className="absolute inset-0 z-0 opacity-20" pointerEvents="none">
        <View className="h-full w-full bg-primary-fixed-dim/40" />
      </View>
      <Image
        source={{
          uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCrPupV5GQiOgCRIuyv4SMTKGYBb2chpg0hbbRbdpjOmFLww7ICyyb50j42zhP6O4aiaU9XN-pEtXKprWT6uMpoKYRjHj1994Em0WtjRIZ7Asbt6TBoac9AiSVpcJupq65_kjxjt1izaRIVeZaElwLkZqIfe3hkwLz9mV6rBvP4Qr8juP_x3rWJV5IibnY9qjMSU5hbNCXoLDu3eaMrLj0JElwEZk5zjl_Mew7KLml-rkUFs_-GLeKf",
        }}
        resizeMode="cover"
        className="absolute inset-0 h-full w-full opacity-30"
      />

      <ScrollView
        className="absolute inset-0 z-10"
        contentContainerClassName="flex-grow items-center justify-center p-container-margin py-8"
      >
        <View className="w-full max-w-[400px] items-center rounded-3xl border border-surface-variant bg-surface-container-lowest p-stack-md shadow-lg">
          <View className="mb-stack-sm h-20 w-20 items-center justify-center rounded-full bg-primary-container">
            <MaterialIcons name="check-circle" size={40} color={themeColors.onPrimaryContainer} />
          </View>

          <Text className="mb-base text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Ride Finished
          </Text>
          <Text className="mb-stack-lg text-center font-body-md text-body-md text-on-surface-variant">
            Earnings added to your wallet.
          </Text>

          <View className="mb-stack-lg w-full items-center">
            <Text className="mb-base font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Total Earnings
            </Text>
            <Text className="font-display-lg text-display-lg text-primary">
              {formatCurrency(earnings)}
            </Text>
          </View>

          <View className="mb-stack-lg w-full flex-row gap-gutter">
            <View className="flex-1 items-center rounded-xl bg-surface-container p-stack-sm">
              <MaterialIcons name="route" size={20} color={themeColors.outline} style={{ marginBottom: 8 }} />
              <Text className="font-fare-display text-fare-display text-on-surface">3.2</Text>
              <Text className="font-label-sm text-label-sm text-on-surface-variant">mi</Text>
            </View>
            <View className="flex-1 items-center rounded-xl bg-surface-container p-stack-sm">
              <MaterialIcons name="schedule" size={20} color={themeColors.outline} style={{ marginBottom: 8 }} />
              <Text className="font-fare-display text-fare-display text-on-surface">15</Text>
              <Text className="font-label-sm text-label-sm text-on-surface-variant">min</Text>
            </View>
          </View>

          {/* Rate Passenger Card */}
          <View className="mb-stack-lg w-full rounded-2xl border border-outline-variant/30 bg-surface p-4 items-center shadow-xs">
            <Text className="font-headline-sm text-on-surface text-base font-bold mb-1">
              Rate your passenger
            </Text>
            <Text className="text-on-surface-variant text-xs mb-3">
              How was your experience with the passenger?
            </Text>

            {ratingSubmitted ? (
              <View className="flex-row items-center bg-emerald-500/10 px-3 py-2 rounded-xl">
                <MaterialIcons name="check" size={18} color="#10b981" />
                <Text className="text-emerald-600 text-xs font-semibold ml-1.5">
                  Rating submitted! Thank you.
                </Text>
              </View>
            ) : (
              <>
                <View className="flex-row items-center space-x-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => setRating(star)}
                      className="p-1 active:scale-125"
                      accessibilityLabel={`${star} stars`}
                    >
                      <MaterialIcons
                        name={star <= rating ? "star" : "star-outline"}
                        size={32}
                        color={star <= rating ? "#f59e0b" : "#9ca3af"}
                      />
                    </Pressable>
                  ))}
                </View>

                <View className="w-full bg-surface-container rounded-xl p-2.5 border border-outline-variant/20 mb-3">
                  <TextInput
                    placeholder="Optional feedback about the passenger..."
                    placeholderTextColor="#9ca3af"
                    value={comment}
                    onChangeText={setComment}
                    maxLength={500}
                    multiline
                    numberOfLines={2}
                    className="text-on-surface text-xs min-h-[44px]"
                    textAlignVertical="top"
                  />
                </View>

                {ratingError ? (
                  <Text className="text-red-500 text-xs mb-2">{ratingError}</Text>
                ) : null}

                <Pressable
                  onPress={handleSubmitRating}
                  disabled={isSubmittingRating}
                  className="w-full py-2.5 rounded-xl bg-primary-container items-center justify-center active:scale-98 flex-row"
                >
                  {isSubmittingRating ? (
                    <ActivityIndicator size="small" color={themeColors.onPrimaryContainer} className="mr-1.5" />
                  ) : null}
                  <Text className="text-xs font-bold text-on-primary-container">
                    {isSubmittingRating ? "Submitting..." : "Submit Rating"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          <View className="w-full gap-stack-sm">
            <Pressable
              onPress={backToDashboard}
              className="h-14 w-full items-center justify-center rounded-xl bg-primary active:scale-95"
            >
              <Text className="font-body-md text-body-md font-semibold text-on-primary">
                Go Online
              </Text>
            </Pressable>
            <Pressable
              onPress={backToDashboard}
              className="h-14 w-full items-center justify-center rounded-xl border border-outline-variant bg-surface-container active:scale-95"
            >
              <Text className="font-body-md text-body-md font-semibold text-on-surface">
                Back to Home
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
