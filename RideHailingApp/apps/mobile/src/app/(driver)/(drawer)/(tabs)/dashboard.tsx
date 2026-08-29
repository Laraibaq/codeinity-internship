import { useEffect, useRef, useState } from "react";
import { Image, LayoutAnimation, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { formatCurrency } from "@/utils/currency";
import { RideRequestCard, type RideRequest } from "@/components/ride-request-card";

type DriverStatus = "online" | "offline";
type OnlineView = "searching" | "no-requests";

// Mock pool for the "DEV: Simulate Request" button below -- cycled through so multiple simultaneous
// requests (the whole point of Part 1's inline-card row) look distinct from each other rather than
// all being the same passenger repeated. Same fictitious ride data ("Sarah J.", Pier 39 dropoff)
// already used elsewhere in this flow (was ride-request-notification.tsx's), plus two more variants.
const SAMPLE_REQUESTS: Omit<RideRequest, "id">[] = [
  {
    name: "Sarah J.",
    rating: 4.9,
    offer: 15,
    pickupLabel: "1450 Market Street",
    pickupMeta: "2 min (0.8 mi)",
    dropoffLabel: "Pier 39, Fisherman's Wharf",
    dropoffMeta: "12 min (3.2 mi)",
    totalMinutes: 14,
    ratePerMin: 1.07,
  },
  {
    name: "Marcus T.",
    rating: 4.7,
    offer: 22,
    pickupLabel: "Union Square",
    pickupMeta: "4 min (1.5 mi)",
    dropoffLabel: "SFO Terminal 2",
    dropoffMeta: "22 min (14.1 mi)",
    totalMinutes: 26,
    ratePerMin: 0.85,
  },
  {
    name: "Priya K.",
    rating: 5.0,
    offer: 11,
    pickupLabel: "Golden Gate Park",
    pickupMeta: "3 min (1.1 mi)",
    dropoffLabel: "Painted Ladies",
    dropoffMeta: "9 min (2.4 mi)",
    totalMinutes: 12,
    ratePerMin: 0.92,
  },
];

// This screen merges two separate source mockups ("Driver Home - Online" and "Driver Home -
// Offline") into one stateful screen, per this batch's Part 1 instructions. `status` drives which
// source's layout renders; each branch below reproduces its own source as literally as possible
// rather than trying to unify them into one shared visual, since the two sources don't agree on
// header, chrome, or even whether a header exists at all (see header note below).
//
// Reset-to-"online" from ride-completed.tsx: passed via the `status` route param rather than a new
// global store -- this is the only cross-screen state this flow needs, and expo-router params are
// already the mechanism `verification-status.tsx`'s "Go Online" button uses (see that file), so a
// second mechanism (context/zustand/etc.) would be redundant for a single boolean. The `status`
// param/useEffect mechanism below is still needed for those two external callers even though this
// screen's own buttons no longer use it (see next paragraph).
//
// Fixed: this screen's own "Go Online"/"Go Offline" buttons used to open a confirmation modal
// (go-online-confirm.tsx / go-offline-confirm.tsx) instead of flipping `status` directly -- both
// screens have been deleted entirely per explicit instruction (a pure UX simplification, confirmed
// unrelated to an earlier, separate native-crash investigation that also touched those two files).
// Both buttons below now call `setStatus` directly, cross-fading via the same
// `LayoutAnimation.easeInEaseOut` the `status`-param effect below already used.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("power_settings_new", "my_location", "arrow_back") verified against the installed glyph map.
// - The desktop-only header (`hidden md:flex`, online source's "Indigo Motion" branding bar) is
//   dropped entirely: always below the `md:` breakpoint on a native phone screen, same treatment as
//   every other screen in this project with a mobile/desktop split. Its absence means the "online"
//   branch below has NO header at all on mobile, exactly as its source has none outside that
//   desktop bar.
// - The offline source's dimmed/blurred map layer (`bg-surface-variant/50 backdrop-blur-sm` over a
//   background image) uses `expo-blur`'s <BlurView>, same substitution pattern used elsewhere in
//   this project for backdrop-blur-over-real-content.
// - `radar-pulse` (driver marker ping), `animate-bounce` (searching-overlay icon), and `.shimmer`
//   (searching-overlay sheen sweep) have no equivalent without introducing `react-native-reanimated`
//   animation code beyond a mechanical conversion; each renders in its static resting frame, per
//   rule 3's "closest RN pattern" fallback.
// - `hover:*` / `transition-*` / `duration-*` dropped throughout: no hover state on touch devices.
//
// Header fixed, not kept literal (per explicit correction -- same copy-paste-artifact pattern
// already fixed on forgot-password.tsx/verify-phone.tsx): the offline source's header title reads
// "Driver Registration", which also incorrectly appears on this batch's Counter Offer source,
// indicating a copy-pasted header template rather than an intentional label for either screen.
// Replaced with "Driver Portal" -- the online branch above has no header at all to match (dropped
// entirely, see above), so this instead matches earnings.tsx/account.tsx's header title, the
// majority convention among this screen's 3 sibling tabs.
//
// The back-arrow icon itself is still kept literal and left unwired (no onPress): this is a TAB
// ROOT screen with no real back destination, and guessing at a `router.back()` here could pop out
// of the tab navigator into an unrelated screen -- a worse outcome than a dead button.
//
// Dev-only placeholders (flagged for removal): the "Simulate Request" and "Simulate No Requests"
// buttons below only exist because this app has no real-time transport wired up yet. Per
// Dependencies.docx §6, incoming ride requests should arrive over a Socket.IO `ride:new-request`
// event; once that listener (and whatever decides there's nothing nearby) exists, it should drive
// `requests`/`onlineView` itself, and both buttons should be deleted entirely.
//
// `onlineView` ('searching' | 'no-requests'), nested inside the "online" branch: this only controls
// which overlay shows when `requests` is empty. "Simulate Request" appends a mock request to
// `requests` (and flips `onlineView` back to "searching" in case it was on "no-requests") instead of
// opening the old ride-request-notification.tsx popup, since Part 1 retired that screen in favor of
// inline cards. "Simulate No Requests" now clears `requests` and flips `onlineView` to "no-requests",
// preserving that richer empty state (heatmap zones, "Navigate to hotspot") as still reachable rather
// than deleting it outright.
//
// Fixed (Part 1): incoming requests used to open ride-request-notification.tsx as a
// transparentModal, with a further push to ride-request-detail.tsx on tapping the card. Both screens
// have been deleted entirely -- their content (passenger, rating, offer, pickup/dropoff, Accept/
// Counter/Reject) now renders as `RideRequestCard`s directly on this screen, directly below the
// ONLINE/Go Offline bar. Tapping a card does nothing, per explicit instruction; only its three
// buttons act. Multiple requests can be visible at once, which is the reason `requests` is an array
// instead of the old single-request-at-a-time modal.
//
// Fixed: the cards used to render as a small wrap/shrink row (two ~48%-width boxes per row). Per
// explicit instruction they're now a full-width vertical list instead, one below another inside a
// ScrollView -- matching the row style the now-deleted nearby-requests.tsx screen used (full-width
// card, spacious padding, timeline against the left border) -- so the list scrolls instead of
// wrapping once more requests arrive than fit on screen.
export default function DriverDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ status?: string; rejectedRequestId?: string }>();
  const [status, setStatus] = useState<DriverStatus>("offline");
  const [onlineView, setOnlineView] = useState<OnlineView>("searching");
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const nextSampleIndex = useRef(0);

  // Fixed: the online<->offline swap (and the nested searching<->no-requests swap below) used to
  // be an instant hard content-swap with zero feedback. Both now cross-fade via
  // `LayoutAnimation.easeInEaseOut` instead of popping instantly. This effect only fires for the
  // two external callers (verification-status.tsx, ride-completed.tsx) that still navigate here via
  // the `status` param; this screen's own Go Online/Go Offline buttons call `setStatus` directly
  // (see below) and don't round-trip through this param at all.
  useEffect(() => {
    if (params.status === "online" || params.status === "offline") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStatus(params.status);
    }
  }, [params.status]);

  // reject-reason.tsx reports back which card to remove via this param (same param-as-signal
  // mechanism as `status` above), since it's a separate pushed screen with no other way to reach
  // back into this screen's `requests` state once the driver submits a rejection reason.
  useEffect(() => {
    if (params.rejectedRequestId) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setRequests((current) => current.filter((request) => request.id !== params.rejectedRequestId));
    }
  }, [params.rejectedRequestId]);

  const handleSimulateRequest = () => {
    const sample = SAMPLE_REQUESTS[nextSampleIndex.current % SAMPLE_REQUESTS.length];
    nextSampleIndex.current += 1;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOnlineView("searching");
    setRequests((current) => [...current, { ...sample, id: `req-${Date.now()}-${current.length}` }]);
  };

  const handleSimulateNoRequests = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRequests([]);
    setOnlineView("no-requests");
  };

  if (status === "online") {
    return (
      <View className="flex-1 bg-surface">
        <View className="flex-1 bg-surface-container-low">
          <View style={{ paddingTop: 20 + insets.top }} className="px-container-margin">
            <View className="flex-row items-center justify-between rounded-full border border-outline-variant/20 bg-surface p-2 shadow-lg">
              <View className="flex-row items-center gap-3 px-4">
                <View className="h-3 w-3 rounded-full bg-green-500" />
                <Text className="font-label-sm text-label-sm tracking-wider text-green-700">
                  ONLINE
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setStatus("offline");
                }}
                className="flex-row items-center gap-2 rounded-full bg-surface-container px-4 py-2 active:scale-95"
              >
                <MaterialIcons name="power-settings-new" size={16} color={themeColors.onSurfaceVariant} />
                <Text className="font-label-sm text-label-sm text-on-surface-variant">Go Offline</Text>
              </Pressable>
            </View>
          </View>

          {requests.length > 0 ? (
            <ScrollView
              className="mt-3 flex-1"
              contentContainerClassName="gap-3 px-container-margin pb-4"
              showsVerticalScrollIndicator={false}
            >
              {requests.map((request) => (
                <RideRequestCard
                  key={request.id}
                  request={request}
                  onAccept={() => router.push("/(driver)/navigate-to-pickup")}
                  onCounter={() => router.push("/(driver)/counter-offer")}
                  onReject={() =>
                    router.push({
                      pathname: "/(driver)/reject-reason",
                      params: { requestId: request.id },
                    })
                  }
                />
              ))}
            </ScrollView>
          ) : onlineView === "searching" ? (
            <View className="flex-1 items-center justify-center px-container-margin">
              <View className="w-full max-w-sm items-center gap-2 rounded-2xl border border-outline-variant/30 bg-surface/90 px-6 py-4 shadow-lg">
                <MaterialIcons name="my-location" size={28} color={themeColors.primary} />
                <Text className="text-center font-body-md text-body-md text-on-surface">
                  Searching for requests...
                </Text>
                <Text className="text-center font-label-sm text-label-sm text-on-surface-variant opacity-70">
                  High demand in your area
                </Text>
              </View>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center px-container-margin">
              <View className="w-full max-w-md items-center rounded-xl border border-outline-variant bg-surface p-6 shadow-lg">
                  <View className="mb-stack-sm h-16 w-16 items-center justify-center rounded-full bg-surface-container-low">
                    <MaterialIcons name="search-off" size={36} color={themeColors.primary} />
                  </View>
                  <Text className="mb-2 text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                    No requests nearby
                  </Text>
                  <Text className="mb-stack-md max-w-[280px] text-center font-body-md text-body-md text-on-surface-variant">
                    It&apos;s quiet in this area right now. Head towards the highlighted zones for
                    better chances.
                  </Text>

                  <View className="w-full gap-stack-sm">
                    <Pressable className="w-full flex-row items-center justify-center gap-2 rounded-lg bg-primary py-4 shadow-sm active:scale-95">
                      <MaterialIcons name="navigation" size={18} color={themeColors.onPrimary} />
                      <Text className="font-label-sm text-label-sm text-on-primary">
                        Navigate to hotspot
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setOnlineView("searching");
                      }}
                      className="w-full items-center justify-center rounded-lg border border-outline-variant bg-transparent py-4 active:scale-95"
                    >
                      <Text className="font-label-sm text-label-sm text-on-surface">
                        Stay online and wait
                      </Text>
                    </Pressable>
                  </View>

                  <View className="mt-4 w-full flex-row items-center justify-between border-t border-outline-variant px-2 pt-4">
                    <Text className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                      Time Online
                    </Text>
                    <Text className="font-body-md text-body-md font-semibold text-on-surface">
                      1h 14m
                    </Text>
                  </View>
              </View>
            </View>
          )}

          <View
            style={{ paddingBottom: 16 + insets.bottom }}
            className="gap-2 px-container-margin pt-2"
          >
            <Pressable
              onPress={handleSimulateRequest}
              className="w-full items-center justify-center rounded-lg bg-primary py-3 shadow-sm active:scale-95"
            >
              <Text className="font-label-sm text-label-sm text-on-primary">
                DEV: Simulate Request
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSimulateNoRequests}
              className="w-full items-center justify-center rounded-lg border border-outline-variant bg-surface py-3 active:scale-95"
            >
              <Text className="font-label-sm text-label-sm text-on-surface">
                DEV: Simulate No Requests
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="w-full bg-surface shadow-sm">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin py-base">
          {/* TODO: unwired -- see header-mismatch note above. This is a tab root, not a pushed
              screen, so there's no sensible `router.back()` destination for this back arrow. */}
          <Pressable className="items-center justify-center rounded-full p-2 active:scale-95">
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
          </Pressable>
          {/* Fixed: see header note above. */}
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Driver Portal
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="relative flex-1">
        <View className="absolute inset-0 z-0 overflow-hidden bg-surface-variant/50">
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFyWmsppKp780nLLlL3AsgX2qtpTgOD1yJv761joNOqSnPBw6HRlT_ndHUdE8JrGlEI95RpLtYmz53Cko5COeKB4qYguYETwq9Uhp06DrwBph4bikKNamU4tNrTbQV-6ofR_9rWI1NlAuR3OqjDx2CI32zLY6Sy37zgynZFC2CIxoep3KV3UlVxZzAFVQVvVVdp9RwEwt4nd0qiZLmNTURNAakTjOxsTtSqaMH3MwArnGgEp8xqWJQ",
            }}
            resizeMode="cover"
            className="h-full w-full opacity-70"
          />
          <BlurView
            intensity={20}
            tint="light"
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View className="absolute inset-0 bg-surface/40" />
        </View>

        <View className="absolute inset-0 z-10 flex-col items-center justify-between pb-24">
          <View className="w-full max-w-md px-container-margin pt-stack-md">
            <View className="items-center gap-2 rounded-2xl border border-outline-variant bg-surface p-4 shadow-lg">
              <View className="flex-row items-center gap-2 rounded-full bg-surface-container-highest px-4 py-1">
                <View className="h-2 w-2 rounded-full bg-outline" />
                <Text className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Offline
                </Text>
              </View>
              <View className="items-center">
                <Text className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Today&apos;s Earnings
                </Text>
                <Text className="font-display-lg text-display-lg text-on-surface">
                  {formatCurrency(0)}
                </Text>
              </View>
            </View>
          </View>

          <View className="w-full max-w-md px-container-margin pb-stack-md">
            <Pressable
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setStatus("online");
              }}
              className="w-full flex-row items-center justify-center gap-3 rounded-xl bg-primary py-4 shadow-sm active:scale-[0.98]"
            >
              <MaterialIcons name="power-settings-new" size={24} color={themeColors.onPrimary} />
              <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-primary">
                Go Online
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
