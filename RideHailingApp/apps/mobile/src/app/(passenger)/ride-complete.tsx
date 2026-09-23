import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";
import { PassengerHeader } from "@/components/passenger/passenger-header";
import { usePassengerRideStore } from "@/store/passenger/passenger-ride-store";
import { submitRideRating } from "@/lib/api/ratings";
import { paymentsApi, type RidePaymentResponse } from "@/lib/api/payments";
import { formatCurrency } from "@/utils/currency";
import { getApiErrorMessage } from "@/lib/api-client";

export default function PassengerRideCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const resetRide = usePassengerRideStore((s) => s.resetRide);
  const selectedOffer = usePassengerRideStore((s) => s.selectedOffer);
  const createdRideId = usePassengerRideStore((s) => s.createdRideId);
  const currentRideId = usePassengerRideStore((s) => s.currentRideId);

  const rideId = params.rideId || createdRideId || currentRideId;

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<RidePaymentResponse | null>(null);

  useEffect(() => {
    if (rideId && !rideId.startsWith("req-")) {
      paymentsApi
        .getRidePayment(rideId)
        .then((res) => setPaymentInfo(res))
        .catch(() => {});
    }
  }, [rideId]);

  const handleDone = async () => {
    if (!hasRated && rideId && !rideId.startsWith("req-")) {
      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        await submitRideRating(rideId, {
          score: rating,
          comment: comment.trim() || undefined,
        });
        setHasRated(true);
        resetRide();
        router.replace("/(passenger)/home");
      } catch (err: any) {
        // If already rated (409 Conflict), consider it done
        if (err?.response?.status === 409) {
          setHasRated(true);
          resetRide();
          router.replace("/(passenger)/home");
          return;
        }
        setErrorMessage(getApiErrorMessage(err, "Failed to submit rating. You can skip."));
        setIsSubmitting(false);
      }
    } else {
      resetRide();
      router.replace("/(passenger)/home");
    }
  };

  const handleSkip = () => {
    resetRide();
    router.replace("/(passenger)/home");
  };

  return (
    <View className="flex-1 bg-background">
      <PassengerHeader title="Trip Completed" showBack={false} />

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-full bg-emerald-500/10 items-center justify-center mb-3">
            <MaterialIcons name="check-circle" size={40} color="#10b981" />
          </View>
          <Text className="text-2xl font-bold text-on-surface">You have arrived!</Text>
          <Text className="text-secondary text-sm mt-1">
            We hope you enjoyed your ride.
          </Text>
        </View>

        {/* Fare Receipt & Payment Card */}
        <View className="bg-surface rounded-2xl p-5 border border-outline-variant/30 mb-6 shadow-sm">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-secondary text-xs font-semibold uppercase tracking-wider">
              Trip Total
            </Text>
            {paymentInfo?.payment?.status === "succeeded" ? (
              <View className="bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <Text className="text-emerald-500 text-[11px] font-bold uppercase tracking-wider">
                  Paid
                </Text>
              </View>
            ) : paymentInfo?.payment?.paymentMethod === "cash" || (!paymentInfo?.payment && selectedOffer) ? (
              <View className="bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                <Text className="text-amber-500 text-[11px] font-bold uppercase tracking-wider">
                  Cash Settlement
                </Text>
              </View>
            ) : (
              <View className="bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                <Text className="text-primary text-[11px] font-bold uppercase tracking-wider">
                  {paymentInfo?.payment?.status || "Pending"}
                </Text>
              </View>
            )}
          </View>

          <Text className="text-3xl font-bold text-on-surface mb-4">
            {formatCurrency(
              paymentInfo?.authoritativeFare
                ? Number(paymentInfo.authoritativeFare)
                : selectedOffer?.offeredFare
                ? selectedOffer.offeredFare
                : 25.0,
            )}
          </Text>

          <View className="pt-3 border-t border-outline-variant/20 flex-row justify-between items-center">
            <Text className="text-secondary text-sm">Payment Method</Text>
            <View className="flex-row items-center gap-1">
              <MaterialIcons
                name={
                  paymentInfo?.payment?.paymentMethod === "wallet"
                    ? "account-balance-wallet"
                    : paymentInfo?.payment?.paymentMethod === "card"
                    ? "credit-card"
                    : "payments"
                }
                size={16}
                color={themeColors.primary}
              />
              <Text className="text-on-surface text-sm font-semibold capitalize">
                {paymentInfo?.payment?.paymentMethod || "Cash"}
              </Text>
            </View>
          </View>

          <View className="pt-2 flex-row justify-between items-center">
            <Text className="text-secondary text-sm">Driver</Text>
            <Text className="text-on-surface text-sm font-semibold">
              {selectedOffer?.driverName || "Alex Robinson"}
            </Text>
          </View>
        </View>

        {/* Driver Rating Box */}
        <View className="bg-surface rounded-2xl p-5 border border-outline-variant/30 items-center shadow-sm mb-4">
          <Text className="text-on-surface text-base font-bold mb-1">Rate your driver</Text>
          <Text className="text-secondary text-xs mb-4">How was your experience?</Text>

          <View className="flex-row items-center space-x-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setRating(star)}
                className="p-1 active:scale-125"
                accessibilityLabel={`${star} stars`}
              >
                <MaterialIcons
                  name={star <= rating ? "star" : "star-outline"}
                  size={36}
                  color={star <= rating ? "#f59e0b" : "#9ca3af"}
                />
              </Pressable>
            ))}
          </View>

          {/* Optional review comment */}
          <View className="w-full bg-surface-container rounded-xl p-3 border border-outline-variant/20">
            <TextInput
              placeholder="Leave an optional review for your driver..."
              placeholderTextColor="#9ca3af"
              value={comment}
              onChangeText={setComment}
              maxLength={500}
              multiline
              numberOfLines={3}
              className="text-on-surface text-sm min-h-[60px]"
              textAlignVertical="top"
            />
          </View>
        </View>

        {errorMessage ? (
          <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 flex-row items-center">
            <MaterialIcons name="error-outline" size={18} color="#ef4444" />
            <Text className="text-red-500 text-xs ml-2 flex-1">{errorMessage}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="p-6 bg-surface border-t border-outline-variant/20 gap-3">
        <Pressable
          onPress={handleDone}
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-primary items-center justify-center active:scale-98 shadow-sm flex-row"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
          ) : null}
          <Text className="text-white text-base font-bold">
            {isSubmitting ? "Submitting..." : "Submit Rating & Finish"}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          disabled={isSubmitting}
          className="w-full py-2 items-center justify-center active:opacity-70"
        >
          <Text className="text-secondary text-sm font-medium">Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}
