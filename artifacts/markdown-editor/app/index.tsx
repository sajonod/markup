import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeAdBanner } from "@/components/NativeAdBanner";
import { BottomAdBanner } from "@/components/BottomAdBanner";
import { FileRow } from "@/components/FileRow";
import { FileNameDialog } from "@/components/FileNameDialog";
import { useFiles } from "@/context/FilesContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { files, createFile, deleteFile, setActiveFileId, renameFile, importFile } = useFiles();
  const [search, setSearch] = useState("");
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredFiles = useMemo(
    () => files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())),
    [files, search]
  );

  const handleOpenFile = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFileId(id);
    router.push("/editor");
  };

  const handleNewFile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const file = createFile("Untitled.md");
    setActiveFileId(file.id);
    router.push("/editor");
  };

  const handleOpenFromDevice = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "File picker is only available on iOS and Android.");
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/plain", "text/markdown", "*/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const name = asset.name;
      const lowerName = name.toLowerCase();
      const mimeType = (asset.mimeType ?? "").toLowerCase();

      if (
        !lowerName.endsWith(".md") &&
        !lowerName.endsWith(".markdown") &&
        !lowerName.endsWith(".txt") &&
        mimeType !== "text/plain" &&
        mimeType !== "text/markdown" &&
        mimeType !== "text/x-markdown"
      ) {
        Alert.alert("Unsupported file", "Please open a .md, .markdown, or .txt file.");
        return;
      }

      // Check file size (limit to 10MB)
      if (asset.size && asset.size > 10 * 1024 * 1024) {
        Alert.alert("File too large", "Please select a file smaller than 10MB.");
        return;
      }

      const content = await new File(asset.uri).text();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newFile = importFile(name, content, { sourceUri: asset.uri });
      setActiveFileId(newFile.id);
      router.push("/editor");
    } catch (error) {
      console.error("File opening error:", error);
      let errorMessage = "Could not open the file. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("encoding")) {
          errorMessage = "File encoding not supported. Please ensure the file is UTF-8 encoded.";
        } else if (error.message.includes("permission") || error.message.includes("access")) {
          errorMessage = "Permission denied. Please check file permissions and try again.";
        } else if (error.message.includes("size") || error.message.includes("large")) {
          errorMessage = "File is too large to open. Please select a smaller file.";
        }
      }

      Alert.alert("Error opening file", errorMessage);
    }
  };

  const handleRename = (id: string, currentName: string) => {
    setRenameTarget({ id, name: currentName });
  };

  const handleRenameConfirm = (nextName: string) => {
    if (!renameTarget) return;
    renameFile(renameTarget.id, nextName);
    setRenameTarget(null);
  };

  const s = createStyles(colors, topPad, bottomPad);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <FileNameDialog
        visible={renameTarget !== null}
        title="Rename file"
        description="Choose a new file name for this document."
        initialValue={renameTarget?.name ?? ""}
        confirmLabel="Rename"
        onCancel={() => setRenameTarget(null)}
        onConfirm={handleRenameConfirm}
      />

      <View style={s.header}>
        <View>
          <Text style={s.appTitle}>Vault</Text>
          <Text style={s.appSubtitle}>Offline markdown files</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={handleNewFile}>
          <Ionicons name="add" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={s.searchContainer}>
        <Ionicons name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[s.searchInput, { color: colors.foreground }]}
          placeholder="Search files..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.openSection}>
          <TouchableOpacity style={s.openFromDevice} onPress={handleOpenFromDevice}>
            <View style={s.openFileLeft}>
              <Ionicons name="folder-open" size={20} color={colors.primary} />
              <View>
                <Text style={[s.openFileTitle, { color: colors.foreground }]}>Open from device</Text>
                <Text style={[s.openFileDetail, { color: colors.mutedForeground }]}>.md · .txt · .markdown</Text>
              </View>
            </View>
            <View style={s.filesBadge}>
              <Text style={s.filesBadgeText}>Browse</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionLabel}>Recent</Text>

        {filteredFiles.length === 0 && search.length > 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="search" size={36} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No files match "{search}"</Text>
          </View>
        ) : filteredFiles.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="document-text-outline" size={36} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No files yet. Tap + to create one.</Text>
          </View>
        ) : (
          filteredFiles.map((file, index) => {
            const isAdSlot = index === 2;
            return (
              <React.Fragment key={file.id}>
                {isAdSlot && <NativeAdBanner />}
                <FileRow
                  file={file}
                  onPress={() => handleOpenFile(file.id)}
                  onDelete={() => deleteFile(file.id)}
                  onRename={() => handleRename(file.id, file.name)}
                />
              </React.Fragment>
            );
          })
        )}
      </ScrollView>

      {/* Bottom ad banner — sits above system nav bar */}
      <BottomAdBanner bottomInset={bottomPad} />

      {/* FAB — above the banner */}
      <TouchableOpacity
        style={[s.fab, { bottom: bottomPad + 64 }]}
        onPress={handleNewFile}
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
      </TouchableOpacity>
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
      paddingTop: topPad + 16,
      paddingBottom: 12,
      paddingHorizontal: 20,
    },
    appTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.foreground,
      letterSpacing: -0.5,
    },
    appSubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    iconBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginBottom: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      padding: 0,
    },
    openSection: {
      paddingHorizontal: 20,
      marginBottom: 8,
    },
    openFromDevice: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "rgba(94,234,212,0.08)",
      borderWidth: 1,
      borderColor: "rgba(94,234,212,0.18)",
      borderRadius: 14,
      padding: 16,
    },
    openFileLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    openFileTitle: {
      fontSize: 15,
      fontWeight: "600",
    },
    openFileDetail: {
      fontSize: 12,
      marginTop: 2,
    },
    filesBadge: {
      backgroundColor: colors.primary,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    filesBadgeText: {
      color: colors.primaryForeground,
      fontSize: 12,
      fontWeight: "700",
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.mutedForeground,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginTop: 8,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      gap: 12,
    },
    emptyText: {
      fontSize: 15,
      textAlign: "center",
      paddingHorizontal: 40,
    },
    privacyCard: {
      margin: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      gap: 10,
    },
    privacyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    privacyTitle: {
      fontSize: 14,
      fontWeight: "600",
    },
    offlineBadge: {
      backgroundColor: colors.muted,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    offlineBadgeText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: "600",
    },
    privacyDesc: {
      fontSize: 13,
      lineHeight: 20,
    },
    fab: {
      position: "absolute",
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
  });
