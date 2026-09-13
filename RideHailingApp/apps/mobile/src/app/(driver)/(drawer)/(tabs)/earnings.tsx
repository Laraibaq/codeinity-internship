import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { useOpenDrawer } from "@/hooks/use-open-drawer";
import { useDriverEarnings } from "@/hooks/use-ride-history";
import { useDriverNotifications } from "@/hooks/use-notifications";
import { formatCurrency } from "@/utils/currency";

type Period = "daily" | "weekly" | "monthly";

type FinanceBucket = {
  label: string;
  earnings: number;
  expenses: number;
};

// Fallback skeleton buckets until backend data resolves
const FINANCE_DATA: Record<Period, FinanceBucket[]> = {
  daily: [
    { label: "Mon", earnings: 0, expenses: 0 },
    { label: "Tue", earnings: 0, expenses: 0 },
    { label: "Wed", earnings: 0, expenses: 0 },
    { label: "Thu", earnings: 0, expenses: 0 },
    { label: "Fri", earnings: 0, expenses: 0 },
    { label: "Sat", earnings: 0, expenses: 0 },
    { label: "Sun", earnings: 0, expenses: 0 },
  ],
  weekly: [
    { label: "W1", earnings: 0, expenses: 0 },
    { label: "W2", earnings: 0, expenses: 0 },
    { label: "W3", earnings: 0, expenses: 0 },
    { label: "W4", earnings: 0, expenses: 0 },
  ],
  monthly: [
    { label: "Jan", earnings: 0, expenses: 0 },
    { label: "Feb", earnings: 0, expenses: 0 },
    { label: "Mar", earnings: 0, expenses: 0 },
    { label: "Apr", earnings: 0, expenses: 0 },
    { label: "May", earnings: 0, expenses: 0 },
    { label: "Jun", earnings: 0, expenses: 0 },
  ],
};

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

function FinanceChart({ data }: { data: FinanceBucket[] }) {
  const buckets = useMemo(
    () => data.map((bucket) => ({ ...bucket, profit: Math.max(0, bucket.earnings - bucket.expenses) })),
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
                style={{
                  height:
                    bucket.profit > 0 ? `${Math.max(4, (bucket.profit / maxValue) * 100)}%` : "0%",
                }}
              />
              <View
                className="w-full max-w-[14px] rounded-t-md bg-rose-400"
                style={{
                  height:
                    bucket.expenses > 0
                      ? `${Math.max(4, (bucket.expenses / maxValue) * 100)}%`
                      : "0%",
                }}
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

  const { data: earningsData } = useDriverEarnings();
  const { data: notificationsData } = useDriverNotifications();
  const unreadCount = notificationsData?.unreadCount ?? 0;

  const buckets: FinanceBucket[] = useMemo(() => {
    if (!earningsData) return FINANCE_DATA[period];
    if (period === "daily") return earningsData.dailyBreakdown;
    if (period === "weekly") return earningsData.weeklyBreakdown;
    return earningsData.monthlyBreakdown;
  }, [earningsData, period]);

  const totals = useMemo(() => {
    const earnings = buckets.reduce((sum, b) => sum + b.earnings, 0);
    const expenses = buckets.reduce((sum, b) => sum + b.expenses, 0);
    return {
      earnings,
      expenses,
      profit: Number(Math.max(0, earnings - expenses).toFixed(2)),
    };
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
            className="relative items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="notifications" size={24} color={themeColors.primary} />
            {unreadCount > 0 ? (
              <View className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
            ) : null}
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
              {formatCurrency(earningsData?.today ?? 0)}
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
            <Text className="font-fare-display text-[16px] text-on-surface">
              {earningsData?.completedRidesCount ?? 0}
            </Text>
            <Text className="text-center font-label-sm text-[10px] uppercase text-on-surface-variant">
              Rides
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
