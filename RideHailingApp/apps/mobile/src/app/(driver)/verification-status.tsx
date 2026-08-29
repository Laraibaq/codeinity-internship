import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  LayoutAnimation,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

type VerificationState = "review" | "pending" | "rejected" | "resubmit" | "approved";

// Fixed: every `state` transition here used to be an instant hard content-swap with zero feedback.
// "Submit for Verification" now shows a brief loading state (disabled button, spinner +
// "Submitting...") before transitioning, standing in for the real API call that doesn't exist yet
// (see handleSubmitForVerification's TODO). Every transition -- including the ones with no
// "submission" to wait on (rejected -> resubmit, and the pending -> approved DEV button) -- now
// cross-fades via `LayoutAnimation.easeInEaseOut` instead of popping instantly; see `goToState`.

// Fixed (global safe-area audit): this screen's headers (review/pending/resubmit states) were the
// confirmed case of header text overlapping the status bar/clock -- each now carries top-safe-area
// padding via `useSafeAreaInsets()`. See _layout.tsx's header comment for why this became
// necessary. The "rejected"/"approved" states have no header at all (by design, same reasoning as
// ride-completed.tsx's terminal states), so nothing to fix there.

// This single screen renders three source mockups ("Document Review", "Documents Submitted",
// "Verification Approved") as one component switching on local state, per your instruction.
// `?status=` is read once on mount via useLocalSearchParams purely as a dev preview convenience
// (e.g. /verification-status?status=approved) -- it seeds the initial state but doesn't keep the
// screen in sync with later URL changes, since nothing here re-navigates with a new query string
// after mount.
//
// Rule 3 substitutions used across all three states:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this batch. "id_card" (the
//   Driver's License row) has no equivalent in the classic Material Icons font; substituted with
//   "credit-card" (distinct from "badge", already used for the Identity Verification row above it,
//   so the two rows stay visually distinguishable). All other glyphs ("task_alt", "badge",
//   "directions_car", "account_circle", "check_circle", "arrow_forward", "arrow_back",
//   "arrow_back_ios_new", "drive_file_rename_outline") verified against the installed glyph map.
// - `.slide-up`/`.stagger-*` entrance animations (Document Review's cards), the SVG stroke-draw
//   checkmark animation (Documents Submitted), and the `animate-pop-in`/`animate-pulse-glow`/
//   `animate-[ping_...]`/confetti-burst `<script>` (Verification Approved) all have no RN
//   equivalent without adding an animation library (Reanimated/Skia, not installed for this); per
//   rule 5, dropped -- everything renders in its final, settled-in state with no animation.
// - Documents Submitted's and Verification Approved's blurred ambient background circles
//   (`blur-[100px]`/`blur-[80px]`) are flattened to plain static-color circles, same policy as
//   every other decorative blurred blob dropped elsewhere in this project (e.g.
//   onboarding-earnings.tsx, reset-password.tsx).
// - Verification Approved's repeating radial-gradient dot-grid background pattern has no RN
//   equivalent without a tiled image asset; dropped as purely decorative.
// - Verification Approved's confetti-burst `<script>` (a canvas/DOM particle animation) has no RN
//   equivalent without a dedicated library; dropped entirely, no substitute animation added.
// - Verification Approved's two "sparkle" icons next to the success badge are
//   "arrow_back_ios_new" and "drive_file_rename_outline" -- a back-chevron and an edit-pencil icon,
//   neither of which reads as a "sparkle." This looks like a mockup authoring mistake (rule 4: flag
//   rather than fix), so they're rendered literally as specified rather than swapped for a more
//   sensible decorative icon.
// - Document Review's fixed bottom action bar (`bg-surface/90 backdrop-blur-md`) uses this
//   project's established `.glass-panel` pattern, substituted with expo-blur's `<BlurView>`.
// - The two document-review thumbnails (a vehicle photo and a profile photo) are CSS
//   `background-image` divs, not `<img>` tags; translated to Image components anyway per rule 2,
//   since they function as images in the layout.
// - The four "review" state Edit buttons use `router.push` (not `router.back()`) to their
//   respective originating screens (register-identity-document, register-license-details,
//   register-vehicle-type, register-profile-photo). `push` was chosen deliberately: this screen is
//   reached by pushing forward through the whole registration flow, so there's no guarantee a
//   back-stack path to any specific one of these screens exists from here. The Vehicle Details row's
//   Edit button used to go to register-vehicle-info.tsx, which has since been deleted (removed from
//   the registration flow, its Year of Manufacture field moved into register-vehicle-model.tsx) --
//   now points at register-vehicle-type.tsx, the first screen of the vehicle section.
//
// State machine expanded from 3 to 5 states. The old "submitted" state and its content are gone,
// replaced entirely by the richer "pending" state below (source: "Verification Pending"); "review"
// and "approved" are otherwise unchanged in content (approved deliberately left untouched -- see
// this task's chat response for why the newer "Verification Success" source wasn't merged in).
//
// Rule 3 substitutions used in the new "pending"/"rejected"/"resubmit" states:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon used
//   ("hourglass_empty", "badge", "assignment_ind", "account_balance", "schedule", "pin",
//   "description", "security", "lock", "map", "account_balance_wallet", "route", "insights",
//   "dashboard", "payments", "history", "person", "error", "close", "upload_file",
//   "assignment_return", "directions_car", "upload") was verified directly against the installed
//   glyph map -- no substitutions were needed this time.
// - Verification Pending's header has a `hidden md:flex` desktop nav (Dashboard/Earnings/Trips/
//   Account) as a *second* header child alongside the back-button+title block. Since this is a
//   native phone screen (always below `md:`), that desktop nav is dropped entirely, leaving the
//   header as just the left-packed back button + title (no trailing spacer here, since the source
//   itself has nothing balancing the other side once the desktop nav is removed -- unlike this
//   screen's other states, which do have a title-centering spacer).
// - The banner's `.shimmer` sweep and the hourglass icon's `animate-pulse` have no RN equivalent
//   without Reanimated (not installed); dropped per rule 5, banner renders static.
// - `grid grid-cols-1 md:grid-cols-2` (Profile Summary / Vehicle Summary cards) resolves to a
//   single stacked column on a native phone screen (always below `md:`) -- same substitution used
//   throughout this project for this exact grid pattern.
// - The Vehicle Summary card's `bg-gradient-to-t from-surface to-transparent` image fade is a real,
//   load-bearing gradient (it's what keeps the overlaid "2023 Toyota Camry" text legible against the
//   photo), so -- consistent with welcome.tsx's and register-vehicle-color.tsx's precedent --
//   substituted with a real `<LinearGradient>` rather than flattened.
// - The "Locked Features" glassmorphism overlay (`bg-surface/60 backdrop-blur-sm`) blurs *real
//   mock content sitting behind it*, which is the reverse of every other BlurView use in this
//   project so far (elsewhere, the blur sits behind a floating card's content, blurring the page
//   background). To actually blur the mock feature tiles, they're rendered first in the JSX
//   (normal, unblurred paint order), then the BlurView + a semi-transparent surface-tinted scrim +
//   the lock icon/copy are layered on top via `position: absolute`, matching RN's paint-order rule
//   that later siblings render on top.
// - The 2x2 "locked" mock-feature tiles (`grid-cols-2 md:grid-cols-4`, unconditional 2-column base
//   state on mobile) are plain non-interactive Views (the source itself marks them `select-none`
//   and dims them to `opacity-30` as inert preview content, not real buttons) -- not Pressables.
// - The "pending" state's mobile bottom nav bar (Dashboard/Earnings/Trips/Account) was originally
//   kept for visual fidelity (rule 1), back when this project had no tab navigator yet for the
//   post-verification driver app. Removed now, per explicit correction: this screen is a Stack
//   screen outside the real (tabs) group (reached via push from account.tsx), so this bar was fake
//   chrome that partially looked tappable (Dashboard/Account were enabled Pressables, just going
//   nowhere) without doing anything real -- the same category of issue already fixed on
//   safety-center.tsx, and worse than having no bottom bar at all.
// - Verification Rejected's card has no TopAppBar/back arrow at all in the source (unlike every
//   other state except approved) -- reproduced literally with no header.
// - Both "rejected" and "resubmit"'s "Contact Support" links have no destination in the source
//   (`href="#"`) -- left as inert Pressables/Text with a TODO comment, not a guessed destination.
// - Resubmit Documents' left accent strip on each failed-item card (`absolute left-0 top-0
//   bottom-0 w-1 bg-error`) is a plain absolutely-positioned View, no CSS involved.
// - Resubmit Documents' "Upload Again" buttons are inert Pressables per explicit instruction --
//   NOT wired to `upload-failed.tsx`, which is a separate, unrelated trigger for later real upload
//   failures, not a destination for this placeholder button.

export default function DriverVerificationStatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status } = useLocalSearchParams<{ status?: string }>();
  const initialState: VerificationState =
    status === "pending" || status === "rejected" || status === "resubmit" || status === "approved"
      ? status
      : "review";
  const [state, setState] = useState<VerificationState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cross-fades between this screen's states instead of an instant hard swap. Every `setState`
  // call below that changes `state` goes through this so the transition is consistently animated,
  // not just the "Submit for Verification" one this was first reported on.
  const goToState = (next: VerificationState) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setState(next);
  };

  const handleSubmitForVerification = () => {
    setIsSubmitting(true);
    // TODO: this delay is a placeholder standing in for the real verification-submission API
    // call. Remove the setTimeout once that exists -- the loading-state UX below (disabled
    // button, spinner, "Submitting...") should stay and just react to the real request instead.
    setTimeout(() => {
      setIsSubmitting(false);
      goToState("pending");
    }, 900);
  };

  return (
    <View className="flex-1 bg-background">
      {state === "review" ? (
        <View style={{ paddingTop: insets.top }} className="w-full bg-surface">
          <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
            <Pressable
              onPress={() => router.back()}
              className="items-center justify-center rounded-full p-2 active:scale-95"
            >
              <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurfaceVariant} />
            </Pressable>
            <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
              Driver Registration
            </Text>
            <View className="w-10" />
          </View>
        </View>
      ) : null}

      {state === "review" ? (
        <>
          <ScrollView className="flex-1" contentContainerClassName="px-container-margin pb-32 pt-stack-sm">
            <View className="mx-auto w-full max-w-[400px]">
              <View className="mb-stack-md items-center">
                <View className="mb-stack-sm h-16 w-16 items-center justify-center rounded-full bg-primary-container">
                  <MaterialIcons name="task-alt" size={30} color={themeColors.onPrimaryContainer} />
                </View>
                <Text className="mb-base text-center font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">
                  Review Documents
                </Text>
                <Text className="text-center font-body-md text-body-md text-on-surface-variant">
                  Please ensure all uploaded information is correct before submitting your
                  profile for verification.
                </Text>
              </View>

              <View className="gap-stack-sm">
                <View className="gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-low">
                        <MaterialIcons name="badge" size={20} color={themeColors.primary} />
                      </View>
                      <View>
                        <Text className="font-body-md text-body-md font-semibold text-on-surface">
                          Identity Verification
                        </Text>
                        <View className="mt-1 flex-row items-center gap-1">
                          <View className="rounded-full bg-emerald-50 px-2 py-0.5">
                            <Text className="text-[10px] font-bold tracking-wider text-emerald-700">
                              COMPLETED
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => router.push("/(driver-auth)/register-identity-document")}
                      className="rounded-md px-3 py-1.5"
                    >
                      <Text className="font-label-sm text-label-sm uppercase text-primary">
                        Edit
                      </Text>
                    </Pressable>
                  </View>
                  <View className="pl-[52px]">
                    <Text className="text-sm text-on-surface-variant">Government Issued ID</Text>
                    <Text className="mt-0.5 text-xs text-outline">
                      Uploaded 2 hours ago • ID-Front.jpg, ID-Back.jpg
                    </Text>
                  </View>
                </View>

                <View className="gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-low">
                        <MaterialIcons name="credit-card" size={20} color={themeColors.primary} />
                      </View>
                      <View>
                        <Text className="font-body-md text-body-md font-semibold text-on-surface">
                          Driver&apos;s License
                        </Text>
                        <View className="mt-1 flex-row items-center gap-1">
                          <View className="rounded-full bg-emerald-50 px-2 py-0.5">
                            <Text className="text-[10px] font-bold tracking-wider text-emerald-700">
                              COMPLETED
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => router.push("/(driver-auth)/register-license-details")}
                      className="rounded-md px-3 py-1.5"
                    >
                      <Text className="font-label-sm text-label-sm uppercase text-primary">
                        Edit
                      </Text>
                    </Pressable>
                  </View>
                  <View className="pl-[52px]">
                    <Text className="text-sm text-on-surface-variant">Class D - Exp: 12/2026</Text>
                    <Text className="mt-0.5 text-xs text-outline">
                      Uploaded 1 hour ago • License_Front.png
                    </Text>
                  </View>
                </View>

                <View className="gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-low">
                        <MaterialIcons name="directions-car" size={20} color={themeColors.primary} />
                      </View>
                      <View>
                        <Text className="font-body-md text-body-md font-semibold text-on-surface">
                          Vehicle Details
                        </Text>
                        <View className="mt-1 flex-row items-center gap-1">
                          <View className="rounded-full bg-emerald-50 px-2 py-0.5">
                            <Text className="text-[10px] font-bold tracking-wider text-emerald-700">
                              COMPLETED
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => router.push("/(driver-auth)/register-vehicle-type")}
                      className="rounded-md px-3 py-1.5"
                    >
                      <Text className="font-label-sm text-label-sm uppercase text-primary">
                        Edit
                      </Text>
                    </Pressable>
                  </View>
                  <View className="pl-[52px]">
                    <View className="mb-2 flex-row items-center gap-3">
                      <Image
                        source={{
                          uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAZD3KzuNy6GJPwqr1NajYqwP51LP4efUkHx6UpASxjGQXZsnWKiAtzjXBnzAedkz-w5aRyItRACh4di8PVRzy03tKZAsirHyu0ZN_8HmXgUpnf5NI5bXqmGepu8V-mlOxi6jcTwwVvtcweVqMdMxURxEkiAb7Nvd-6sQLLM48EIBVKvIUv2J-aLx7YZEI-QED3zWT7gqVEybXcpvn_ThIqhEv7dQSjEglsXydH8PYRsPegkhwPfn2D",
                        }}
                        resizeMode="cover"
                        className="h-12 w-16 rounded bg-surface-variant"
                      />
                      <View>
                        <Text className="text-sm font-medium text-on-surface-variant">
                          2021 Toyota Camry
                        </Text>
                        <Text className="text-xs text-outline">License Plate: ABC-1234</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-outline">
                      Registration &amp; Insurance uploaded
                    </Text>
                  </View>
                </View>

                <View className="gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-low">
                        <MaterialIcons name="account-circle" size={20} color={themeColors.primary} />
                      </View>
                      <View>
                        <Text className="font-body-md text-body-md font-semibold text-on-surface">
                          Profile Photo
                        </Text>
                        <View className="mt-1 flex-row items-center gap-1">
                          <View className="rounded-full bg-emerald-50 px-2 py-0.5">
                            <Text className="text-[10px] font-bold tracking-wider text-emerald-700">
                              COMPLETED
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => router.push("/(driver-auth)/register-profile-photo")}
                      className="rounded-md px-3 py-1.5"
                    >
                      <Text className="font-label-sm text-label-sm uppercase text-primary">
                        Edit
                      </Text>
                    </Pressable>
                  </View>
                  <View className="flex-row items-center gap-4 pl-[52px]">
                    <Image
                      source={{
                        uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBUOFc6ssJHWVq8NjZRcr_dBC5UsLQERoWqGtvua1vw1rkaeQkcGPD1vsHkZH3Z-QevY0qfdgs21eUOYTbfCrChFoLo51aCubhclt5DO6ST9GEPop47aJxdt8CBgNF5TY8Qwi1DACgYGrfiKf_d4OcaMfmAa9_t7n2eHLBFn5LOpyL7C8Fz5CGXKJLqXJQ90ZMnCip28C71tS3H2V6qly4ssN13pADDoegDecMDlUh6pGQVUMX31rJU",
                      }}
                      resizeMode="cover"
                      className="h-12 w-12 rounded-full border border-outline-variant bg-surface-variant"
                    />
                    <Text className="flex-1 text-xs text-outline">
                      Clear, forward-facing photo without sunglasses or hats.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          <View className="absolute bottom-0 z-50 w-full overflow-hidden border-t border-outline-variant/20 p-container-margin">
            <BlurView
              intensity={70}
              tint="light"
              experimentalBlurMethod="dimezisBlurView"
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View className="mx-auto w-full max-w-[400px]">
              <Pressable
                onPress={handleSubmitForVerification}
                disabled={isSubmitting}
                className={`h-14 w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary active:scale-[0.98] ${
                  isSubmitting ? "opacity-70" : ""
                }`}
                style={{
                  shadowColor: themeColors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator size="small" color={themeColors.onPrimary} />
                    <Text className="font-body-md text-body-md font-semibold text-on-primary">
                      Submitting...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="font-body-md text-body-md font-semibold text-on-primary">
                      Submit for Verification
                    </Text>
                    <MaterialIcons name="arrow-forward" size={20} color={themeColors.onPrimary} />
                  </>
                )}
              </Pressable>
              <Text className="mt-3 text-center font-body-md text-[11px] text-outline">
                By submitting, you agree to our Terms of Service and Privacy Policy.
              </Text>
            </View>
          </View>
        </>
      ) : null}

      {state === "pending" ? (
        <View className="flex-1">
          <View style={{ paddingTop: insets.top }} className="w-full bg-surface">
            <View className="h-16 w-full flex-row items-center px-container-margin">
              <Pressable
                onPress={() => router.back()}
                className="mr-4 items-center justify-center rounded-full p-2 active:scale-95"
              >
                <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurfaceVariant} />
              </Pressable>
              <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
                Driver Registration
              </Text>
            </View>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="px-container-margin py-4 pb-24">
            <View className="mx-auto w-full max-w-3xl">
              <View className="relative mb-6 flex-col items-start gap-4 rounded-xl border border-primary-fixed bg-surface-container-low p-4 shadow-sm">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-container">
                    <MaterialIcons
                      name="hourglass-empty"
                      size={20}
                      color={themeColors.onPrimaryContainer}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-primary">
                      Verification in progress
                    </Text>
                    <Text className="font-body-md text-body-md text-on-surface">
                      We are reviewing your details. This usually takes 24-48 hours.
                    </Text>
                  </View>
                </View>
                <View className="w-full items-center rounded-full border border-outline-variant bg-surface px-4 py-2">
                  <Text className="font-label-sm text-label-sm text-on-surface-variant">
                    Estimated: 24-48h
                  </Text>
                </View>
              </View>

              <View className="mb-8 w-full gap-6">
                <View className="rounded-xl border border-outline-variant bg-surface p-6 shadow-sm">
                  <View className="mb-6 flex-row items-center gap-4">
                    <View className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-surface bg-surface-variant">
                      <Image
                        source={{
                          uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAT1xzug5JM6A2NQDqJttaYgS11atNfFoL3ug5whH5siRGDhHXZDp-IP9-h_AN_hecdeWG9tDcuMxacjW8vC-1rQyFZI_XN3OWomnu7R56qWrR_Q9-CXXZ0PGjZpkIpw9HUiIea-3i5LMAUl6qSwVRrZZoANhx0pN67kZ_ebxtFy8bKP8um6cqrhKRFPqjDwrO7yqAX9F1h3C3uWVi7g0WSf79225kUBQiONSCsvgZN2uretH-7UYJR",
                        }}
                        resizeMode="cover"
                        className="h-full w-full"
                      />
                      <View className="absolute bottom-0 right-0 h-5 w-5 items-center justify-center rounded-full border border-surface bg-secondary-container">
                        <MaterialIcons
                          name="schedule"
                          size={12}
                          color={themeColors.onSecondaryContainer}
                        />
                      </View>
                    </View>
                    <View>
                      <Text className="font-fare-display text-fare-display text-on-surface">
                        Alex Mercer
                      </Text>
                      <Text className="font-body-md text-body-md text-on-surface-variant">
                        Profile Pending
                      </Text>
                    </View>
                  </View>
                  <View className="gap-4">
                    <View className="flex-row items-center justify-between border-b border-outline-variant/30 py-2">
                      <View className="flex-row items-center gap-2">
                        <MaterialIcons name="badge" size={18} color={themeColors.outline} />
                        <Text className="font-body-md text-body-md text-on-surface-variant">
                          License
                        </Text>
                      </View>
                      <Text className="rounded-full bg-surface-variant px-2 py-1 font-label-sm text-label-sm text-tertiary-container">
                        Reviewing
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between border-b border-outline-variant/30 py-2">
                      <View className="flex-row items-center gap-2">
                        <MaterialIcons
                          name="assignment-ind"
                          size={18}
                          color={themeColors.outline}
                        />
                        <Text className="font-body-md text-body-md text-on-surface-variant">
                          Background Check
                        </Text>
                      </View>
                      <Text className="rounded-full bg-surface-variant px-2 py-1 font-label-sm text-label-sm text-tertiary-container">
                        Processing
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between py-2">
                      <View className="flex-row items-center gap-2">
                        <MaterialIcons
                          name="account-balance"
                          size={18}
                          color={themeColors.outline}
                        />
                        <Text className="font-body-md text-body-md text-on-surface-variant">
                          Bank Details
                        </Text>
                      </View>
                      <Text className="rounded-full bg-primary-fixed px-2 py-1 font-label-sm text-label-sm text-primary">
                        Approved
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-sm">
                  <View className="relative h-32 bg-surface-container-highest">
                    <Image
                      source={{
                        uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVfRdO3FFPPRoFIyunEJrrilsKkpMwy9IqUqEN0J9tABH-kilWXRu93h0tmowQmLEEdmqti_5LpbbpgUJ3cx3L_NNv3rbam3f2o5vLm3dMQYcNp5bLM4KHMEUGd75FpiE-u2SSNZuyIUsf-J6aZ5d3RWLytaffGGtw6Z2GIm6d0iLIi6c8SIo7QxdqkeE1Q3oZ0dkofxchk6TPFj9UZGBQhCJotGm7V7JhwBXqz5yNhuGscCjneabf",
                      }}
                      resizeMode="cover"
                      className="h-full w-full opacity-80"
                    />
                    <LinearGradient
                      colors={["transparent", themeColors.surface]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                    />
                    <View className="absolute bottom-4 left-4 right-4">
                      <Text className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-primary">
                        Vehicle
                      </Text>
                      <Text className="font-headline-lg-mobile text-headline-lg-mobile leading-tight text-on-surface">
                        2023 Toyota Camry
                      </Text>
                    </View>
                  </View>
                  <View className="p-6">
                    <View className="gap-4">
                      <View className="flex-row items-center justify-between border-b border-outline-variant/30 py-2">
                        <View className="flex-row items-center gap-2">
                          <MaterialIcons name="pin" size={18} color={themeColors.outline} />
                          <Text className="font-body-md text-body-md text-on-surface-variant">
                            License Plate
                          </Text>
                        </View>
                        <Text className="font-body-md text-body-md font-semibold text-on-surface">
                          XYZ-1234
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between border-b border-outline-variant/30 py-2">
                        <View className="flex-row items-center gap-2">
                          <MaterialIcons
                            name="description"
                            size={18}
                            color={themeColors.outline}
                          />
                          <Text className="font-body-md text-body-md text-on-surface-variant">
                            Registration
                          </Text>
                        </View>
                        <Text className="rounded-full bg-surface-variant px-2 py-1 font-label-sm text-label-sm text-tertiary-container">
                          Reviewing
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between py-2">
                        <View className="flex-row items-center gap-2">
                          <MaterialIcons name="security" size={18} color={themeColors.outline} />
                          <Text className="font-body-md text-body-md text-on-surface-variant">
                            Insurance
                          </Text>
                        </View>
                        <Text className="rounded-full bg-surface-variant px-2 py-1 font-label-sm text-label-sm text-tertiary-container">
                          Reviewing
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <View className="mb-8 overflow-hidden rounded-xl border border-outline-variant/50">
                <View className="gap-4 p-6">
                  <View className="flex-row gap-4 opacity-30">
                    <View className="h-24 flex-1 items-center justify-center gap-2 rounded-lg bg-surface-container-low">
                      <MaterialIcons name="map" size={20} color={themeColors.outline} />
                      <Text className="font-label-sm text-label-sm text-on-surface-variant">
                        Go Online
                      </Text>
                    </View>
                    <View className="h-24 flex-1 items-center justify-center gap-2 rounded-lg bg-surface-container-low">
                      <MaterialIcons
                        name="account-balance-wallet"
                        size={20}
                        color={themeColors.outline}
                      />
                      <Text className="font-label-sm text-label-sm text-on-surface-variant">
                        Cash Out
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row gap-4 opacity-30">
                    <View className="h-24 flex-1 items-center justify-center gap-2 rounded-lg bg-surface-container-low">
                      <MaterialIcons name="route" size={20} color={themeColors.outline} />
                      <Text className="font-label-sm text-label-sm text-on-surface-variant">
                        My Routes
                      </Text>
                    </View>
                    <View className="h-24 flex-1 items-center justify-center gap-2 rounded-lg bg-surface-container-low">
                      <MaterialIcons name="insights" size={20} color={themeColors.outline} />
                      <Text className="font-label-sm text-label-sm text-on-surface-variant">
                        Insights
                      </Text>
                    </View>
                  </View>
                </View>

                <BlurView
                  intensity={30}
                  tint="light"
                  experimentalBlurMethod="dimezisBlurView"
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <View
                  className="absolute inset-0 items-center justify-center p-6"
                  style={{ backgroundColor: `${themeColors.surface}99` }}
                >
                  <View className="mb-4 h-12 w-12 items-center justify-center rounded-full bg-surface shadow-sm">
                    <MaterialIcons name="lock" size={20} color={themeColors.onSurfaceVariant} />
                  </View>
                  <Text className="mb-2 text-center font-fare-display text-fare-display text-on-surface">
                    Features Locked
                  </Text>
                  <Text className="mx-auto max-w-md text-center font-body-md text-body-md text-on-surface-variant">
                    Access to trips, earnings, and full account settings will unlock
                    automatically once your profile is verified.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Dev-only: the "pending" state has no real outbound action (correct for production --
              approval arrives via backend/push notification, not a button here), but that leaves
              manual testing at a dead end with no way to reach "approved". Stand-in only; delete
              this button once real backend/push-notification logic drives the transition. */}
          <View className="absolute bottom-6 left-0 right-0 z-30 flex-row justify-center px-container-margin">
            <Pressable
              onPress={() => goToState("approved")}
              className="flex-row items-center gap-2 rounded-full border-2 border-dashed border-amber-500 bg-amber-100 px-4 py-2 active:scale-95"
            >
              <MaterialIcons name="bug-report" size={16} color="#92400e" />
              <Text className="font-label-sm text-label-sm text-amber-900">
                DEV: Simulate Approval
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Fixed (Root Cause B of a later batch): this "rejected" card wasn't in a ScrollView, sitting
          in a plain centered View -- on a shorter device the card (icon, headline, subtitle,
          issues list, 2 buttons) could exceed the screen with no way to reach the cut-off content. */}
      {state === "rejected" ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow items-center justify-center p-container-margin"
        >
          <View className="w-full max-w-[400px] overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-lg">
            <View className="items-center p-stack-md">
              <View className="mb-stack-md h-20 w-20 items-center justify-center rounded-full bg-error-container shadow-sm">
                <MaterialIcons name="error" size={36} color={themeColors.error} />
              </View>
              <Text className="mb-stack-sm text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Verification Failed
              </Text>
              <Text className="mb-stack-lg text-center font-body-md text-body-md text-on-surface-variant">
                We couldn&apos;t verify your identity. Please review the issues below and try
                again to continue driver registration.
              </Text>

              <View className="mb-stack-lg w-full gap-stack-sm rounded-lg border border-surface-variant bg-surface-container-low p-4">
                <Text className="mb-base font-label-sm text-label-sm uppercase tracking-wider text-on-surface">
                  Issues Detected
                </Text>
                <View className="gap-base">
                  <View className="flex-row items-start">
                    <MaterialIcons
                      name="close"
                      size={20}
                      color={themeColors.error}
                      style={{ marginRight: 8 }}
                    />
                    <View className="flex-1">
                      <Text className="font-body-md text-body-md font-semibold text-on-surface">
                        Document expired
                      </Text>
                      <Text className="text-sm text-on-surface-variant">
                        The provided driver&apos;s license is past its expiration date.
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-start">
                    <MaterialIcons
                      name="close"
                      size={20}
                      color={themeColors.error}
                      style={{ marginRight: 8 }}
                    />
                    <View className="flex-1">
                      <Text className="font-body-md text-body-md font-semibold text-on-surface">
                        Blurry photo
                      </Text>
                      <Text className="text-sm text-on-surface-variant">
                        The selfie submitted was not clear enough for facial matching.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View className="border-t border-outline-variant bg-surface-container-lowest p-stack-md">
              <Pressable
                onPress={() => goToState("resubmit")}
                className="mb-stack-sm w-full flex-row items-center justify-center rounded-lg bg-primary py-4 active:scale-95"
              >
                <MaterialIcons
                  name="upload-file"
                  size={20}
                  color={themeColors.onPrimary}
                  style={{ marginRight: 8 }}
                />
                <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-primary">
                  Resubmit Documents
                </Text>
              </Pressable>
              <View className="items-center">
                {/* TODO: no destination specified for "Contact Support" yet (source links to "#"). */}
                <Pressable>
                  <Text className="font-label-sm text-label-sm text-primary underline">
                    Contact Support
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : null}

      {state === "resubmit" ? (
        <View className="flex-1">
          <View style={{ paddingTop: insets.top }} className="w-full bg-surface">
            <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
              <Pressable
                onPress={() => router.back()}
                className="items-center justify-center rounded-full p-2 active:scale-95"
              >
                <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurfaceVariant} />
              </Pressable>
              <Text className="flex-1 text-center font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
                Driver Registration
              </Text>
              <View className="w-10" />
            </View>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="mx-auto w-full max-w-2xl gap-stack-lg px-container-margin py-stack-md"
          >
            <View className="items-center gap-base">
              <View className="mb-stack-sm h-16 w-16 items-center justify-center rounded-full bg-error-container">
                <MaterialIcons name="error" size={32} color={themeColors.error} />
              </View>
              <Text className="text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Action Required
              </Text>
              <Text className="text-center font-body-md text-body-md text-on-surface-variant">
                Some of your documents were rejected. Please review the feedback and upload them
                again to continue your registration.
              </Text>
            </View>

            <View className="gap-stack-sm">
              <View className="relative overflow-hidden rounded-xl border border-error bg-surface-container-lowest p-gutter shadow-sm">
                <View className="absolute bottom-0 left-0 top-0 w-1 bg-error" />
                <View className="gap-base">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-base">
                      <MaterialIcons
                        name="assignment-return"
                        size={20}
                        color={themeColors.error}
                      />
                      <Text className="font-body-md text-body-md font-semibold text-on-surface">
                        Driver&apos;s License
                      </Text>
                    </View>
                    <Text className="rounded-full bg-error-container px-2 py-1 font-label-sm text-label-sm text-error">
                      Rejected
                    </Text>
                  </View>
                  <Text className="mt-1 text-sm text-on-surface-variant">
                    The uploaded image is blurry. Please ensure all text and your photo are
                    clearly visible without glare.
                  </Text>
                  {/* Inert per rule 5 -- NOT wired to upload-failed.tsx (that's a separate,
                      unrelated trigger for real upload failures, not this placeholder). */}
                  <Pressable className="mt-stack-sm w-full flex-row items-center justify-center gap-2 rounded-lg bg-primary-container py-3">
                    <MaterialIcons name="upload" size={20} color={themeColors.onPrimaryContainer} />
                    <Text className="font-label-sm text-label-sm text-on-primary-container">
                      Upload Again
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View className="relative overflow-hidden rounded-xl border border-error bg-surface-container-lowest p-gutter shadow-sm">
                <View className="absolute bottom-0 left-0 top-0 w-1 bg-error" />
                <View className="gap-base">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center gap-base">
                      <MaterialIcons name="directions-car" size={20} color={themeColors.error} />
                      <Text className="font-body-md text-body-md font-semibold text-on-surface">
                        Vehicle Registration
                      </Text>
                    </View>
                    <Text className="rounded-full bg-error-container px-2 py-1 font-label-sm text-label-sm text-error">
                      Rejected
                    </Text>
                  </View>
                  <Text className="mt-1 text-sm text-on-surface-variant">
                    The document appears to be expired. Please upload a valid, current
                    registration for your vehicle.
                  </Text>
                  {/* Inert per rule 5 -- NOT wired to upload-failed.tsx. */}
                  <Pressable className="mt-stack-sm w-full flex-row items-center justify-center gap-2 rounded-lg bg-primary-container py-3">
                    <MaterialIcons name="upload" size={20} color={themeColors.onPrimaryContainer} />
                    <Text className="font-label-sm text-label-sm text-on-primary-container">
                      Upload Again
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View className="mt-auto items-center pt-stack-md">
              {/* TODO: no destination specified for "Contact Support" yet (source links to "#"). */}
              <Text className="text-center font-body-md text-body-md text-on-surface-variant">
                Need help with your documents?{" "}
                <Text className="font-semibold text-primary">Contact Support</Text>
              </Text>
            </View>
          </ScrollView>
        </View>
      ) : null}

      {state === "approved" ? (
        <View className="flex-1 items-center justify-center overflow-hidden">
          <View className="z-10 w-full max-w-md items-center justify-center px-container-margin">
            <View className="relative mb-stack-lg h-32 w-32 items-center justify-center">
              <View className="absolute inset-0 rounded-full bg-primary-container opacity-20" />
              <View className="absolute inset-2 h-28 w-28 rounded-full bg-primary-container opacity-40" />
              <View className="absolute inset-4 h-24 w-24 items-center justify-center rounded-full bg-primary shadow-lg">
                <MaterialIcons name="check-circle" size={48} color={themeColors.onPrimary} />
              </View>
              <MaterialIcons
                name="arrow-back-ios-new"
                size={20}
                color={themeColors.primaryContainer}
                style={{ position: "absolute", top: 0, right: 0 }}
              />
              <MaterialIcons
                name="drive-file-rename-outline"
                size={20}
                color={themeColors.primaryContainer}
                style={{ position: "absolute", bottom: 16, left: 0 }}
              />
            </View>

            <View className="mb-stack-lg w-full items-center">
              <Text className="mb-stack-sm text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                You&apos;re verified!
              </Text>
              <Text className="mx-auto max-w-[280px] text-center font-body-md text-body-md text-on-surface-variant">
                Welcome to the marketplace. You can now start accepting rides and earning.
              </Text>
            </View>

            <View className="mt-auto w-full pb-stack-lg pt-stack-sm">
              {/* Fixed broken route: this pointed at "/(driver)/home", which never existed --
                  dashboard.tsx (the real tab screen with the online/offline toggle) now exists
                  at "/(driver)/(tabs)/dashboard", per the ride-flow batch. "Go Online" now flips
                  that toggle directly via the `status` param (same mechanism ride-completed.tsx
                  uses to reset it), instead of just navigating there and leaving it offline. */}
              <Pressable
                onPress={() =>
                  router.push({ pathname: "/(driver)/(tabs)/dashboard", params: { status: "online" } })
                }
                className="h-14 w-full flex-row items-center justify-center rounded-full bg-primary active:scale-95"
                style={{
                  shadowColor: themeColors.primaryContainer,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <Text className="mr-2 font-label-sm text-label-sm text-on-primary">Go Online</Text>
                <MaterialIcons name="arrow-forward" size={20} color={themeColors.onPrimary} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/(driver)/(tabs)/dashboard")}
                className="mt-stack-sm h-12 w-full items-center justify-center rounded-full active:scale-95"
              >
                <Text className="font-label-sm text-label-sm text-primary">Go to Dashboard</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
