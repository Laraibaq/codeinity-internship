import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { themeColors } from "@/constants/theme-colors";

// Fixed (Root Cause B of this batch): the bottom sheet (headline/subtitle/2 buttons) was a plain
// fixed View, not scrollable -- the hero image above it is a fixed 486px, so on a short device the
// remaining space could be too little for this content, with no way to reach anything cut off.
// Wrapped in a ScrollView (with its content still bottom-anchored via `justify-end` on the content
// container, matching the original bottom-sheet look when everything already fits).
//
// Rule 3 substitutions used on this screen:
// - Google "Material Symbols Outlined" ligature icons (<span class="material-symbols-outlined">)
//   have no NativeWind/RN equivalent (it's a web icon-font ligature technique), substituted with
//   @expo/vector-icons' MaterialIcons, converting icon names from underscore_case to hyphen-case
//   (e.g. local_taxi -> "local-taxi"). Icon `size` is set from whatever text-size class the source
//   <span> inherited/declared, since Material Symbols glyphs size via font-size.
// - `bg-gradient-to-t from-background to-transparent` (CSS gradient) has no NativeWind/RN View
//   equivalent, substituted with expo-linear-gradient's <LinearGradient>.
// - `drop-shadow-md` on the "Indigo" wordmark is a CSS filter (distinct from box-shadow), which has
//   no NativeWind equivalent; substituted with RN's textShadow* style props. Tailwind's drop-shadow-md
//   is actually two stacked shadow layers; RN text shadow only supports one, so this uses the first
//   (stronger) layer as the closest single-shadow approximation.
// - Arbitrary `shadow-[...]` box-shadow values have no NativeWind className equivalent for exact
//   custom rgba/blur values, substituted with RN shadow*/elevation style props carrying the same
//   offset/blur-radius/color/opacity.
// - `hover:bg-surface-container-high` on the Login button dropped: touch devices have no hover state;
//   the existing `active:scale-95` press feedback already covers the touch equivalent.
// - `transition-transform` / `transition-colors` dropped throughout: no RN style equivalent for CSS
//   transitions without Reanimated/Animated APIs, out of scope for this static UI-shell pass.

export default function DriverWelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        <View className="relative h-[486px] w-full">
          <Image
            className="absolute inset-0 h-full w-full rounded-b-[32px]"
            resizeMode="cover"
            // RN's ImageStyle type doesn't include `elevation` (Android's shadow style), so this
            // shadow only renders on iOS; there's no Android-typed equivalent for Image specifically.
            style={{
              shadowColor: "#111827",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.12,
              shadowRadius: 32,
            }}
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP7z6N1YlZDkCK0vxCVGKA7318NVJAtHfbUG717Xl0HDi1P1sFu_OzoDyZYzyL0IaOREGbpEX9yA_a5DJoyoc1cmGZB0DsZUs3TOQxvuyQ8fNymnuzFXviDr_6wGP3bHsy8nAzu2746arCifC0wpa7P5cGBVf9L_CkWBAmW5sG_VBT83NYMTroMzf3y4P6Oc0tECvviubPpyuprlJVw1rPO0ugwrVG_V-5S_MZNFrLnzs1L-ri5qeT",
            }}
            accessibilityLabel="A professional, smiling ride-hailing driver sitting comfortably in the driver's seat of a clean, modern vehicle. Natural daylight illuminates the car interior. The overall aesthetic is modern minimalism, featuring a bright, light-mode palette with crisp whites and subtle indigo accents. The mood conveys trust, efficiency, and a premium transportation experience."
          />

          <View className="absolute left-6 top-6 flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
              <MaterialIcons name="local-taxi" size={20} color={themeColors.onPrimary} />
            </View>
            <Text
              className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-surface"
              style={{
                textShadowColor: "rgba(0,0,0,0.07)",
                textShadowOffset: { width: 0, height: 4 },
                textShadowRadius: 3,
              }}
            >
              Indigo
            </Text>
          </View>

          <LinearGradient
            colors={[themeColors.background, "transparent"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            className="absolute bottom-0 h-32 w-full rounded-b-[32px]"
          />
        </View>

        <ScrollView
          className="-mt-[40px] flex-1 rounded-t-[32px] bg-background"
          contentContainerClassName="flex-grow justify-end px-container-margin pb-[40px] pt-[24px]"
        >
          <View className="mx-auto mb-stack-md h-1 w-10 rounded-full bg-outline-variant opacity-50" />

          <View className="mb-stack-lg flex flex-col gap-stack-sm">
            <Text className="font-display-lg text-display-lg text-on-background">
              Drive on your terms.
            </Text>
            <Text className="max-w-sm font-body-md text-body-md text-on-surface-variant">
              Join the marketplace where you negotiate your fare and keep more of what you earn.
            </Text>
          </View>

          <View className="flex flex-col gap-stack-sm">
            <Pressable
              onPress={() => router.push("/(driver-auth)/onboarding-negotiation")}
              className="h-[56px] w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary active:scale-95"
              style={{
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <Text className="font-label-sm text-label-sm uppercase text-on-primary">
                Get Started
              </Text>
              {/* No explicit size class on the source <span> for this icon; it inherits the
                  button's text-label-sm (12px) context, which renders unusually small next to
                  the label text. Flagging per rule 4 rather than "fixing" it to a larger size. */}
              <MaterialIcons name="arrow-forward" size={12} color={themeColors.onPrimary} />
            </Pressable>

            <Pressable
              onPress={() => router.push("/(driver-auth)/login")}
              className="h-[56px] w-full items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low active:scale-95"
            >
              <Text className="font-label-sm text-label-sm uppercase text-on-background">
                Login
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
