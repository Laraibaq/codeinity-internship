import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  useWindowDimensions,
} from "react-native";
import { Icon } from "./common/Icon";
import type { ScreenId, ScreenInfo } from "../types";

interface Props {
  screens: ScreenInfo[];
  currentScreenId: ScreenId;
  onSelectScreen: (id: ScreenId) => void;
  onNext: () => void;
  onPrev: () => void;
  viewMode: "mobile" | "responsive";
  onToggleViewMode: (mode: "mobile" | "responsive") => void;
}

/**
 * Demo / preview header that lets you jump between any onboarding screen.
 * In production this component would be removed — it exists only so the
 * whole flow can be showcased in a single build.
 */
export const ScreenSelectorHeader: React.FC<Props> = ({
  screens,
  currentScreenId,
  onSelectScreen,
  onNext,
  onPrev,
  viewMode,
  onToggleViewMode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const currentIndex = screens.findIndex((s) => s.id === currentScreenId);
  const currentScreen = screens[currentIndex] || screens[0];

  return (
    <View className="bg-primary px-4 py-2.5 flex-row items-center justify-between border-b border-primary-container">
      {/* Brand + selector */}
      <View className="flex-row items-center gap-3 flex-1">
        <View className="flex-row items-center gap-2">
          <Icon name="favorite" size={20} color="#B45309" fill />
          {isDesktop && (
            <Text className="font-display font-bold text-lg text-white">
              Rishta Showcase
            </Text>
          )}
        </View>

        {isDesktop && <View className="h-4 w-px bg-white/20" />}

        {/* Dropdown trigger */}
        <Pressable
          onPress={() => setIsOpen(true)}
          className="flex-row items-center gap-2 bg-primary-container active:bg-surface-tint px-3 py-1.5 rounded-lg border border-white/10 flex-shrink"
        >
          <Text className="text-primary-on-container text-xs font-semibold">
            Screen {currentScreen.stepNumber}/{screens.length}:
          </Text>
          <Text
            className="text-white text-xs font-semibold"
            numberOfLines={1}
            style={{ maxWidth: isDesktop ? 220 : 130 }}
          >
            {currentScreen.title}
          </Text>
          <Icon name="expand_more" size={14} color="#ffffff" />
        </Pressable>
      </View>

      {/* Right side controls */}
      <View className="flex-row items-center gap-2">
        {isDesktop && (
          <View className="flex-row bg-primary-container p-0.5 rounded-lg border border-white/10">
            <Pressable
              onPress={() => onToggleViewMode("mobile")}
              className={`px-2.5 py-1 rounded flex-row items-center gap-1 ${
                viewMode === "mobile" ? "bg-white" : ""
              }`}
            >
              <Icon
                name="smartphone"
                size={14}
                color={viewMode === "mobile" ? "#003527" : "#ffffff"}
              />
              <Text
                className={`text-xs font-semibold ${
                  viewMode === "mobile" ? "text-primary" : "text-white"
                }`}
              >
                Mobile
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onToggleViewMode("responsive")}
              className={`px-2.5 py-1 rounded flex-row items-center gap-1 ${
                viewMode === "responsive" ? "bg-white" : ""
              }`}
            >
              <Icon
                name="aspect_ratio"
                size={14}
                color={viewMode === "responsive" ? "#003527" : "#ffffff"}
              />
              <Text
                className={`text-xs font-semibold ${
                  viewMode === "responsive" ? "text-primary" : "text-white"
                }`}
              >
                Full
              </Text>
            </Pressable>
          </View>
        )}

        <Pressable
          onPress={onPrev}
          disabled={currentIndex === 0}
          className="p-1.5 rounded-lg bg-primary-container active:bg-surface-tint"
          style={{ opacity: currentIndex === 0 ? 0.4 : 1 }}
        >
          <Icon name="chevron_left" size={18} color="#ffffff" />
        </Pressable>

        <Text className="text-primary-on-container text-xs font-semibold">
          {currentIndex + 1} / {screens.length}
        </Text>

        <Pressable
          onPress={onNext}
          disabled={currentIndex === screens.length - 1}
          className="p-1.5 rounded-lg bg-primary-container active:bg-surface-tint"
          style={{ opacity: currentIndex === screens.length - 1 ? 0.4 : 1 }}
        >
          <Icon name="chevron_right" size={18} color="#ffffff" />
        </Pressable>
      </View>

      {/* Dropdown modal (works on web & native) */}
      <Modal
        transparent
        visible={isOpen}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 items-center justify-start pt-16 px-4"
          onPress={() => setIsOpen(false)}
        >
          <Pressable
            className="w-full max-w-sm bg-surface-white rounded-xl border border-border-subtle overflow-hidden"
            onPress={(e) => e.stopPropagation()}
            style={{ maxHeight: "80%" }}
          >
            <View className="px-3 py-2 border-b border-border-subtle flex-row justify-between items-center">
              <Text className="text-xs font-semibold uppercase tracking-wider text-outline">
                Select Screen ({screens.length} total)
              </Text>
              <Text className="text-xs text-primary font-semibold">
                Interactive
              </Text>
            </View>
            <ScrollView>
              {screens.map((screen) => {
                const isSelected = screen.id === currentScreenId;
                return (
                  <Pressable
                    key={screen.id}
                    onPress={() => {
                      onSelectScreen(screen.id);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 flex-row items-center justify-between ${
                      isSelected ? "bg-primary" : "active:bg-surface-container-low"
                    }`}
                  >
                    <View className="flex-row items-center gap-2 flex-1">
                      <View
                        className={`px-1.5 py-0.5 rounded ${
                          isSelected ? "bg-primary-fixed" : "bg-surface-container"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-semibold ${
                            isSelected ? "text-primary" : "text-on-surface-variant"
                          }`}
                        >
                          Step {screen.stepNumber}
                        </Text>
                      </View>
                      <Text
                        className={`text-xs flex-1 ${
                          isSelected
                            ? "text-white font-semibold"
                            : "text-on-surface"
                        }`}
                        numberOfLines={1}
                      >
                        {screen.title}
                      </Text>
                    </View>
                    <Text
                      className={`text-[10px] ml-2 ${
                        isSelected ? "text-primary-on-container" : "text-outline"
                      }`}
                    >
                      {screen.category}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
