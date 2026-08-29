import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeColors } from "@/constants/theme-colors";

// Generic, reusable upload-failure screen -- NOT part of the (driver)/verification-status state
// machine. Meant to be pushed to from any document/photo upload button across the app once real
// upload logic exists; nothing currently links to this screen (see this task's chat response).
//
// This screen lives directly under the root Stack (src/app/_layout.tsx). It used to carry its own
// local `<Stack.Screen options={{ headerShown: false }} />` override because the root Stack didn't
// set that itself -- now that the root layout sets `headerShown: false` globally (see that file's
// header comment), the local override was redundant and removed. The header now also carries
// top-safe-area padding via `useSafeAreaInsets()`, per the same global safe-area audit.
//
// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; all glyphs
//   ("arrow_back", "error", "upload_file", "image", "close", "refresh") verified against the
//   installed glyph map.
// - `sticky top-0` on the header is the same inert non-Tailwind-word artifact seen elsewhere in
//   this project -- dropped silently.
// - `hover:*` / `transition-colors` / `duration-*` dropped throughout: no hover state on touch
//   devices.
// - The decorative "broken file graphic" badge (`absolute -bottom-2 -right-2`) is a plain
//   absolutely-positioned View, no CSS involved.
// - The file-name/reason row is normally simulated static content in the source; here it reads
//   optional `fileName`/`reason` params via useLocalSearchParams so callers can pass the real
//   failed file's name and error once upload logic exists, falling back to the source's own literal
//   values ("drivers_license_scan_final.pdf" / "Network timeout") when no params are passed.
// - "Retry Upload" and "Choose Different File" both call `router.back()` for now -- see the TODO
//   comment beside them for what real logic they still need.
// - The "close" button on the file-details row and the "Contact Driver Support" link have no
//   destination/handler in the source either; left inert (no onPress), consistent with rule 5.

export default function UploadFailedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fileName, reason } = useLocalSearchParams<{ fileName?: string; reason?: string }>();
  const displayFileName = fileName ?? "drivers_license_scan_final.pdf";
  const displayReason = reason ?? "Network timeout";

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="w-full bg-surface">
        <View className="h-16 w-full flex-row items-center justify-between px-container-margin">
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurfaceVariant} />
          </Pressable>
          <Text className="mx-auto pr-10 font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Driver Registration
          </Text>
        </View>
      </View>

      <View className="flex-1 items-center justify-center p-container-margin">
        <View
          className="relative w-full max-w-md items-center overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md"
          style={{
            shadowColor: "#111827",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.12,
            shadowRadius: 32,
            elevation: 12,
          }}
        >
          <View className="mb-stack-sm items-center justify-center">
            <View
              className="relative h-24 w-24 items-center justify-center rounded-full bg-error-container"
              style={{
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <MaterialIcons name="error" size={48} color={themeColors.error} />
              <View className="absolute -bottom-2 -right-2 rounded-full border border-outline-variant bg-surface p-1">
                <MaterialIcons name="upload-file" size={20} color={themeColors.outline} />
              </View>
            </View>
          </View>

          <Text className="mb-base text-center font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Upload Failed
          </Text>
          <Text className="mb-stack-md text-center font-body-md text-on-surface-variant">
            We couldn&apos;t process your document. Please ensure it&apos;s a clear, uncropped
            photo in JPG, PNG, or PDF format (max 5MB).
          </Text>

          <View className="mb-stack-md w-full flex-row items-center justify-between rounded-lg border border-error/20 bg-surface-container-low p-3">
            <View className="flex-row items-center gap-3">
              <MaterialIcons name="image" size={20} color={themeColors.outline} />
              <View>
                <Text className="font-label-sm text-label-sm text-on-surface">
                  {displayFileName}
                </Text>
                <Text className="text-sm text-error">{displayReason}</Text>
              </View>
            </View>
            <Pressable>
              <MaterialIcons name="close" size={16} color={themeColors.onSurfaceVariant} />
            </Pressable>
          </View>

          <View className="mt-stack-md w-full gap-base">
            {/* TODO: placeholder until real retry/file-picker logic exists -- both buttons just
                pop back to the screen that pushed here for now. */}
            <Pressable
              onPress={() => router.back()}
              className="w-full flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4 active:scale-95"
              style={{
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <MaterialIcons name="refresh" size={20} color={themeColors.onPrimary} />
              <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-primary">
                Retry Upload
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              className="w-full items-center rounded-xl border border-outline-variant bg-surface-container-lowest py-4 active:scale-95"
            >
              <Text className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface">
                Choose Different File
              </Text>
            </Pressable>
          </View>
        </View>

        <Text className="mt-stack-lg max-w-sm text-center text-sm text-on-surface-variant">
          Need help? Contact <Text className="text-primary">Driver Support</Text>
        </Text>
      </View>
    </View>
  );
}
