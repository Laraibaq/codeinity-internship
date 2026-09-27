import React from "react";
import {
  View,
  Text,
  Pressable,
  ImageBackground,
  StatusBar,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { themeColors } from "@/constants/theme-colors";

const HERO_IMAGE_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB30UVkv_ZROr6cEzYdhZAdpNoBhVgIAUL-KITbT0CTG4dk0zHaLthC4Tq-aV9eJToxePXDGpdTnCed81gStoPjSD5F2PICbLlWZfCDtSibgKE3mni_KuxeUsEzz5RU2gThE_m7w3ioXI8BrAvNFqs2kx2pQppmZfnctEXN96dNa2UdG7iQQTcnvJYX1j6CCaPihO8Rc70EIfjNnguh2nUfhr-97QmED9dIs_XCWvMLM1hJZryETjmD";

export default function PassengerWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Ambient Map Layer / Hero Image */}
      <ImageBackground
        source={{ uri: HERO_IMAGE_URI }}
        style={styles.heroImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["transparent", "#f9f9ff"]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      {/* Content Canvas */}
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 16, 48),
            paddingBottom: Math.max(insets.bottom + 16, 32),
          },
        ]}
      >
        {/* Brand / Logo */}
        <View style={[styles.logoContainer, { top: Math.max(insets.top + 8, 48) }]}>
          <Text style={styles.brandName}>Ryde</Text>
        </View>

        {/* Hero Card */}
        <View style={styles.card}>
          {/* Headline */}
          <View style={styles.cardText}>
            <Text style={styles.headline}>Your city,{"\n"}your price.</Text>
            <Text style={styles.subtitle}>
              Experience the new standard of moving through the city. Fast, clear,
              and perfectly priced.
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Pressable
              onPress={() => router.push("/(passenger-auth)/onboarding-01" as any)}
              style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Get Started"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.btnPrimaryText}>Get Started</Text>
              <MaterialIcons name="arrow-forward" size={18} color={themeColors.onPrimary} />
            </Pressable>

            <Pressable
              onPress={() => router.push("/(passenger-auth)/login")}
              style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Log In"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.btnSecondaryText}>Log In</Text>
            </Pressable>
          </View>

          {/* Legal */}
          <Text style={styles.legal}>
            By continuing, you agree to our Terms & Privacy Policy.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f9f9ff",
  },
  heroImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 420,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "flex-end",
  },
  logoContainer: {
    position: "absolute",
    left: 20,
    zIndex: 10,
  },
  brandName: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
    color: themeColors.primary,
    letterSpacing: -0.3,
    fontFamily: "Inter_900Black",
  },
  card: {
    backgroundColor: "rgba(249,249,255,0.88)",
    borderRadius: 24,
    padding: 24,
    gap: 24,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(199,196,216,0.3)",
  },
  cardText: {
    gap: 12,
  },
  headline: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "800",
    color: themeColors.onSurface,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.onSurfaceVariant,
    textAlign: "center",
  },
  buttons: {
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: themeColors.primary,
    borderRadius: 12,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnPrimaryText: {
    color: themeColors.onPrimary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  btnSecondary: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: themeColors.outlineVariant,
  },
  btnSecondaryText: {
    color: themeColors.onSurface,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  legal: {
    fontSize: 11,
    color: "rgba(70,69,85,0.7)",
    textAlign: "center",
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
