export type NavTab = "explore" | "requests" | "matches" | "inbox" | "profile";

export type UserRole = "self" | "parent" | "sibling" | "guardian";

export interface Profile {
  id: string;
  name: string;
  age: number;
  city: string;
  country: string;
  occupation: string;
  sect: string;
  maritalStatus: string;
  managedBy: "Family" | "Self";
  managerRole?: string;
  avatar: string;
  verified: boolean;
  isNew?: boolean;
  education?: string;
  height?: string;
  casteSect?: string;
  bio?: string;
  interestsCount?: number;
}

export interface RequestItem {
  id: string;
  profile: Profile;
  timestamp: string;
  type: "received" | "sent";
  status: "pending" | "accepted" | "declined" | "withdrawn";
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  profile: Profile;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  messages: ChatMessage[];
  matchedDate: string;
}

export type MembershipTier = "basic" | "standard" | "premium";

export interface UserAccount {
  id: string;
  name: string;
  managingFor: string;
  managerRole: UserRole;
  avatar: string;
  tier: MembershipTier;
  interestsUsedToday: number;
  interestsDailyLimit: number;
  viewsUsedToday: number;
  viewsDailyLimit: number;
}
