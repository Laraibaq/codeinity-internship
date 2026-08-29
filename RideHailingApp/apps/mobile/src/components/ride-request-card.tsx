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
// state renders one of these per incoming request, stacked in a full-width vertical list. Restyled
// (per explicit instruction) from this component's original small-box wrap-row layout to match the
// now-deleted nearby-requests.tsx screen's row style instead: full-width card, spacious padding, a
// pickup/dropoff timeline against the left border rather than the compact dot-prefixed lines the
// small-box version used.
//
// Tapping the card itself does nothing, per original instruction (carried over unchanged) -- only
// the three buttons below act.
//
// Reject button: styled to match Accept/Counter's shape/size/border (h-12, rounded-lg, border), just
// with the project's error/red token instead of the neutral outline -- per earlier explicit
// instruction, replacing the old plain-text-link look the notification popup used.
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
    <View className="w-full gap-3 rounded-2xl border border-outline-variant bg-surface p-4 shadow-sm">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <Text className="font-body-md text-body-md font-semibold text-on-surface">
            {request.name}
          </Text>
          <View className="flex-row items-center gap-1 rounded-full bg-surface-container-low px-2 py-0.5">
            <MaterialIcons name="star" size={12} color={themeColors.primary} />
            <Text className="font-label-sm text-label-sm text-on-surface-variant">
              {request.rating.toFixed(1)}
            </Text>
          </View>
        </View>
        <Text className="font-fare-display text-fare-display text-primary">
          {formatCurrency(request.offer)}
        </Text>
      </View>

      <View className="ml-2 mt-1 border-l-2 border-outline-variant/30 pb-2 pl-6">
        <View className="absolute -left-[9px] top-0 h-4 w-4 items-center justify-center rounded-full bg-primary">
          <View className="h-1.5 w-1.5 rounded-full bg-surface" />
        </View>
        <Text className="font-body-md text-body-md font-semibold text-on-surface" numberOfLines={1}>
          {request.pickupLabel}
        </Text>
        <Text className="font-label-sm text-label-sm text-on-surface-variant" numberOfLines={1}>
          {request.pickupMeta}
        </Text>
      </View>
      <View className="ml-2 pt-2">
        <View className="absolute -left-[9px] top-3 h-4 w-4 items-center justify-center rounded-sm bg-on-surface">
          <View className="h-1.5 w-1.5 rounded-sm bg-surface" />
        </View>
        <Text className="pl-6 font-body-md text-body-md font-semibold text-on-surface" numberOfLines={1}>
          {request.dropoffLabel}
        </Text>
        <Text className="pl-6 font-label-sm text-label-sm text-on-surface-variant" numberOfLines={1}>
          {request.dropoffMeta}
        </Text>
      </View>

      <View className="flex-row gap-2 border-t border-outline-variant/20 pt-3">
        <View className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg bg-surface-container-low py-2">
          <MaterialIcons name="timer" size={16} color={themeColors.secondary} />
          <Text className="font-label-sm text-label-sm text-on-surface-variant">
            {request.totalMinutes} min total
          </Text>
        </View>
        <View className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg bg-surface-container-low py-2">
          <MaterialIcons name="payments" size={16} color={themeColors.secondary} />
          <Text className="font-label-sm text-label-sm text-on-surface-variant">
            ~{formatCurrency(request.ratePerMin)}/min
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onAccept}
        className="h-14 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary shadow-sm active:scale-[0.98]"
      >
        <Text className="font-label-sm text-label-sm text-on-primary">ACCEPT</Text>
      </Pressable>
      <View className="flex-row gap-3">
        <Pressable
          onPress={onCounter}
          className="h-12 flex-1 items-center justify-center rounded-lg border border-outline-variant bg-surface-container active:scale-[0.98]"
        >
          <Text className="font-label-sm text-label-sm text-on-surface">COUNTER</Text>
        </Pressable>
        <Pressable
          onPress={onReject}
          className="h-12 flex-1 items-center justify-center rounded-lg border border-error bg-transparent active:scale-[0.98]"
        >
          <Text className="font-label-sm text-label-sm text-error">REJECT</Text>
        </Pressable>
      </View>
    </View>
  );
}
