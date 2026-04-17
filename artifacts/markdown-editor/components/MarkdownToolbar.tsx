import * as Haptics from "expo-haptics";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface ToolbarItem {
  label: string;
  insertion?: string;
  wrapper?: string;
  prefix?: string;
  action?: string;
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { label: "H1", prefix: "# " },
  { label: "H2", prefix: "## " },
  { label: "B", wrapper: "**" },
  { label: "I", wrapper: "*" },
  { label: "[ ]", prefix: "- [ ] " },
  { label: "</>", prefix: "```\n", action: "code_block" },
  { label: "•", prefix: "- " },
  { label: "> ", prefix: "> " },
];

interface Props {
  onAction: (item: ToolbarItem) => void;
}

export function MarkdownToolbar({ onAction }: Props) {
  const colors = useColors();

  const handlePress = (item: ToolbarItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAction(item);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        {TOOLBAR_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.button,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() => handlePress(item)}
            activeOpacity={0.6}
          >
            <Text style={[styles.label, { color: colors.foreground }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export type { ToolbarItem };

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  scrollContent: {
    paddingHorizontal: 8,
    gap: 8,
    alignItems: "center",
  },
  button: {
    minWidth: 44,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
