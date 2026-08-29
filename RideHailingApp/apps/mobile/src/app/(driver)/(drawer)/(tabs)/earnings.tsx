import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { useOpenDrawer } from "@/hooks/use-open-drawer";
import { formatCurrency } from "@/utils/currency";

type Period = "daily" | "weekly" | "monthly";

type FinanceBucket = {
  label: string;
  earnings: number;
  expenses: number;
};

// Mock data until the backend exposes a real earnings/expenses breakdown (Dependencies.docx §5,
// Rides/RideOffers). "Expenses" here means platform commission + est. fuel cost per ride, not a
// literal ledger yet. Profit per bucket = earnings - expenses.
const FINANCE_DATA: Record<Period, FinanceBucket[]> = {
  daily: [
    { label: "Mon", earnings: 62, expenses: 18 },
    { label: "Tue", earnings: 78, expenses: 22 },
    { label: "Wed", earnings: 95, expenses: 27 },
    { label: "Thu", earnings: 81, expenses: 24 },
    { label: "Fri", earnings: 142, expenses: 38 },
    { label: "Sat", earnings: 54, expenses: 16 },
    { label: "Sun", earnings: 31, expenses: 10 },
  ],
  weekly: [
    { label: "W1", earnings: 412, expenses: 118 },
    { label: "W2", earnings: 486, expenses: 137 },
    { label: "W3", earnings: 398, expenses: 109 },
    { label: "W4", earnings: 543, expenses: 152 },
  ],
  monthly: [
    { label: "Mar", earnings: 1840, expenses: 512 },
    { label: "Apr", earnings: 1960, expenses: 548 },
    { label: "May", earnings: 2110, expenses: 601 },
    { label: "Jun", earnings: 1780, expenses: 496 },
    { label: "Jul", earnings: 2340, expenses: 655 },
    { label: "Aug", earnings: 2205, expenses: 612 },
  ],
};

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

function FinanceChart({ data }: { data: FinanceBucket[] }) {
  const buckets = useMemo(
    () => data.map((bucket) => ({ ...bucket, profit: bucket.earnings - bucket.expenses })),
    [data],
  );
  const maxValue = Math.max(1, ...buckets.map((b) => Math.max(b.profit, b.expenses)));

  return (
    <View className="gap-stack-sm">
      <View className="flex-row items-center gap-stack-md">
        <View className="flex-row items-center gap-2">
          <View className="h-3 w-3 rounded-full bg-primary" />
          <Text className="font-label-sm text-label-sm text-on-surface-variant">Profit</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="h-3 w-3 rounded-full bg-rose-400" />
          <Text className="font-label-sm text-label-sm text-on-surface-variant">Expenses</Text>
        </View>
      </View>

      <View className="h-[220px] flex-row items-end justify-between gap-2 border-b border-outline-variant/20 pb-8">
        {buckets.map((bucket) => (
          <View key={bucket.label} className="h-full flex-1 items-center justify-end gap-1">
            <View className="w-full flex-1 flex-row items-end justify-center gap-1">
              <View
                className="w-full max-w-[14px] rounded-t-md bg-primary"
                style={{ height: `${Math.max(4, (bucket.profit / maxValue) * 100)}%` }}
              />
              <View
                className="w-full max-w-[14px] rounded-t-md bg-rose-400"
                style={{ height: `${Math.max(4, (bucket.expenses / maxValue) * 100)}%` }}
              />
            </View>
            <Text className="mt-1 font-label-sm text-[11px] text-on-surface-variant">
              {bucket.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function DriverEarningsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const openDrawer = useOpenDrawer();
  const [period, setPeriod] = useState<Period>("daily");

  const buckets = FINANCE_DATA[period];
  const totals = useMemo(() => {
    const earnings = buckets.reduce((sum, b) => sum + b.earnings, 0);
    const expenses = buckets.reduce((sum, b) => sum + b.expenses, 0);
    return { earnings, expenses, profit: earnings - expenses };
  }, [buckets]);

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="z-40 w-full bg-surface shadow-sm">
        <View className="w-full flex-row items-center justify-between px-container-margin py-base">
          <Pressable
            onPress={openDrawer}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="menu" size={24} color={themeColors.primary} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Driver Portal
          </Text>
          <Pressable
            onPress={() => router.push("/(driver)/(drawer)/notifications")}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="notifications" size={24} color={themeColors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-4xl gap-gutter px-container-margin pb-32 pt-stack-md"
      >
        {/* Fixed: this toggle's active-segment className used to be interpolated into a template
            literal -- the same NativeWind runtime anti-pattern root-caused on login.tsx's
            phone/email toggle. Both classNames below are now static; the active-dependent
            background/color/weight moves to a plain `style` prop instead, same fix as
            @/components/login-method-toggle.tsx's activeSegmentStyle. */}
        <View className="flex-row gap-2 rounded-full bg-surface-container-highest p-1">
          {PERIOD_OPTIONS.map((option) => {
            const active = option.key === period;
            return (
              <Pressable
                key={option.key}
                onPress={() => setPeriod(option.key)}
                className="flex-1 items-center rounded-full py-2"
                style={active ? { backgroundColor: themeColors.primary } : undefined}
              >
                <Text
                  className="font-label-sm text-label-sm"
                  style={{
                    color: active ? themeColors.onPrimary : themeColors.onSurfaceVariant,
                    fontWeight: active ? "700" : undefined,
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row gap-gutter">
          <View className="flex-1 gap-2 rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm">
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                <MaterialIcons name="trending-up" size={16} color="#047857" />
              </View>
              <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Profit
              </Text>
            </View>
            <Text className="font-fare-display text-fare-display text-on-surface">
              {formatCurrency(totals.profit)}
            </Text>
          </View>

          <View className="flex-1 gap-2 rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm">
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-rose-50">
                <MaterialIcons name="trending-down" size={16} color="#be123c" />
              </View>
              <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Expenses
              </Text>
            </View>
            <Text className="font-fare-display text-fare-display text-on-surface">
              {formatCurrency(totals.expenses)}
            </Text>
          </View>
        </View>

        <View className="gap-stack-md rounded-xl border border-outline-variant/30 bg-white p-stack-md shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              {PERIOD_OPTIONS.find((o) => o.key === period)?.label} Overview
            </Text>
            {/* "View Details" -> History (drawer): that screen already lists the ride-by-ride
                breakdown behind these totals -- a separate ledger screen here would just
                duplicate it. */}
            <Pressable
              onPress={() => router.push("/(driver)/(drawer)/history")}
              className="flex-row items-center gap-1"
            >
              <Text className="font-label-sm text-label-sm text-primary">View Details</Text>
              <MaterialIcons name="arrow-forward" size={14} color={themeColors.primary} />
            </Pressable>
          </View>

          <FinanceChart data={buckets} />
        </View>

        <View className="flex-row gap-gutter">
          <View className="flex-1 items-center gap-1 rounded-xl border border-outline-variant/30 bg-white p-stack-sm shadow-sm">
            <MaterialIcons name="payments" size={16} color="#1d4ed8" />
            <Text className="font-fare-display text-[16px] text-on-surface">
              {formatCurrency(84.5)}
            </Text>
            <Text className="text-center font-label-sm text-[10px] uppercase text-on-surface-variant">
              Today
            </Text>
          </View>
          <View className="flex-1 items-center gap-1 rounded-xl border border-outline-variant/30 bg-white p-stack-sm shadow-sm">
            <MaterialIcons name="schedule" size={16} color="#1d4ed8" />
            <Text className="font-fare-display text-[16px] text-on-surface">5h 22m</Text>
            <Text className="text-center font-label-sm text-[10px] uppercase text-on-surface-variant">
              Online Time
            </Text>
          </View>
          <View className="flex-1 items-center gap-1 rounded-xl border border-outline-variant/30 bg-white p-stack-sm shadow-sm">
            <MaterialIcons name="check-circle" size={16} color="#7e22ce" />
            <Text className="font-fare-display text-[16px] text-on-surface">12</Text>
            <Text className="text-center font-label-sm text-[10px] uppercase text-on-surface-variant">
              Rides
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
