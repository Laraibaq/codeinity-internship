import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import type {
  UserAccount,
  Profile,
  RequestItem,
  Conversation,
  UserRole,
  NavTab,
} from "../types/social";
import {
  INITIAL_USER,
  MOCK_PROFILES,
  INITIAL_REQUESTS,
  INITIAL_CONVERSATIONS,
} from "../data/socialMock";

interface SocialContextValue {
  user: UserAccount;
  setUser: React.Dispatch<React.SetStateAction<UserAccount>>;
  requests: RequestItem[];
  matches: Profile[];
  conversations: Conversation[];
  activeChatConvId: string | null;
  setActiveChatConvId: (id: string | null) => void;
  matchedCelebrationProfile: Profile | null;
  setMatchedCelebrationProfile: (p: Profile | null) => void;
  showDailyLimitModal: boolean;
  setShowDailyLimitModal: (v: boolean) => void;
  showNotifications: boolean;
  setShowNotifications: (v: boolean) => void;
  pendingRequestsCount: number;
  unreadMessagesCount: number;
  profiles: Profile[];
  handleAcceptRequest: (reqId: string) => void;
  handleDeclineRequest: (reqId: string) => void;
  handleWithdrawRequest: (reqId: string) => void;
  handleSendInterest: (profile: Profile) => void;
  handleOpenChat: (profileId: string) => void;
  handleSendMessage: (convId: string, text: string) => void;
  handleUpdateRole: (role: UserRole, managerName: string) => void;
  handleUpgradePlan: () => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

const SocialContext = createContext<SocialContextValue | null>(null);

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount>(INITIAL_USER);
  const [activeTab, setActiveTab] = useState<NavTab>("explore");
  const [requests, setRequests] = useState<RequestItem[]>(INITIAL_REQUESTS);
  const [matches, setMatches] = useState<Profile[]>([
    MOCK_PROFILES[2],
    MOCK_PROFILES[3],
    MOCK_PROFILES[4],
    MOCK_PROFILES[5],
  ]);
  const [conversations, setConversations] = useState<Conversation[]>(
    INITIAL_CONVERSATIONS,
  );
  const [activeChatConvId, setActiveChatConvId] = useState<string | null>(null);
  const [matchedCelebrationProfile, setMatchedCelebrationProfile] =
    useState<Profile | null>(null);
  const [showDailyLimitModal, setShowDailyLimitModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const pendingRequestsCount = requests.filter(
    (r) => r.type === "received" && r.status === "pending",
  ).length;

  const unreadMessagesCount = conversations.reduce(
    (acc, curr) => acc + curr.unreadCount,
    0,
  );

  const handleAcceptRequest = useCallback(
    (reqId: string) => {
      const targetReq = requests.find((r) => r.id === reqId);
      if (!targetReq) return;

      setRequests((prev) =>
        prev.map((r) =>
          r.id === reqId ? { ...r, status: "accepted" as const } : r,
        ),
      );

      const newProfile = targetReq.profile;
      setMatches((prev) => {
        if (prev.some((p) => p.id === newProfile.id)) return prev;
        return [{ ...newProfile, isNew: true }, ...prev];
      });

      const existingConv = conversations.find(
        (c) => c.profile.id === newProfile.id,
      );
      if (!existingConv) {
        const newConv: Conversation = {
          id: `conv_${newProfile.id}`,
          profile: newProfile,
          lastMessage: "You are now connected! Say salaam.",
          lastTime: "Just now",
          unreadCount: 0,
          matchedDate: "Today",
          messages: [
            {
              id: `msg_init_${Date.now()}`,
              senderId: "user",
              text: `Assalam-o-Alaikum ${newProfile.name}. We accepted your request and look forward to connecting!`,
              timestamp: "Just now",
            },
          ],
        };
        setConversations((prev) => [newConv, ...prev]);
      }

      setMatchedCelebrationProfile(newProfile);
    },
    [requests, conversations],
  );

  const handleDeclineRequest = useCallback((reqId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId ? { ...r, status: "declined" as const } : r,
      ),
    );
  }, []);

  const handleWithdrawRequest = useCallback((reqId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId ? { ...r, status: "withdrawn" as const } : r,
      ),
    );
  }, []);

  const handleSendInterest = useCallback(
    (profile: Profile) => {
      if (
        user.tier === "basic" &&
        user.interestsUsedToday >= user.interestsDailyLimit
      ) {
        setShowDailyLimitModal(true);
        return;
      }

      setUser((prev) => ({
        ...prev,
        interestsUsedToday: prev.interestsUsedToday + 1,
      }));

      const newReq: RequestItem = {
        id: `req_sent_${Date.now()}`,
        profile,
        timestamp: "Just now",
        type: "sent",
        status: "pending",
      };
      setRequests((prev) => [newReq, ...prev]);

      if (["zayd_1", "sana_1", "aisha_1"].includes(profile.id)) {
        setMatches((prev) => {
          if (prev.some((p) => p.id === profile.id)) return prev;
          return [{ ...profile, isNew: true }, ...prev];
        });
        setMatchedCelebrationProfile(profile);
      }
    },
    [user],
  );

  const handleOpenChat = useCallback(
    (profileId: string) => {
      let conv = conversations.find((c) => c.profile.id === profileId);
      if (!conv) {
        const profile = MOCK_PROFILES.find((p) => p.id === profileId);
        if (!profile) return;
        conv = {
          id: `conv_${profile.id}`,
          profile,
          lastMessage: "You matched! Say salaam.",
          lastTime: "Just now",
          unreadCount: 0,
          matchedDate: "Today",
          messages: [
            {
              id: `msg_${Date.now()}`,
              senderId: "user",
              text: `Assalam-o-Alaikum, ${profile.name}.`,
              timestamp: "Just now",
            },
          ],
        };
        setConversations((prev) => [conv!, ...prev]);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conv!.id ? { ...c, unreadCount: 0 } : c,
          ),
        );
      }
      setActiveChatConvId(conv.id);
    },
    [conversations],
  );

  const handleSendMessage = useCallback((convId: string, text: string) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg = {
      id: `msg_u_${Date.now()}`,
      senderId: "user",
      text,
      timestamp,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        return {
          ...c,
          lastMessage: text,
          lastTime: timestamp,
          messages: [...c.messages, userMsg],
        };
      }),
    );

    setTimeout(() => {
      const replyMsg = {
        id: `msg_p_${Date.now()}`,
        senderId: "partner",
        text: `Jazakallah khair! Thank you for your message. Our family has received this and we will reply shortly, Insha'Allah.`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          return {
            ...c,
            lastMessage: replyMsg.text,
            lastTime: replyMsg.timestamp,
            messages: [...c.messages, replyMsg],
          };
        }),
      );
    }, 1200);
  }, []);

  const handleUpdateRole = useCallback(
    (role: UserRole, managerName: string) => {
      setUser((prev) => ({
        ...prev,
        managerRole: role,
        name: managerName,
      }));
    },
    [],
  );

  const handleUpgradePlan = useCallback(() => {
    setUser((prev) => ({
      ...prev,
      tier: "premium",
      interestsDailyLimit: 999,
      viewsDailyLimit: 999,
    }));
    setShowDailyLimitModal(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      requests,
      matches,
      conversations,
      activeChatConvId,
      setActiveChatConvId,
      matchedCelebrationProfile,
      setMatchedCelebrationProfile,
      showDailyLimitModal,
      setShowDailyLimitModal,
      showNotifications,
      setShowNotifications,
      pendingRequestsCount,
      unreadMessagesCount,
      profiles: MOCK_PROFILES,
      handleAcceptRequest,
      handleDeclineRequest,
      handleWithdrawRequest,
      handleSendInterest,
      handleOpenChat,
      handleSendMessage,
      handleUpdateRole,
      handleUpgradePlan,
      activeTab,
      setActiveTab,
    }),
    [
      user,
      requests,
      matches,
      conversations,
      activeChatConvId,
      matchedCelebrationProfile,
      showDailyLimitModal,
      showNotifications,
      pendingRequestsCount,
      unreadMessagesCount,
      handleAcceptRequest,
      handleDeclineRequest,
      handleWithdrawRequest,
      handleSendInterest,
      handleOpenChat,
      handleSendMessage,
      handleUpdateRole,
      handleUpgradePlan,
      activeTab,
    ],
  );

  return (
    <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
  );
}

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error("useSocial must be used within SocialProvider");
  return ctx;
}
