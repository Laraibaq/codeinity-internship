import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { clearAuthTokens } from "@/lib/api-client";
import { themeColors } from "@/constants/theme-colors";

// Rule 3 substitutions used on this screen:
// - Icon-ligature -> MaterialIcons substitution as on every screen in this project; every icon
//   ("menu", "notifications", "person", "policy", "help_center", "privacy_tip", "gavel", "logout",
//   "notifications_active") verified against the installed glyph map.
// - The desktop nav drawer (`hidden md:flex`) is dropped: always below the `md:` breakpoint on a
//   native phone screen, same treatment as every screen in this project with a mobile/desktop
//   split.
// - Same as safety-center.tsx: this screen assumes a persistent hamburger-drawer shell this app
//   doesn't have. Per explicit correction, the header's menu icon is now a real back arrow calling
//   `router.back()` instead -- this screen is reached via push, not a drawer toggle, so a menu icon
//   implying a drawer was a genuine UX mismatch, not just a fidelity gap.
// - `grid grid-cols-1 md:grid-cols-12` (left Account/Support column vs. right Notifications
//   column) resolves to a single stacked column on mobile -- same substitution used throughout this
//   project. Order follows the source DOM: Account, Support & Legal, Sign Out, then Notifications.
// - The page title's classes are a genuinely tangled override chain: `font-display-lg
//   text-display-lg` (this project's 48px/56px/700-weight token) followed by `md:text-[48px]
//   text-[32px] md:leading-[56px] leading-[40px] tracking-tight` -- i.e. on mobile the size/leading
//   are arbitrary-overridden down to 32px/40px, with `md:` restoring the exact token values on
//   desktop. Those mobile-only arbitrary values (32px/40px) exactly match this project's own
//   `headline-lg` token, so rather than reproduce the multi-layer override chain (display-lg base,
//   then two separate arbitrary overrides, then a *third*, separately-conflicting `tracking-tight`
//   on top of the token's own letter-spacing), this uses `font-headline-lg text-headline-lg`
//   directly -- almost certainly what was actually intended for mobile, and the same category of
//   "flag the redundant/conflicting classes, use the token" call made on `register-license-upload.tsx`.
// - The custom `.toggle-checkbox`/`.toggle-label` CSS (a checkbox styled to look like an iOS-style
//   switch) is the exact use case RN's own `Switch` component exists for -- substituted with
//   `Switch` rather than hand-rebuilding a track+thumb from Views, colored via `trackColor`/
//   `thumbColor` to match the source's primary-when-on / gray-when-off styling (`Switch`'s color
//   props aren't NativeWind-`className`-aware, same as other native components used via `style`/
//   props elsewhere in this project, e.g. BlurView).
// - `hover:*` / `group-hover:*` / `transition-*` / `duration-*` dropped throughout: no hover state
//   on touch devices.
//
// Wiring:
// - Phone/Email "Update": tapping toggles the row into an inline edit field (EditableField below)
//   with Save/Cancel. "Save" only updates local component state -- no backend exists yet to persist
//   to, same "frontend-only, functional in the UI" pattern used elsewhere in this project.
// - Password "Change": same inline-edit pattern, but with New/Confirm fields and a minimum-length +
//   match check before it'll save (PasswordField below) -- local state only, same as above.
// - Help Center -> help-center.tsx (push). Privacy Policy -> privacy-policy.tsx (push). Terms of
//   Service -> terms-of-service.tsx (push). All three previously had no destination at all.
// - "Sign Out": clears the (placeholder) SecureStore key and `router.replace`s to login.tsx --
//   `replace` (not `push`) was used deliberately so signing out also clears the driver-app screens
//   from the back stack, rather than leaving them one swipe-back away after logout. Moved to the
//   very bottom of the screen (after Notifications), per explicit request -- destructive
//   account-level actions read better as the last thing on the page, not sandwiched between two
//   unrelated settings sections.
// - Notifications: a simple list of 3 toggles with no backend meaning shown in the source (no
//   submit button, nothing else reacting to their state) -- implemented as local `useState` per
//   toggle, same presentation-state precedent as the gender/color/vehicle-type pickers elsewhere in
//   this project. Defaults match the source's own `checked` attributes: Push on, Email on, SMS off.

function EditableField({
  label,
  value,
  onSave,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onSave: (next: string) => void;
  keyboardType?: "default" | "phone-pad" | "email-address";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <View className="gap-3 rounded-lg border border-primary bg-surface-container-low p-4">
        <Text className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
          {label}
        </Text>
        <TextInput
          className="min-h-[48px] rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-md text-body-md text-on-surface"
          value={draft}
          onChangeText={setDraft}
          keyboardType={keyboardType}
          autoFocus
        />
        <View className="flex-row justify-end gap-2">
          <Pressable onPress={() => setEditing(false)} className="rounded-lg px-4 py-2">
            <Text className="font-body-md text-body-md text-secondary">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onSave(draft);
              setEditing(false);
            }}
            className="rounded-lg bg-primary px-4 py-2"
          >
            <Text className="font-body-md text-body-md font-semibold text-on-primary">Save</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-between rounded-lg border border-surface-variant bg-surface-container-low p-4">
      <View>
        <Text className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-secondary">
          {label}
        </Text>
        <Text className="font-body-md text-body-md text-on-surface">{value}</Text>
      </View>
      <Pressable
        onPress={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="rounded-lg bg-surface-container-highest px-4 py-2"
      >
        <Text className="font-body-md text-body-md text-primary">Update</Text>
      </Pressable>
    </View>
  );
}

function PasswordField() {
  const [editing, setEditing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = () => {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setNewPassword("");
    setConfirmPassword("");
    setEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  if (editing) {
    return (
      <View className="gap-3 rounded-lg border border-primary bg-surface-container-low p-4">
        <Text className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
          Password
        </Text>
        <TextInput
          className="min-h-[48px] rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-md text-body-md text-on-surface"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password"
          placeholderTextColor={themeColors.outline}
          secureTextEntry
        />
        <TextInput
          className="min-h-[48px] rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-md text-body-md text-on-surface"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          placeholderTextColor={themeColors.outline}
          secureTextEntry
        />
        {error ? <Text className="font-label-sm text-label-sm text-error">{error}</Text> : null}
        <View className="flex-row justify-end gap-2">
          <Pressable
            onPress={() => {
              setEditing(false);
              setError(null);
              setNewPassword("");
              setConfirmPassword("");
            }}
            className="rounded-lg px-4 py-2"
          >
            <Text className="font-body-md text-body-md text-secondary">Cancel</Text>
          </Pressable>
          <Pressable onPress={handleSave} className="rounded-lg bg-primary px-4 py-2">
            <Text className="font-body-md text-body-md font-semibold text-on-primary">Save</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-between rounded-lg border border-surface-variant bg-surface-container-low p-4">
      <View>
        <Text className="mb-1 font-label-sm text-label-sm uppercase tracking-wider text-secondary">
          Password
        </Text>
        <Text className="font-body-md text-body-md text-on-surface">
          {justSaved ? "Password updated" : "••••••••••••"}
        </Text>
      </View>
      <Pressable
        onPress={() => setEditing(true)}
        className="rounded-lg bg-surface-container-highest px-4 py-2"
      >
        <Text className="font-body-md text-body-md text-primary">Change</Text>
      </Pressable>
    </View>
  );
}

export default function DriverSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  const [email, setEmail] = useState("alex.thompson@example.com");

  const handleSignOut = async () => {
    await clearAuthTokens();
    router.replace("/(driver-auth)/login");
  };

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }} className="w-full bg-surface shadow-sm">
        <View className="w-full flex-row items-center justify-between px-container-margin py-base">
          <Pressable
            onPress={() => router.back()}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.onSurfaceVariant} />
          </Pressable>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Driver Portal
          </Text>
          <Pressable
            onPress={() => router.push("/(driver)/(drawer)/notifications")}
            className="items-center justify-center rounded-full p-2 active:scale-95"
          >
            <MaterialIcons name="notifications" size={24} color={themeColors.onSurfaceVariant} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="mx-auto w-full max-w-4xl gap-stack-md px-container-margin pb-32 pt-stack-md"
      >
        <View className="mb-stack-lg">
          <Text className="font-headline-lg text-headline-lg text-on-surface">Settings</Text>
          <Text className="mt-2 text-secondary">
            Manage your account preferences and notification settings.
          </Text>
        </View>

        <View className="gap-stack-md">
          <View className="gap-stack-sm rounded-xl border border-surface-variant bg-surface-container-lowest p-6 shadow-sm">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="person" size={20} color={themeColors.primary} />
              <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Account
              </Text>
            </View>
            <View className="mt-6 gap-4">
              <EditableField
                label="Phone Number"
                value={phone}
                onSave={setPhone}
                keyboardType="phone-pad"
              />
              <EditableField
                label="Email Address"
                value={email}
                onSave={setEmail}
                keyboardType="email-address"
              />
              <PasswordField />
            </View>
          </View>

          <View className="gap-stack-sm rounded-xl border border-surface-variant bg-surface-container-lowest p-6 shadow-sm">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="policy" size={20} color={themeColors.primary} />
              <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Support &amp; Legal
              </Text>
            </View>
            <View className="mt-6 gap-2">
              <Pressable
                onPress={() => router.push("/(driver)/(drawer)/help-center")}
                className="flex-row items-center justify-between rounded-lg border border-transparent p-4"
              >
                <View className="flex-row items-center gap-3">
                  <MaterialIcons name="help-center" size={20} color={themeColors.secondary} />
                  <Text className="text-on-surface">Help Center</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={themeColors.secondary} />
              </Pressable>
              <View className="h-[1px] w-full bg-surface-variant" />
              <Pressable
                onPress={() => router.push("/(driver)/privacy-policy")}
                className="flex-row items-center justify-between rounded-lg border border-transparent p-4"
              >
                <View className="flex-row items-center gap-3">
                  <MaterialIcons name="privacy-tip" size={20} color={themeColors.secondary} />
                  <Text className="text-on-surface">Privacy Policy</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={themeColors.secondary} />
              </Pressable>
              <View className="h-[1px] w-full bg-surface-variant" />
              <Pressable
                onPress={() => router.push("/(driver)/terms-of-service")}
                className="flex-row items-center justify-between rounded-lg border border-transparent p-4"
              >
                <View className="flex-row items-center gap-3">
                  <MaterialIcons name="gavel" size={20} color={themeColors.secondary} />
                  <Text className="text-on-surface">Terms of Service</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={themeColors.secondary} />
              </Pressable>
            </View>
          </View>

          <View className="gap-stack-sm rounded-xl border border-surface-variant bg-surface-container-lowest p-6 shadow-sm">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="notifications-active" size={20} color={themeColors.primary} />
              <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                Notifications
              </Text>
            </View>
            <Text className="mb-6 text-sm text-secondary">
              Choose how you want to receive updates about your trips, earnings, and account.
            </Text>
            <View className="gap-6">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="font-body-md text-body-md font-semibold text-on-surface">
                    Push Notifications
                  </Text>
                  <Text className="mt-1 text-sm text-secondary">
                    Instant alerts on your device for trip requests and urgent updates.
                  </Text>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: themeColors.surfaceContainerHigh, true: themeColors.primary }}
                  thumbColor="#ffffff"
                />
              </View>
              <View className="h-[1px] w-full bg-surface-variant" />
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="font-body-md text-body-md font-semibold text-on-surface">
                    Email Summaries
                  </Text>
                  <Text className="mt-1 text-sm text-secondary">
                    Weekly earning reports and platform news.
                  </Text>
                </View>
                <Switch
                  value={emailEnabled}
                  onValueChange={setEmailEnabled}
                  trackColor={{ false: themeColors.surfaceContainerHigh, true: themeColors.primary }}
                  thumbColor="#ffffff"
                />
              </View>
              <View className="h-[1px] w-full bg-surface-variant" />
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="font-body-md text-body-md font-semibold text-on-surface">
                    SMS Alerts
                  </Text>
                  <Text className="mt-1 text-sm text-secondary">
                    Text messages for critical account security alerts.
                  </Text>
                </View>
                <Switch
                  value={smsEnabled}
                  onValueChange={setSmsEnabled}
                  trackColor={{ false: themeColors.surfaceContainerHigh, true: themeColors.primary }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleSignOut}
            className="mt-4 w-full flex-row items-center justify-center gap-2 rounded-xl bg-error-container px-6 py-4 shadow-sm active:scale-[0.98]"
          >
            <MaterialIcons name="logout" size={20} color={themeColors.onErrorContainer} />
            <Text className="text-[18px] font-headline-lg-mobile leading-6 text-on-error-container">
              Sign Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
