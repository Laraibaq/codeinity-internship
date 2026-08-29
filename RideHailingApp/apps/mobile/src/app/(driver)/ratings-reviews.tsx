import { ScrollView, Text, View, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// New screen: the Account tab's "Ratings & Reviews" row previously had no destination at all (a
// bare, unwired Pressable). No backend exposes real ratings yet (Ratings entity per
// Dependencies.docx SS5), so this uses representative mock data, same "frontend-only, functional
// UI" pattern as the rest of this project's un-backed screens.

const RATING_BREAKDOWN = [
  { stars: 5, count: 84 },
  { stars: 4, count: 21 },
  { stars: 3, count: 6 },
  { stars: 2, count: 2 },
  { stars: 1, count: 1 },
];

const TOTAL_RATINGS = RATING_BREAKDOWN.reduce((sum, r) => sum + r.count, 0);
const AVERAGE_RATING =
  RATING_BREAKDOWN.reduce((sum, r) => sum + r.stars * r.count, 0) / TOTAL_RATINGS;

const REVIEWS = [
  { name: "Sarah K.", stars: 5, comment: "Very smooth ride, arrived early. Great driver!", date: "2 days ago" },
  { name: "Ahmed R.", stars: 5, comment: "Clean car and friendly conversation.", date: "5 days ago" },
  { name: "Priya M.", stars: 4, comment: "Good ride overall, took a slightly longer route.", date: "1 week ago" },
  { name: "James O.", stars: 5, comment: "On time and very professional.", date: "1 week ago" },
  { name: "Fatima A.", stars: 3, comment: "Car was a bit dusty inside.", date: "2 weeks ago" },
];

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
        <View className="flex-row items-center gap-stack-md rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm">
          <View className="items-center">
            <Text className="font-display-lg text-[40px] text-on-surface">
              {AVERAGE_RATING.toFixed(1)}
            </Text>
            <StarRow count={Math.round(AVERAGE_RATING)} size={16} />
            <Text className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
              {TOTAL_RATINGS} ratings
            </Text>
          </View>

          <View className="flex-1 gap-1">
            {RATING_BREAKDOWN.map((row) => (
              <View key={row.stars} className="flex-row items-center gap-2">
                <Text className="w-3 font-label-sm text-[11px] text-on-surface-variant">
                  {row.stars}
                </Text>
                <View className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
                  <View
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(row.count / TOTAL_RATINGS) * 100}%` }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-stack-sm">
          <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Recent Reviews
          </Text>
          {REVIEWS.map((review) => (
            <View
              key={`${review.name}-${review.date}`}
              className="gap-2 rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm"
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-body-md text-body-md font-semibold text-on-surface">
                  {review.name}
                </Text>
                <Text className="font-label-sm text-[11px] text-on-surface-variant">
                  {review.date}
                </Text>
              </View>
              <StarRow count={review.stars} />
              <Text className="font-body-md text-body-md text-on-surface-variant">
                {review.comment}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
