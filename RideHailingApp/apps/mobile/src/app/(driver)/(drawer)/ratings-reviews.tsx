import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { useDriverRatings } from "@/hooks/use-driver-ratings";

function formatReviewDate(dateString?: string): string {
  if (!dateString) return "Recent";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function StarRow({ count, size = 14 }: { count: number; size?: number }) {
  return (
    <View className="flex-row gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <MaterialIcons
          key={i}
          name={i < count ? "star" : "star-border"}
          size={size}
          color={themeColors.primary}
        />
      ))}
    </View>
  );
}

export default function RatingsReviewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useDriverRatings();

  const averageRating = data?.averageRating ?? 5.0;
  const totalRatings = data?.totalRatings ?? 0;
  const starBreakdown = data?.starBreakdown ?? [
    { stars: 5, count: 0 },
    { stars: 4, count: 0 },
    { stars: 3, count: 0 },
    { stars: 2, count: 0 },
    { stars: 1, count: 0 },
  ];
  const reviews = data?.reviews ?? [];

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="w-full bg-surface shadow-sm">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Ratings &amp; Reviews
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-4xl gap-stack-md px-container-margin py-stack-md pb-32"
      >
        {isLoading ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text className="mt-3 font-label-sm text-label-sm text-secondary">
              Loading ratings &amp; reviews...
            </Text>
          </View>
        ) : isError ? (
          <View className="items-center justify-center rounded-xl border border-outline-variant bg-surface p-6">
            <MaterialIcons name="error-outline" size={36} color={themeColors.secondary} />
            <Text className="mt-2 font-body-md text-body-md font-bold text-on-surface">
              Failed to load reviews
            </Text>
            <Pressable
              onPress={() => refetch()}
              className="mt-4 rounded-full bg-primary px-5 py-2 active:scale-95"
            >
              <Text className="font-label-sm text-label-sm font-bold text-on-primary">
                Retry
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="flex-row items-center gap-stack-md rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm">
              <View className="items-center">
                <Text className="font-display-lg text-[40px] text-on-surface">
                  {averageRating.toFixed(1)}
                </Text>
                <StarRow count={Math.round(averageRating)} size={16} />
                <Text className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                  {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
                </Text>
              </View>

              <View className="flex-1 gap-1">
                {starBreakdown.map((row) => {
                  const pct = totalRatings > 0 ? (row.count / totalRatings) * 100 : 0;
                  return (
                    <View key={row.stars} className="flex-row items-center gap-2">
                      <Text className="w-3 font-label-sm text-[11px] text-on-surface-variant">
                        {row.stars}
                      </Text>
                      <View className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
                        <View
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View className="gap-stack-sm">
              <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Recent Reviews
              </Text>

              {reviews.length === 0 ? (
                <View className="items-center justify-center rounded-xl border border-outline-variant/30 bg-white p-8">
                  <MaterialIcons name="star-outline" size={32} color={themeColors.secondary} />
                  <Text className="mt-2 font-body-md text-body-md font-bold text-on-surface">
                    No reviews yet
                  </Text>
                  <Text className="mt-1 text-center font-label-sm text-label-sm text-secondary">
                    Passenger feedback on completed rides will show up here.
                  </Text>
                </View>
              ) : (
                reviews.map((review) => (
                  <View
                    key={review.id}
                    className="gap-2 rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="font-body-md text-body-md font-semibold text-on-surface">
                        {review.name}
                      </Text>
                      <Text className="font-label-sm text-[11px] text-on-surface-variant">
                        {formatReviewDate(review.createdAt)}
                      </Text>
                    </View>
                    <StarRow count={review.stars} />
                    {review.comment ? (
                      <Text className="font-body-md text-body-md text-on-surface-variant">
                        {review.comment}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

