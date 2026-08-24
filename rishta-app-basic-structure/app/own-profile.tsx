import React, { useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { OwnProfileView } from "../src/components/feed/OwnProfileView";
import { EditPersonalView } from "../src/components/feed/EditPersonalView";

export default function OwnProfileScreen() {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {editing ? (
        <EditPersonalView
          onCancel={() => setEditing(false)}
          onSave={() => {
            showToast("Personal & Background updated!");
            setEditing(false);
          }}
        />
      ) : (
        <OwnProfileView
          onEditPersonal={() => setEditing(true)}
          onBack={() => router.back()}
          onOpenSettings={() => router.push("/settings")}
          onPreviewPublicProfile={() => {
            showToast("Previewing public profile view");
            router.push("/discover");
          }}
        />
      )}

      {toast && (
        <View className="absolute top-16 left-0 right-0 items-center z-50 px-4">
          <View className="bg-primary px-4 py-2.5 rounded-full">
            <Text className="text-white font-body text-xs">{toast}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
