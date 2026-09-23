import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useAuthStore } from "@/store/auth-store";
import { registerDeviceToken, removeDeviceToken } from "@/lib/api/notifications";

// In foreground, Socket.IO is the primary realtime mechanism; suppress foreground system alerts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

export interface PushNotificationPayload {
  type: "ride_offer" | "ride_accepted" | "ride_started" | "ride_completed" | "ride_cancelled";
  rideId?: string;
  offerId?: string;
  driverId?: string;
  fare?: number;
  cancelledBy?: "passenger" | "driver";
  [key: string]: any;
}

/**
 * Requests native push permissions and obtains a genuine Expo push token
 */
async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("ride-updates", {
      name: "Ride Updates",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#208AEF",
    });
  }

  if (!Device.isDevice) {
    console.log("[Push] Must use physical device for real push notifications");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Push] Notification permission denied by user");
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  try {
    const pushTokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return pushTokenData.data;
  } catch (tokenErr) {
    console.warn("[Push] Error obtaining Expo push token:", tokenErr);
    return null;
  }
}

export function usePushNotifications() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeTokenRef = useRef<string | null>(null);

  /**
   * Routes user based on verified notification payload type
   */
  const handleNotificationNavigation = (payload: PushNotificationPayload) => {
    if (!payload || !payload.type) return;

    try {
      switch (payload.type) {
        case "ride_offer":
          // Matched driver receives new ride offer -> dashboard/offers
          if (payload.rideId) {
            router.push({
              pathname: "/(driver)/(drawer)/(tabs)/dashboard" as any,
              params: { activeRideId: payload.rideId, offerId: payload.offerId },
            });
          }
          break;

        case "ride_accepted":
          // Passenger ride accepted by driver -> tracking
          if (payload.rideId) {
            router.push({
              pathname: "/(passenger)/ride-tracking" as any,
              params: { rideId: payload.rideId },
            });
          }
          break;

        case "ride_started":
          // Passenger trip started -> tracking
          if (payload.rideId) {
            router.push({
              pathname: "/(passenger)/ride-tracking" as any,
              params: { rideId: payload.rideId },
            });
          }
          break;

        case "ride_completed":
          // Passenger trip completed -> complete / rate screen
          if (payload.rideId) {
            router.push({
              pathname: "/(passenger)/ride-complete" as any,
              params: { rideId: payload.rideId },
            });
          }
          break;

        case "ride_cancelled":
          // Passenger or driver ride cancelled -> return to home
          if (role === "driver") {
            router.push("/(driver)/(drawer)/(tabs)/dashboard" as any);
          } else {
            router.push("/(passenger)/home" as any);
          }
          break;

        default:
          break;
      }
    } catch (routingErr) {
      console.warn("[Push] Failed to navigate from push notification:", routingErr);
    }
  };

  /**
   * Register a device token with backend
   */
  const register = async (tokenToRegister: string) => {
    if (!tokenToRegister || !isAuthenticated) return;
    try {
      const platform = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web";
      await registerDeviceToken({
        token: tokenToRegister,
        platform,
      });
      activeTokenRef.current = tokenToRegister;
      setDeviceToken(tokenToRegister);
      setIsRegistered(true);
      setError(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Failed to register push token";
      setError(message);
      console.warn("[Push] Token registration error:", message);
    }
  };

  /**
   * Unregister / remove token on logout
   */
  const unregister = async () => {
    if (!activeTokenRef.current) return;
    try {
      await removeDeviceToken(activeTokenRef.current);
    } catch (err: any) {
      console.warn("[Push] Failed to unregister push token:", err?.message);
    } finally {
      activeTokenRef.current = null;
      setDeviceToken(null);
      setIsRegistered(false);
    }
  };

  // Synchronize token registration when auth state changes
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      registerForPushNotificationsAsync().then((realToken) => {
        if (realToken && isMounted) {
          register(realToken);
        }
      });
    } else {
      if (activeTokenRef.current) {
        unregister();
      }
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Listen for user tapping a push notification
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as PushNotificationPayload;
      if (data) {
        handleNotificationNavigation(data);
      }
    });
    return () => {
      subscription.remove();
    };
  }, [role]);

  return {
    deviceToken,
    isRegistered,
    error,
    register,
    unregister,
    handleNotificationNavigation,
    isDevice: Device.isDevice,
  };
}
