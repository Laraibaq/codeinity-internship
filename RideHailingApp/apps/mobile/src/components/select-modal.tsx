import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { themeColors } from "@/constants/theme-colors";

// Shared modal-based select, used wherever this project needs a "pick one from a list" field with
// no native `<select>`/picker-package equivalent (register-license-details.tsx's Issuing State,
// register-vehicle-model.tsx's Year of Manufacture). A Modal with a scrollable list of Pressable
// rows, matching the project's established Modal styling (reset-password.tsx's centered card over a
// bg-black/50 backdrop). The backdrop itself is a Pressable that closes on tap; the card is also a
// Pressable with a no-op onPress so taps inside it don't fall through to the backdrop's onPress.

export function SelectModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/50 px-container-margin"
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          className="max-h-[70%] w-full max-w-sm overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
          style={{
            shadowColor: "#111827",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.12,
            shadowRadius: 32,
            elevation: 12,
          }}
        >
          <View className="flex-row items-center justify-between border-b border-outline-variant p-gutter">
            <Text className="font-body-md text-body-md font-semibold text-on-surface">{title}</Text>
            <Pressable
              onPress={onClose}
              className="items-center justify-center rounded-full p-1 active:scale-95"
            >
              <MaterialIcons name="close" size={20} color={themeColors.onSurfaceVariant} />
            </Pressable>
          </View>
          <ScrollView>
            {options.map((option) => {
              const selected = option === selectedValue;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    onSelect(option);
                    onClose();
                  }}
                  className={`flex-row items-center justify-between px-gutter py-3 ${
                    selected ? "bg-primary-container" : ""
                  }`}
                >
                  <Text
                    className="font-body-md text-body-md"
                    style={{
                      color: selected ? themeColors.onPrimaryContainer : themeColors.onSurface,
                      fontWeight: selected ? "600" : "400",
                    }}
                  >
                    {option}
                  </Text>
                  {selected ? (
                    <MaterialIcons name="check" size={18} color={themeColors.onPrimaryContainer} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
