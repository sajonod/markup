import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { FileEntry } from "@/context/FilesContext";
import { formatTimeAgo } from "@/utils/markdown";

interface Props {
  file: FileEntry;
  onPress: () => void;
  onDelete: () => void;
  onRename: () => void;
}

function getDotColor(name: string, primary: string): string {
  if (name.endsWith(".md") || name.endsWith(".markdown")) return primary;
  if (name.endsWith(".txt")) return "#fbbf24";
  return "#93c5fd";
}

export function FileRow({ file, onPress, onDelete, onRename }: Props) {
  const colors = useColors();
  const dotColor = getDotColor(file.name, colors.primary);

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(file.name, "What would you like to do?", [
      { text: "Rename", onPress: onRename },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert("Delete File", `Delete "${file.name}"?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: onDelete },
          ]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={[styles.dot, { backgroundColor: dotColor, shadowColor: dotColor }]} />
      <View style={styles.meta}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={[styles.detail, { color: colors.mutedForeground }]}>
          {formatTimeAgo(file.updatedAt)} · {file.size} KB
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  detail: {
    fontSize: 12,
  },
});
