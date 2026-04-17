import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  bottomInset: number;
}

export function BottomAdBanner({ bottomInset }: Props) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: bottomInset,
        },
      ]}
    >
      <TouchableOpacity style={styles.inner} activeOpacity={0.8}>
        <View style={styles.iconContainer}>
          <Ionicons name="star" size={16} color="#f59e0b" />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.adTitle, { color: colors.foreground }]} numberOfLines={1}>
            Local Backup Drive — Keep your files safe
          </Text>
          <Text style={[styles.adSub, { color: colors.mutedForeground }]}>Sponsored</Text>
        </View>
        <View style={[styles.adBadge, { borderColor: colors.border }]}>
          <Text style={[styles.adBadgeText, { color: colors.mutedForeground }]}>Ad</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(245,158,11,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
  },
  adTitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  adSub: {
    fontSize: 11,
    marginTop: 1,
  },
  adBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: "500",
  },
});
