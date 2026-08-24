import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../common/Icon";
import type { ScreenType, BlockedProfile, ToastType } from "../../types/settings";

interface SafetyCenterScreenProps {
  onNavigate: (screen: ScreenType) => void;
  blockedProfiles: BlockedProfile[];
  onUnblockProfile: (id: string) => void;
  onBlockProfile: (name: string, age: number) => void;
  showToast: (msg: string, type?: ToastType) => void;
}

const REPORT_REASONS = [
  { value: "fake", label: "Fake profile / Misrepresentation" },
  { value: "harassment", label: "Inappropriate or offensive messages" },
  { value: "financial", label: "Financial fraud / Scam attempt" },
  { value: "other", label: "Other policy violation" },
];

const GUIDELINES = [
  {
    id: "acc1",
    title: "Respect & Kindness",
    body: "We expect all members to treat each other with utmost respect. Any form of derogatory language, insult, or dismissive behavior is strictly prohibited. Communication should reflect the values of Matrimonial Grace.",
  },
  {
    id: "acc2",
    title: "Honesty & Authenticity",
    body: "Profiles must accurately represent you. Using false images, misrepresenting age, marital status, or intentions undermines the trust of our community. Verified profiles are held to the highest standard.",
  },
  {
    id: "acc3",
    title: "Anti-Harassment Policy",
    body: "Harassment of any kind, including repeated unwanted contact, threats, or inappropriate requests, will result in immediate suspension. If you feel uncomfortable, please use the block or report features immediately.",
  },
];

export const SafetyCenterScreen: React.FC<SafetyCenterScreenProps> = ({
  onNavigate,
  blockedProfiles,
  onUnblockProfile,
  onBlockProfile,
  showToast,
}) => {
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(
    "acc1"
  );
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [blockName, setBlockName] = useState("");

  const toggleAccordion = (id: string) => {
    setExpandedAccordion(expandedAccordion === id ? null : id);
  };

  const handleSendReport = () => {
    if (!reportReason) return;
    setShowReportModal(false);
    setReportReason("");
    setReportDetails("");
    showToast(
      "Report submitted anonymously. Our trust team is reviewing it.",
      "success"
    );
  };

  const handleAddBlock = () => {
    if (!blockName.trim()) return;
    const name = blockName.trim();
    onBlockProfile(name, 30);
    setBlockName("");
    setShowAddBlockModal(false);
    showToast(`Blocked ${name}`, "info");
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="border-b border-border-subtle bg-background flex-row justify-between items-center px-5 h-14">
        <Pressable
          onPress={() => onNavigate("settings")}
          className="w-12 h-12 -ml-2 items-center justify-center active:opacity-80"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow_back" size={20} color="#003527" />
        </Pressable>
        <Text className="font-display text-xl font-semibold text-primary">
          Safety Center
        </Text>
        <View className="w-12 h-12 items-center justify-center">
          <Icon name="shield_person" size={20} color="#B45309" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-6 pb-24 gap-6 max-w-2xl self-center w-full"
      >
        <View className="items-center pb-2 gap-2">
          <Text className="font-display text-2xl font-bold text-primary text-center">
            Your safety is our priority.
          </Text>
          <Text className="text-sm text-on-surface-variant text-center leading-relaxed font-body">
            We are committed to providing a secure and respectful environment
            for you to find your life partner.
          </Text>
        </View>

        <Pressable
          onPress={() => setShowReportModal(true)}
          className="flex-row items-center justify-between p-4 bg-error-container rounded-xl border border-error/20 active:opacity-90"
        >
          <View className="flex-row items-center gap-4 flex-1">
            <View className="bg-error w-10 h-10 rounded-full items-center justify-center">
              <Icon name="alert_octagon" size={20} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="font-display text-lg font-semibold text-[#93000a]">
                Report a concern
              </Text>
              <Text className="text-sm text-[#93000a] opacity-90 font-body">
                Anonymously report suspicious behavior
              </Text>
            </View>
          </View>
          <Icon name="chevron_right" size={20} color="#93000a" />
        </Pressable>

        {/* Blocked Profiles */}
        <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
          <View className="p-4 border-b border-border-subtle flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-primary-container/10 items-center justify-center">
                <Icon name="person" size={16} color="#064e3b" />
              </View>
              <Text className="font-display text-xl font-semibold text-primary">
                Blocked Profiles
              </Text>
            </View>
            <Pressable onPress={() => setShowAddBlockModal(true)}>
              <Text className="text-xs font-semibold text-primary-container">
                + Block Member
              </Text>
            </Pressable>
          </View>

          {blockedProfiles.length === 0 ? (
            <View className="p-6 items-center">
              <Text className="text-outline text-sm font-body">
                No blocked profiles.
              </Text>
            </View>
          ) : (
            blockedProfiles.map((profile, idx) => (
              <View key={profile.id}>
                {idx > 0 && <View className="h-px bg-border-subtle" />}
                <View className="p-4 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-4 flex-1">
                    <View className="w-12 h-12 rounded-full border border-border-subtle bg-surface-container items-center justify-center">
                      <Icon name="person" size={24} color="#707974" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-display text-lg font-semibold text-on-surface">
                        {profile.name}, {profile.age}
                      </Text>
                      <Text className="text-sm text-on-surface-variant font-body">
                        {profile.blockedDate}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => {
                      onUnblockProfile(profile.id);
                      showToast(`Unblocked ${profile.name}`, "info");
                    }}
                    className="px-4 py-2 border-[1.5px] border-primary rounded-lg min-w-[90px] items-center active:bg-primary-container"
                  >
                    <Text className="text-primary text-xs font-semibold">
                      Unblock
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Community Guidelines Accordion */}
        <View className="bg-surface-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
          <View className="p-4 border-b border-border-subtle">
            <Text className="font-display text-xl font-semibold text-primary">
              Community Guidelines
            </Text>
          </View>

          {GUIDELINES.map((item, idx) => (
            <View key={item.id}>
              {idx > 0 && <View className="h-px bg-border-subtle" />}
              <Pressable
                onPress={() => toggleAccordion(item.id)}
                className="flex-row items-center justify-between p-4 active:bg-surface-container-low"
              >
                <Text className="text-base font-medium text-on-surface flex-1 font-body">
                  {item.title}
                </Text>
                <View
                  style={{
                    transform: [
                      {
                        rotate:
                          expandedAccordion === item.id ? "180deg" : "0deg",
                      },
                    ],
                  }}
                >
                  <Icon name="expand_more" size={20} color="#707974" />
                </View>
              </Pressable>
              {expandedAccordion === item.id && (
                <View className="px-4 pb-4">
                  <Text className="text-sm text-on-surface-variant leading-relaxed font-body">
                    {item.body}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Report Modal */}
      <Modal visible={showReportModal} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-on-background/40 items-center justify-center p-4"
          onPress={() => setShowReportModal(false)}
        >
          <Pressable
            className="bg-surface-white rounded-xl shadow-xl border border-border-subtle w-full max-w-md p-6 gap-4"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center gap-3">
              <Icon name="alert_octagon" size={24} color="#93000a" />
              <Text className="font-display text-xl font-bold text-[#93000a]">
                Report a Concern
              </Text>
            </View>
            <Text className="text-sm text-on-surface-variant font-body">
              Your report is strictly confidential. Select the nature of your
              concern:
            </Text>

            <View className="gap-2">
              {REPORT_REASONS.map((reason) => (
                <Pressable
                  key={reason.value}
                  onPress={() => setReportReason(reason.value)}
                  className={`p-3 rounded-lg border ${
                    reportReason === reason.value
                      ? "border-primary-container bg-primary-container/5"
                      : "border-border-subtle bg-background"
                  }`}
                >
                  <Text className="text-sm text-on-surface font-body">
                    {reason.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={reportDetails}
              onChangeText={setReportDetails}
              placeholder="Additional details (optional)..."
              placeholderTextColor="#707974"
              multiline
              numberOfLines={3}
              className="w-full p-3 border border-border-subtle rounded-lg text-sm bg-background text-on-surface font-body min-h-[80px]"
              textAlignVertical="top"
            />

            <View className="flex-row gap-3 pt-2">
              <Pressable
                onPress={() => setShowReportModal(false)}
                className="flex-1 py-2.5 border border-border-subtle rounded-lg items-center active:bg-surface-container-low"
              >
                <Text className="text-sm font-medium text-on-surface-variant">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSendReport}
                disabled={!reportReason}
                className={`flex-1 py-2.5 rounded-lg items-center flex-row justify-center gap-2 ${
                  reportReason ? "bg-error active:opacity-90" : "bg-error/40"
                }`}
              >
                <Icon name="send" size={16} color="#ffffff" />
                <Text className="text-sm font-medium text-white">Submit</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Block Modal */}
      <Modal visible={showAddBlockModal} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-on-background/40 items-center justify-center p-4"
          onPress={() => setShowAddBlockModal(false)}
        >
          <Pressable
            className="bg-surface-white rounded-xl shadow-xl border border-border-subtle w-full max-w-sm p-6 gap-4"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="font-display text-xl font-bold text-primary">
              Block a Member
            </Text>
            <Text className="text-sm text-on-surface-variant font-body">
              Enter the name or profile identifier you wish to block:
            </Text>
            <TextInput
              value={blockName}
              onChangeText={setBlockName}
              placeholder="Profile Name (e.g. Tariq)"
              placeholderTextColor="#707974"
              className="w-full p-3 border border-border-subtle rounded-lg text-sm bg-background text-on-surface font-body"
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowAddBlockModal(false)}
                className="flex-1 py-2.5 border border-border-subtle rounded-lg items-center active:bg-surface-container-low"
              >
                <Text className="text-sm font-medium text-on-surface-variant">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAddBlock}
                disabled={!blockName.trim()}
                className={`flex-1 py-2.5 rounded-lg items-center ${
                  blockName.trim()
                    ? "bg-primary active:bg-primary-container"
                    : "bg-primary/40"
                }`}
              >
                <Text className="text-sm font-medium text-white">Block</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};
