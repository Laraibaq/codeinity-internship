import React, { useState, useEffect } from "react";
import { View, Platform, useWindowDimensions, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";

import { ScreenSelectorHeader } from "../src/components/ScreenSelectorHeader";
import { PhoneVerificationScreen } from "../src/components/screens/PhoneVerificationScreen";
import { EnterCodeScreen } from "../src/components/screens/EnterCodeScreen";
import { WhoIsProfileForScreen } from "../src/components/screens/WhoIsProfileForScreen";
import { GenderScreen } from "../src/components/screens/GenderScreen";
import { BasicDetailsScreen } from "../src/components/screens/BasicDetailsScreen";
import { WhatLookingForScreen } from "../src/components/screens/WhatLookingForScreen";
import { EducationWorkScreen } from "../src/components/screens/EducationWorkScreen";
import { DemographicsScreen } from "../src/components/screens/DemographicsScreen";
import { LifestyleInterestsScreen } from "../src/components/screens/LifestyleInterestsScreen";
import { FamilyBackgroundScreen } from "../src/components/screens/FamilyBackgroundScreen";
import { AddPhotosScreen } from "../src/components/screens/AddPhotosScreen";
import { CommunityPromiseScreen } from "../src/components/screens/CommunityPromiseScreen";
import { VerificationScreen } from "../src/components/screens/VerificationScreen";
import { ChoosePlanScreen } from "../src/components/screens/ChoosePlanScreen";
import { ProfileActivatingScreen } from "../src/components/screens/ProfileActivatingScreen";

import { SCREENS_INFO, INITIAL_FORM_DATA } from "../src/screensRegistry";
import type { ScreenId, UserFormData } from "../src/types";
import { Icon } from "../src/components/common/Icon";

const VALID_IDS = new Set<ScreenId>(SCREENS_INFO.map((s) => s.id));

function readHashScreen(): ScreenId | null {
  if (Platform.OS !== "web") return null;
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "") as ScreenId;
  return VALID_IDS.has(raw) ? raw : null;
}

export default function OnboardingShowcase() {
  const router = useRouter();
  const [currentScreenId, setCurrentScreenId] = useState<ScreenId>(
    () => readHashScreen() ?? "phone-verification",
  );

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    if (window.location.hash.replace(/^#/, "") !== currentScreenId) {
      window.history.replaceState(null, "", `#${currentScreenId}`);
    }
  }, [currentScreenId]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onHashChange = () => {
      const next = readHashScreen();
      if (next) setCurrentScreenId(next);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const [formData, setFormData] = useState<UserFormData>(INITIAL_FORM_DATA);
  const [viewMode, setViewMode] = useState<"mobile" | "responsive">("mobile");

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const currentIndex = SCREENS_INFO.findIndex((s) => s.id === currentScreenId);

  const updateFormData = (fields: Partial<UserFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const goToNext = () => {
    if (currentIndex < SCREENS_INFO.length - 1) {
      setCurrentScreenId(SCREENS_INFO[currentIndex + 1].id);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentScreenId(SCREENS_INFO[currentIndex - 1].id);
    }
  };

  const enterApp = () => {
    router.replace("/(tabs)/explore");
  };

  const renderActiveScreen = () => {
    switch (currentScreenId) {
      case "phone-verification":
        return (
          <PhoneVerificationScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNext}
          />
        );
      case "enter-code":
        return (
          <EnterCodeScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNext}
            onBack={goToPrev}
          />
        );
      case "who-is-profile-for":
        return (
          <WhoIsProfileForScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNext}
            onBack={goToPrev}
          />
        );
      case "gender":
        return (
          <GenderScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNext}
            onBack={goToPrev}
          />
        );
      case "basic-details":
        return (
          <BasicDetailsScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNext}
            onBack={goToPrev}
          />
        );
      case "what-looking-for":
        return (
          <WhatLookingForScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNext}
            onBack={goToPrev}
          />
        );
      case "education-work":
        return (
          <EducationWorkScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNext}
            onBack={goToPrev}
          />
        );
      case "demographics":
        return (
          <DemographicsScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNext}
            onBack={goToPrev}
          />
        );
      case "lifestyle-interests":
        return (
          <LifestyleInterestsScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNext}
            onBack={goToPrev}
          />
        );
      case "family-background":
        return (
          <FamilyBackgroundScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNext}
            onBack={goToPrev}
          />
        );
      case "add-photos":
        return (
          <AddPhotosScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNext}
            onBack={goToPrev}
          />
        );
      case "community-promise":
        return (
          <CommunityPromiseScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNext}
          />
        );
      case "verification":
        return <VerificationScreen onNext={goToNext} onSkip={goToNext} />;
      case "choose-plan":
        return (
          <ChoosePlanScreen
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNext}
            onBack={goToPrev}
          />
        );
      case "profile-activating":
        return <ProfileActivatingScreen onSeeMatches={enterApp} />;
      default:
        return null;
    }
  };

  const showFrame = isDesktop;

  return (
    <View className="flex-1 bg-surface-container">
      <View className="flex-row items-center px-3 pt-2 gap-2">
        <Pressable
          onPress={() => router.replace("/")}
          className="flex-row items-center gap-1 px-2 py-1.5 rounded-full bg-surface-white border border-border-subtle"
        >
          <Icon name="home" size={16} color="#003527" />
          <Text className="font-body text-xs text-primary font-semibold">
            Home
          </Text>
        </Pressable>
      </View>

      <ScreenSelectorHeader
        screens={SCREENS_INFO}
        currentScreenId={currentScreenId}
        onSelectScreen={setCurrentScreenId}
        onNext={goToNext}
        onPrev={goToPrev}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />

      <View className="flex-1 items-center justify-start">
        {showFrame && viewMode === "mobile" ? (
          <View
            className="mt-4 bg-background rounded-3xl border border-border-subtle overflow-hidden shadow-2xl"
            style={{ width: 430, height: 844 }}
          >
            {renderActiveScreen()}
          </View>
        ) : showFrame ? (
          <View className="mt-4 mb-4 w-full max-w-5xl bg-background rounded-2xl border border-border-subtle overflow-hidden shadow-xl flex-1">
            {renderActiveScreen()}
          </View>
        ) : (
          <View className="flex-1 w-full bg-background">
            {renderActiveScreen()}
          </View>
        )}
      </View>
    </View>
  );
}
