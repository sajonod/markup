import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFiles } from "@/context/FilesContext";
import { useColors } from "@/hooks/useColors";
import { formatTimeAgo } from "@/utils/markdown";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getActiveFile, revertToVersion } = useFiles();

  const file = getActiveFile();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleRevert = (versionId: string, timestamp: number) => {
    if (!file) return;
    Alert.alert(
      "Revert to this version?",
      `This will restore the version from ${formatTimeAgo(timestamp)}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revert",
          onPress: () => {
            revertToVersion(file.id, versionId);
            router.back();
          },
        },
      ]
    );
  };

  const s = createStyles(colors, topPad, bottomPad);

  if (!file) {
    return (
      <View style={[s.root, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: colors.mutedForeground }}>No file selected</Text>
      </View>
    );
  }

  const versions = file.versions;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
          <Text style={[s.backText, { color: colors.foreground }]}>Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Version History</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPad + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.currentPreview}>
          <Text style={[s.previewTitle, { color: colors.foreground }]}>
            {file.name}
          </Text>
          <Text
            style={[s.previewContent, { color: colors.mutedForeground }]}
            numberOfLines={4}
          >
            {file.content.replace(/#{1,3}\s/g, "").slice(0, 200)}
          </Text>
        </View>

        {versions.length === 0 ? (
          <View style={s.empty}>
            <Feather name="clock" size={36} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
              No version history yet
            </Text>
            <Text style={[s.emptyHint, { color: colors.mutedForeground }]}>
              Versions are saved automatically as you edit
            </Text>
          </View>
        ) : (
          <View style={s.timeline}>
            {versions.map((version, index) => (
              <View key={version.id} style={s.timelineItem}>
                <View style={s.timelineLeft}>
                  <View
                    style={[
                      s.timelineDot,
                      {
                        backgroundColor:
                          index === 0 ? colors.primary : colors.border,
                        borderColor: colors.primary,
                      },
                    ]}
                  />
                  {index < versions.length - 1 && (
                    <View
                      style={[s.timelineLine, { backgroundColor: colors.border }]}
                    />
                  )}
                </View>

                <View style={s.timelineContent}>
                  <Text style={[s.timelineTime, { color: colors.foreground }]}>
                    {formatTimeAgo(version.timestamp)}
                  </Text>
                  <View
                    style={[
                      s.versionCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[s.versionSummary, { color: colors.mutedForeground }]}
                    >
                      {version.summary}
                    </Text>
                    <TouchableOpacity
                      style={[s.revertBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleRevert(version.id, version.timestamp)}
                    >
                      <Text style={[s.revertText, { color: colors.primaryForeground }]}>
                        Revert
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useColors>,
  topPad: number,
  bottomPad: number
) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: topPad + 8,
      paddingBottom: 12,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      width: 80,
    },
    backText: {
      fontSize: 15,
    },
    title: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.foreground,
    },
    currentPreview: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      gap: 8,
    },
    previewTitle: {
      fontSize: 18,
      fontWeight: "700",
    },
    previewContent: {
      fontSize: 14,
      lineHeight: 22,
    },
    empty: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      gap: 12,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: "500",
    },
    emptyHint: {
      fontSize: 13,
      textAlign: "center",
    },
    timeline: {
      gap: 0,
    },
    timelineItem: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 0,
    },
    timelineLeft: {
      alignItems: "center",
      width: 16,
    },
    timelineDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      marginTop: 4,
    },
    timelineLine: {
      width: 2,
      flex: 1,
      marginTop: 4,
      marginBottom: -4,
    },
    timelineContent: {
      flex: 1,
      paddingBottom: 24,
      gap: 8,
    },
    timelineTime: {
      fontSize: 16,
      fontWeight: "600",
    },
    versionCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 14,
      gap: 12,
    },
    versionSummary: {
      fontSize: 14,
      lineHeight: 20,
    },
    revertBtn: {
      alignSelf: "flex-end",
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 8,
    },
    revertText: {
      fontSize: 14,
      fontWeight: "600",
    },
  });
