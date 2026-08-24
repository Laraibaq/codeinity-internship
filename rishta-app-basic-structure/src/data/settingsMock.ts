import type {
  ProfileOwnershipData,
  NotificationItem,
  SubscriptionPlan,
  BoostPack,
  DiscoveryPreferencesData,
  PrivacySettingsData,
  NotificationPreferencesData,
  BlockedProfile,
} from "../types/settings";

export const initialProfileOwnership: ProfileOwnershipData = {
  owner: "My Daughter",
  managedBy: "Managed by Family",
  gender: "Female",
};

export const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "interest",
    title: "New interest received",
    subtitle: "Aisha M. expressed interest in your profile.",
    time: "2m ago",
    read: false,
  },
  {
    id: "2",
    type: "match",
    title: "Interest accepted (New Match!)",
    subtitle:
      "Bilal accepted your interest. Send a message to start connecting.",
    time: "1h ago",
    read: false,
  },
  {
    id: "3",
    type: "message",
    title: "New message from Zayd",
    subtitle:
      "As-salamu alaykum! I saw we both enjoy hiking and reading historical non-fiction...",
    time: "3h ago",
    read: false,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCsGlHnsddNLiRhLO-XBmhKuwIgGidRi02l_YBSxxNdf9WyMruFKKXZv6PsIlTQLDT6NkNiQExiNS2aX7ol9U8_QjBpOfzP7WVb9XjUizDwp6FqVeL4eVkPFiSs1VyUbbjuPldU9VKb-6n_kvpkUMKOyUIggHrZhd6MOuIbX6hmDUdTh8ZNtB3_FK1wcp0B10dsQDT3fmb9EFEZejKGmb6WwlNUvfUI-UnUHXT2vqz3aD21B55EXJtuSw",
  },
  {
    id: "4",
    type: "verification",
    title: "Verification approved",
    subtitle:
      "Your ID verification is complete. The trust badge has been added to your profile.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "5",
    type: "digest",
    title: "Suggestions digest",
    subtitle: "We found 5 new profiles that strongly match your preferences.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "6",
    type: "view",
    title: "Someone viewed your profile",
    subtitle: "A verified member from Lahore visited your profile.",
    time: "2d ago",
    read: true,
    actionText: "Upgrade to see who",
  },
  {
    id: "7",
    type: "boost",
    title: "Boost ended",
    subtitle: "Your profile boost has concluded. You received 4x more views!",
    time: "3d ago",
    read: true,
  },
  {
    id: "8",
    type: "subscription",
    title: "Subscription expiring",
    subtitle:
      "Your premium subscription expires in 3 days. Renew to maintain access to advanced filters.",
    time: "5d ago",
    read: true,
  },
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "PKR 0",
    period: "/mo",
    profilesVisible: "5 Profiles visible / day",
    interests: "2 Interests / day",
    teasers: "Many profiles locked",
    boost: "Boost: Buy add-on",
    current: false,
  },
  {
    id: "basic",
    name: "Basic",
    price: "PKR 1500",
    period: "/mo",
    profilesVisible: "20 Profiles visible / day",
    interests: "10 Interests / day",
    teasers: "Teasers beyond 20",
    boost: "Boost: Buy add-on",
    current: false,
  },
  {
    id: "standard",
    name: "Standard",
    price: "PKR 3000",
    period: "/mo",
    profilesVisible: "50 Profiles visible / day",
    interests: "25 Interests / day",
    teasers: "Teasers beyond 50",
    boost: "1 Boost / month included",
    current: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "PKR 6000",
    period: "/mo",
    profilesVisible: "Unlimited Profiles",
    interests: "Unlimited Interests",
    teasers: "No teasers, full access",
    boost: "1 Boost / week included",
    popular: true,
    current: true,
  },
];

export const boostPacks: BoostPack[] = [
  {
    id: "single",
    name: "Single Boost",
    subtitle: "One-time use",
    price: "Rs 500",
    count: 1,
  },
  {
    id: "pack3",
    name: "3 Boost Pack",
    subtitle: "Save 20%",
    price: "Rs 1200",
    originalPrice: "Rs 1500",
    popular: true,
    count: 3,
  },
  {
    id: "pack5",
    name: "5 Boost Pack",
    subtitle: "Best Value (Save 30%)",
    price: "Rs 1750",
    originalPrice: "Rs 2500",
    count: 5,
  },
];

export const initialBlockedProfiles: BlockedProfile[] = [
  { id: "b1", name: "Sajid", age: 31, blockedDate: "Blocked on Oct 12" },
  { id: "b2", name: "Omar", age: 28, blockedDate: "Blocked on Sep 05" },
];

export const initialDiscoveryPreferences: DiscoveryPreferencesData = {
  minAge: 22,
  maxAge: 30,
  location: "lahore",
  maritalStatus: ["Never Married"],
  religionSect: ["Sunni"],
  nonSmoker: false,
  halalOnly: true,
  mustBeVerified: true,
};

export const initialPrivacySettings: PrivacySettingsData = {
  photoVisibility: "interests",
  hideProfile: false,
  showLastSeen: true,
};

export const initialNotificationPreferences: NotificationPreferencesData = {
  pushInterest: true,
  inAppInterest: true,
  smsInterest: false,
  pushVerif: true,
  inAppVerif: true,
  smsVerif: true,
  pushMatch: true,
  inAppMatch: true,
  smsMatch: false,
};
