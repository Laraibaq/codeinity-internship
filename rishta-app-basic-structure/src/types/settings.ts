export type ScreenType =
  | "settings"
  | "ownership"
  | "subscription"
  | "safety"
  | "boost"
  | "privacy"
  | "notifications"
  | "discovery"
  | "notification-preferences";

export type ToastType = "success" | "info" | "warning";

export interface ProfileOwnershipData {
  owner: string;
  managedBy: string;
  gender: string;
}

export interface NotificationItem {
  id: string;
  type:
    | "interest"
    | "match"
    | "message"
    | "verification"
    | "digest"
    | "view"
    | "boost"
    | "subscription";
  title: string;
  subtitle: string;
  time: string;
  read: boolean;
  avatar?: string;
  actionText?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  profilesVisible: string;
  interests: string;
  teasers: string;
  boost: string;
  popular?: boolean;
  current?: boolean;
}

export interface BoostPack {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  originalPrice?: string;
  popular?: boolean;
  count: number;
}

export interface DiscoveryPreferencesData {
  minAge: number;
  maxAge: number;
  location: string;
  maritalStatus: string[];
  religionSect: string[];
  nonSmoker: boolean;
  halalOnly: boolean;
  mustBeVerified: boolean;
}

export interface PrivacySettingsData {
  photoVisibility: "everyone" | "interests";
  hideProfile: boolean;
  showLastSeen: boolean;
}

export interface NotificationPreferencesData {
  pushInterest: boolean;
  inAppInterest: boolean;
  smsInterest: boolean;
  pushVerif: boolean;
  inAppVerif: boolean;
  smsVerif: boolean;
  pushMatch: boolean;
  inAppMatch: boolean;
  smsMatch: boolean;
}

export interface BlockedProfile {
  id: string;
  name: string;
  age: number;
  blockedDate: string;
}
