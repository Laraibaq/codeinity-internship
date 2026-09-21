import React from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

const MAP_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAmIy4yW67r3-uoyPBcUuxPj9_btSUzF6ECtahH-UT1fzZkxFu930_pCnALHtGbvJOWN5V_eW5fbBEsvU9XXyGNvW9b8QZeHvYCGb_mYjrtK92C8dpXt_Hk7EuwqBEVkNAyB8SW8YrPVmD1Ukxx5ewZubXJrfvp8zNm8xBYGhO6c0WI36nZx-mjiWNDIRqRlCuyljjsU6Sspt9HEDnWboW84lvIKS9ezjynwE8LVyHS1EXPSUGvnQdQ";

export default function PassengerRideCancelConfirmScreen() {
  const router = useRouter();

  const handleKeepSearching = () => router.back();
  const handleCancelRide = () =>
    router.replace("/(passenger)/ride-cancelled" as any);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map background */}
      <Image source={{ uri: MAP_URI }} style={styles.mapBg} resizeMode="cover" />

      {/* Frosted overlay */}
      <View style={styles.overlay} />

      {/* Centered modal card */}
      <View style={styles.centerWrapper}>
        <View style={styles.card}>
          {/* Warning icon */}
          <View style={styles.iconCircle}>
            <MaterialIcons name="error" size={40} color="#ba1a1a" />
          </View>

          {/* Text */}
          <Text style={styles.title}>Are you sure you want to cancel?</Text>
          <Text style={styles.body}>
            Canceling now may incur a small fee. We can keep looking for a ride
            nearby if you prefer.
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={handleKeepSearching}
              style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
            >
              <Text style={styles.btnPrimaryText}>Keep Searching</Text>
            </Pressable>
            <Pressable
              onPress={handleCancelRide}
              style={({ pressed }) => [styles.btnOutlined, pressed && styles.pressed]}
            >
              <Text style={styles.btnOutlinedText}>Cancel Ride</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: themeColors.background,
    overflow: "hidden",
  },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  centerWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 384,
    backgroundColor: themeColors.surfaceContainerLowest,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: "center",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.3)",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,218,214,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "600",
    color: themeColors.onSurface,
    letterSpacing: -0.28,
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 40,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  btnPrimary: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  btnPrimaryText: {
    color: themeColors.onPrimary,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  btnOutlined: {
    width: "100%",
    height: 56,
    backgroundColor: themeColors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutlinedText: {
    color: themeColors.onSurface,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
