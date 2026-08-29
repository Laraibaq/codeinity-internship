import { useEffect, useState } from "react";
import { Image, LayoutAnimation, Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";
import { formatCurrency } from "@/utils/currency";

type DriverStatus = "online" | "offline";
type OnlineView = "searching" | "no-requests";

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
// `onlineView` itself, and both buttons should be deleted entirely.
//
// `onlineView` ('searching' | 'no-requests'), nested inside the "online" branch: the source for
// "No Ride Requests" is its own full mockup with its own header (menu/"Online"/account_circle) and
// its own copy of the map + heatmap layer, rather than an overlay meant to sit inside the existing
// "searching" chrome. Reproducing that whole second header+map treatment literally would mean the
// header/ONLINE-pill/nearby-requests-badge popping in and out every time this nested state toggles,
// which is worse than the fidelity loss: unlike the top-level online/offline split (two screens a
// driver deliberately navigates between via a real action), these are two moments within one
// continuous online session, so they share one persistent shell (map, driver marker, ONLINE pill +
// Go Offline, nearby-requests badge) the same way every (tabs) screen shares one Tabs-provided
// bottom bar instead of each reproducing its own. Only the overlay content -- the searching card
// vs. the empty-state card -- is what actually swaps.
export default function DriverDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ status?: string }>();
  const [status, setStatus] = useState<DriverStatus>("offline");
  const [onlineView, setOnlineView] = useState<OnlineView>("searching");

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

  if (status === "online") {
    return (
      <View className="flex-1 bg-surface">
        <View className="relative flex-1 overflow-hidden bg-surface-container-low">
          {/* Fixed: this used to be a static street-map <Image> filling the whole screen. Removed
              entirely per explicit instruction, replaced with nothing but this View's own flat
              `bg-surface-container-low` fill (already a design token, so no extra layer is needed).
              The driver-marker dot and (in the "no-requests" branch below) the decorative heatmap
              blobs were originally map-relative annotations; their own removal wasn't asked for, so
              they're left in place -- they now read as plain floating decoration on a flat
              background rather than map pins, which may not be the intended look. Flagging in case
              those should come out too. */}
          <View className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary shadow-lg">
              <MaterialIcons name="directions-car" size={14} color="#ffffff" />
            </View>
          </View>

          {/* Fixed (global safe-area audit): was pinned at a fixed `top-container-margin` (20px),
              which sat under the status bar/notch on real devices -- offset by `insets.top` too. */}
          <View
            style={{ top: 20 + insets.top }}
            className="absolute left-container-margin right-container-margin z-40"
          >
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

          {/* New addition, not from either source (explicitly authorized, unlike this project's
              usual "flag, don't add" default): nothing links to nearby-requests.tsx otherwise, so
              a small floating badge button was added here, below the ONLINE pill bar so it doesn't
              collide with it, matching this project's existing FAB style (e.g.
              navigate-to-pickup.tsx's right-side buttons). The "3" badge is a static placeholder
              matching nearby-requests.tsx's initial mock list length -- no shared state exists to
              keep it live in sync with that screen's own local list. */}
          <View style={{ top: 96 + insets.top }} className="absolute right-container-margin z-40">
            <Pressable
              onPress={() => router.push("/(driver)/nearby-requests")}
              className="h-12 w-12 items-center justify-center rounded-full bg-surface shadow-lg active:scale-95"
            >
              <MaterialIcons name="list-alt" size={22} color={themeColors.primary} />
            </Pressable>
            <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-error">
              <Text className="font-label-sm text-[10px] text-on-error">3</Text>
            </View>
          </View>

          {onlineView === "searching" ? (
            <>
              {/* Fixed: this card used to sit near the bottom (`absolute bottom-24`). Recentered
                  vertically per explicit instruction, "same centering approach as
                  forgot-password.tsx's content." That file's own header comment says its
                  flexGrow/justifyContent:'center' centering was deliberately REMOVED in an earlier,
                  separate pass (reverted back to natural top-of-screen flow at explicit request) --
                  so there's no longer a live example of that pattern to copy verbatim from that
                  file. Flagging this discrepancy rather than silently guessing. What's implemented
                  here is the same underlying idea (flex-centering within the available space) applied
                  directly: this card isn't inside a ScrollView at all (it's an absolutely-positioned
                  overlay, not scrollable document content), so instead of a ScrollView's
                  contentContainerStyle flexGrow+justifyContent:'center', an
                  `absolute inset-0 justify-center items-center` wrapper achieves the equivalent
                  centering-within-the-full-available-space for this non-scrolling case. */}
              <View
                className="absolute inset-0 z-30 items-center justify-center px-container-margin"
                pointerEvents="none"
              >
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

              {/* Dev-only: stand-in for a live `ride:new-request` push (Dependencies.docx §6).
                  Delete this button once that Socket.IO listener is wired up to open the modal
                  itself. */}
              <View className="absolute bottom-6 left-0 right-0 z-30 flex-row justify-center gap-2 px-container-margin">
                <Pressable
                  onPress={() => router.push("/(driver)/ride-request-notification")}
                  className="flex-row items-center gap-2 rounded-full border-2 border-dashed border-amber-500 bg-amber-100 px-4 py-2 active:scale-95"
                >
                  <MaterialIcons name="bug-report" size={16} color="#92400e" />
                  <Text className="font-label-sm text-label-sm text-amber-900">
                    DEV: Simulate Request
                  </Text>
                </Pressable>
                {/* Dev-only: stand-in for whatever backend logic eventually decides there's
                    nothing nearby. Delete once that exists. */}
                <Pressable
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setOnlineView("no-requests");
                  }}
                  className="flex-row items-center gap-2 rounded-full border-2 border-dashed border-amber-500 bg-amber-100 px-4 py-2 active:scale-95"
                >
                  <MaterialIcons name="bug-report" size={16} color="#92400e" />
                  <Text className="font-label-sm text-label-sm text-amber-900">
                    DEV: Simulate No Requests
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View className="absolute inset-0 z-30" pointerEvents="box-none">
              {/* Heatmap blobs: decorative only (rule 5, UI shell only) -- "highlighted zones" is a
                  future AI/hotspot feature per Features_and_MVP.docx §4, not real data. The
                  source's `filter: blur(40px)` + `mix-blend-mode: multiply` have no RN equivalent;
                  substituted with plain low-opacity color circles, no blend mode. */}
              <View
                className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-error-container opacity-30"
                pointerEvents="none"
              />
              <View
                className="absolute bottom-1/3 right-1/4 h-96 w-96 rounded-full bg-primary-fixed-dim opacity-30"
                pointerEvents="none"
              />
              <View
                className="absolute left-2/3 top-1/2 h-48 w-48 rounded-full bg-secondary-container opacity-30"
                pointerEvents="none"
              />

              <View style={{ marginTop: 96 + insets.top }} className="items-center px-container-margin">
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
                    {/* TODO: hotspot/heatmap logic is a future AI feature (Features_and_MVP.docx
                        §4) -- not built yet. */}
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
            </View>
          )}
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
