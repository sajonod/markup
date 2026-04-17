import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Props {
  title?: string;
  subtitle?: string;
}

export function NativeAdBanner({ title = "Top Writing Tools for 2024", subtitle = "Sponsored" }: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.starContainer}>
        <Ionicons name="star" size={18} color="#f59e0b" />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      <Text style={[styles.ad, { color: colors.mutedForeground, borderColor: colors.border }]}>
        Ad
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  starContainer: {
    width: 8,
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  ad: {
    fontSize: 11,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
});
