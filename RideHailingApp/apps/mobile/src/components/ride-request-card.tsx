import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { themeColors } from "@/constants/theme-colors";
import { formatCurrency } from "@/utils/currency";

export type RideRequest = {
  id: string;
  name: string;
  rating: number;
  offer: number;
  pickupLabel: string;
  pickupMeta: string;
  dropoffLabel: string;
  dropoffMeta: string;
  totalMinutes: number;
  ratePerMin: number;
};

// Inline replacement for the deleted ride-request-notification.tsx popup: dashboard.tsx's "online"
// state now renders one of these per incoming request, directly in a wrapping row on the dashboard
// itself instead of a separate modal. Same passenger/offer/pickup/dropoff content that screen used
// to show, condensed to fit a card that's only ~48% of screen width (so two sit side by side).
//
// Tapping the card itself does nothing, per explicit instruction -- only the three buttons below act.
//
// Reject button: styled to match Accept/Counter's exact shape/size/border (h-9, rounded-lg, border),
// just with the project's error/red token instead of the neutral outline -- per explicit instruction,
// replacing the old plain-text-link look the notification popup used.
export function RideRequestCard({
  request,
  onAccept,
  onCounter,
  onReject,
}: {
  request: RideRequest;
  onAccept: () => void;
  onCounter: () => void;
  onReject: () => void;
}) {
  return (
    <View className="w-[48%] gap-2 rounded-2xl border border-outline-variant bg-surface p-3 shadow-md">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 font-body-md text-body-md font-semibold text-on-surface" numberOfLines={1}>
          {request.name}
        </Text>
        <View className="flex-row items-center gap-0.5 rounded-full bg-surface-container-low px-1.5 py-0.5">
          <MaterialIcons name="star" size={11} color={themeColors.primary} />
          <Text className="font-label-sm text-[10px] text-on-surface-variant">
            {request.rating.toFixed(1)}
          </Text>
        </View>
      </View>

      <Text className="font-fare-display text-[18px] text-primary">
        {formatCurrency(request.offer)}
      </Text>

      <View className="gap-1">
        <View className="flex-row items-center gap-1">
          <View className="h-1.5 w-1.5 rounded-full bg-primary" />
          <Text className="flex-1 font-label-sm text-[10px] text-on-surface-variant" numberOfLines={1}>
            {request.pickupLabel} • {request.pickupMeta}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="h-1.5 w-1.5 rounded-sm bg-on-surface" />
          <Text className="flex-1 font-label-sm text-[10px] text-on-surface-variant" numberOfLines={1}>
            {request.dropoffLabel} • {request.dropoffMeta}
          </Text>
        </View>
      </View>

      <Text className="font-label-sm text-[10px] text-on-surface-variant" numberOfLines={1}>
        {request.totalMinutes} min total • ~{formatCurrency(request.ratePerMin)}/min
      </Text>

      <View className="gap-1.5">
        <Pressable
          onPress={onAccept}
          className="h-9 w-full items-center justify-center rounded-lg bg-primary active:scale-[0.98]"
        >
          <Text className="font-label-sm text-[11px] text-on-primary">Accept</Text>
        </Pressable>
        <View className="flex-row gap-1.5">
          <Pressable
            onPress={onCounter}
            className="h-9 flex-1 items-center justify-center rounded-lg border border-outline-variant bg-surface-container active:scale-[0.98]"
          >
            <Text className="font-label-sm text-[11px] text-on-surface">Counter</Text>
          </Pressable>
          <Pressable
            onPress={onReject}
            className="h-9 flex-1 items-center justify-center rounded-lg border border-error bg-transparent active:scale-[0.98]"
          >
            <Text className="font-label-sm text-[11px] text-error">Reject</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
