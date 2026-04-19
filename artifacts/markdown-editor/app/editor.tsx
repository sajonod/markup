import { Ionicons } from "@expo/vector-icons";
import { Directory, File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FileNameDialog } from "@/components/FileNameDialog";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { MarkdownToolbar, ToolbarItem } from "@/components/MarkdownToolbar";
import { useFiles } from "@/context/FilesContext";
import { useColors } from "@/hooks/useColors";

type EditorMode = "write" | "preview" | "outline";

export default function EditorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getActiveFile, renameFile, saveFile, updateFileStorage } = useFiles();

  const file = getActiveFile();
  console.log("Editor: active file:", file);

  // If no file is found, go back to home
  useEffect(() => {
    if (!file) {
      console.log("Editor: no active file found, going back to home");
      router.replace("/");
    }
  }, [file]);

  const [content, setContent] = useState(file?.content ?? "");
  const [mode, setMode] = useState<EditorMode>("preview");
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [cursorPos, setCursorPos] = useState(0);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [renameVisible, setRenameVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContentRef = useRef(content);
  const latestFileIdRef = useRef(file?.id ?? null);
  const latestSavedContentRef = useRef(file?.content ?? "");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    console.log("Editor: file changed:", file?.id, file?.name);
    if (file) {
      if (file.content !== latestContentRef.current) {
        setContent(file.content);
        latestContentRef.current = file.content;
      }
      latestSavedContentRef.current = file.content;
      latestFileIdRef.current = file.id;
      setSaveStatus("Saved");
    }
  }, [file?.content, file?.id]);

  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  useEffect(() => {
    latestFileIdRef.current = file?.id ?? null;
  }, [file?.id]);

  const flushSave = useCallback(() => {
    const fileId = latestFileIdRef.current;
    const text = latestContentRef.current;

    if (!fileId || latestSavedContentRef.current === text) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    saveFile(fileId, text);
    latestSavedContentRef.current = text;
    setSaveStatus("Saved");
  }, [saveFile]);

  const triggerSave = useCallback(
    (text: string) => {
      if (!file?.id) return;
      setSaveStatus("Saving...");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveFile(file.id, text);
        latestSavedContentRef.current = text;
        saveTimerRef.current = null;
        setSaveStatus("Saved");
      }, 800);
    },
    [file, saveFile]
  );

  useEffect(() => {
    return () => {
      flushSave();
    };
  }, [flushSave]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        flushSave();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [flushSave]);

  const handleChangeText = (text: string) => {
    setContent(text);
    setSaveStatus("Editing...");
    triggerSave(text);
  };

  const handleSelectionChange = (e: any) => {
    const { start, end } = e.nativeEvent.selection;
    setSelectionStart(start);
    setSelectionEnd(end);
    setCursorPos(start);
  };

  const handleToolbarAction = (item: ToolbarItem) => {
    if (!inputRef.current) return;

    let newContent = content;
    let newCursor = cursorPos;

    if (item.wrapper) {
      if (selectionStart !== selectionEnd) {
        const selected = content.slice(selectionStart, selectionEnd);
        const before = content.slice(0, selectionStart);
        const after = content.slice(selectionEnd);
        newContent = before + item.wrapper + selected + item.wrapper + after;
        newCursor = selectionEnd + item.wrapper.length * 2;
      } else {
        const placeholder = item.wrapper === "**" ? "bold text" : "italic text";
        const before = content.slice(0, cursorPos);
        const after = content.slice(cursorPos);
        newContent = before + item.wrapper + placeholder + item.wrapper + after;
        newCursor = cursorPos + item.wrapper.length + placeholder.length + item.wrapper.length;
      }
    } else if (item.prefix) {
      const lineStart = content.lastIndexOf("\n", cursorPos - 1) + 1;
      const before = content.slice(0, lineStart);
      const rest = content.slice(lineStart);
      if (item.action === "code_block") {
        newContent = content.slice(0, cursorPos) + "\n```\ncode here\n```\n" + content.slice(cursorPos);
        newCursor = cursorPos + 5;
      } else {
        newContent = before + item.prefix + rest;
        newCursor = lineStart + item.prefix.length + (cursorPos - lineStart);
      }
    }

    setContent(newContent);
    triggerSave(newContent);
    setCursorPos(newCursor);

    setTimeout(() => {
      inputRef.current?.setNativeProps({
        selection: { start: newCursor, end: newCursor },
      });
    }, 50);
  };

  const handleToggleCheckbox = (lineIndex: number, checked: boolean) => {
    const lines = content.split("\n");
    if (lineIndex < 0 || lineIndex >= lines.length) return;
    const line = lines[lineIndex];
    const updated = line
      .replace(/- \[x\] /i, "- [ ] ")
      .replace(/- \[ \] /i, checked ? "- [x] " : "- [ ] ");
    lines[lineIndex] = updated;
    const newContent = lines.join("\n");
    setContent(newContent);
    triggerSave(newContent);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBack = () => {
    flushSave();
    router.back();
  };

  const safeFileName = useCallback((name: string) => {
    const trimmed = name.trim();
    return trimmed.replace(/[\\/:*?"<>|]/g, "_") || "Untitled.md";
  }, []);

  const writeToUri = useCallback(async (targetUri: string, text: string) => {
    const outputFile = new File(targetUri);

    if (!outputFile.exists) {
      outputFile.create({ overwrite: true });
    }

    outputFile.write(text);
    return outputFile;
  }, []);

  const saveIntoDirectory = useCallback(
    async (directory: { uri: string }, name: string, text: string) => {
      const targetFile = new File(directory.uri, safeFileName(name));
      const savedFile = await writeToUri(targetFile.uri, text);
      return savedFile;
    },
    [safeFileName, writeToUri]
  );

  const handleShareToOtherApps = async () => {
    if (!file) return;

    try {
      flushSave();

      const shareableFile = await writeToUri(
        new File(Paths.cache, safeFileName(file.name)).uri,
        latestContentRef.current
      );

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("Share unavailable", "This device cannot open the system share sheet.");
        return;
      }

      await Sharing.shareAsync(shareableFile.uri, {
        mimeType: "text/markdown",
        dialogTitle: `Share "${file.name}"`,
        UTI: "net.daringfireball.markdown",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Share failed", msg || "Could not open other apps for this file.");
    }
  };

  const handleSaveToDevice = async () => {
    if (!file) return;
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Save to device is only available on iOS and Android.");
      return;
    }
    try {
      flushSave();

      if (file.savedUri) {
        await writeToUri(file.savedUri, latestContentRef.current);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Saved", `Updated "${file.name}" on disk.`);
        return;
      }

      const directory = await Directory.pickDirectoryAsync();
      if (!directory) return;

      const targetFile = await saveIntoDirectory(
        directory,
        file.name,
        latestContentRef.current
      );
      updateFileStorage(file.id, { savedUri: targetFile.uri });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved", `Saved "${file.name}" to the selected folder.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Save failed", msg || "Could not save the file. Please try again.");
    }
  };

  const handleSaveAs = async () => {
    if (!file) return;
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Save to device is only available on iOS and Android.");
      return;
    }

    try {
      flushSave();
      const directory = await Directory.pickDirectoryAsync();
      if (!directory) return;

      const targetFile = await saveIntoDirectory(
        directory,
        file.name,
        latestContentRef.current
      );
      updateFileStorage(file.id, { savedUri: targetFile.uri });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved", `Saved "${file.name}" to a new folder.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Save failed", msg || "Could not save the file. Please try again.");
    }
  };

  const handleRenameConfirm = async (nextName: string) => {
    if (!file) return;

    try {
      if (file.savedUri) {
        const currentOutput = new File(file.savedUri);
        const renamedOutput = new File(currentOutput.parentDirectory, nextName);

        if (currentOutput.exists && currentOutput.uri !== renamedOutput.uri) {
          currentOutput.move(renamedOutput);
          updateFileStorage(file.id, { savedUri: renamedOutput.uri });
        }
      }

      renameFile(file.id, nextName);
      setRenameVisible(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Rename failed", msg || "Could not rename the file.");
    }
  };

  const handleMenu = () => {
    Alert.alert(file?.name ?? "Options", "File actions", [
      {
        text: "Rename",
        onPress: () => setRenameVisible(true),
      },
      {
        text: file?.savedUri ? "Save to disk" : "Save to folder",
        onPress: handleSaveToDevice,
      },
      {
        text: "Save as...",
        onPress: handleSaveAs,
      },
      {
        text: "Open in other apps",
        onPress: handleShareToOtherApps,
      },
      {
        text: "Version History",
        onPress: () => router.push("/history"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  if (!file) {
    return (
      <View style={[{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>No file selected</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, marginTop: 12 }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const s = createStyles(colors, topPad, bottomPad);

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <FileNameDialog
        visible={renameVisible}
        title="Rename file"
        description="Update the document name used inside the app and for future saves."
        initialValue={file.name}
        confirmLabel="Rename"
        onCancel={() => setRenameVisible(false)}
        onConfirm={handleRenameConfirm}
      />
      <View style={s.topbar}>
        <TouchableOpacity onPress={handleBack} style={s.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <View style={s.titleBlock}>
          <Text style={s.fileName} numberOfLines={1}>
            {file.name}
          </Text>
          <Text style={s.saveStatus}>{saveStatus}</Text>
        </View>

        <View style={s.topRight}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => setMode(mode === "write" ? "preview" : "write")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={mode === "write" ? "eye-outline" : "create-outline"}
              size={22}
              color={colors.foreground}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={handleMenu}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.modeTabs}>
        {(["write", "preview", "outline"] as EditorMode[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[s.modeTab, mode === m && s.modeTabActive]}
            onPress={() => setMode(m)}
          >
            <Text
              style={[
                s.modeTabText,
                { color: mode === m ? colors.primary : colors.mutedForeground },
              ]}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === "write" && (
        <>
          <ScrollView
            style={s.editorScroll}
            contentContainerStyle={s.editorScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TextInput
              ref={inputRef}
              style={[s.editor, { color: colors.foreground }]}
              value={content}
              onChangeText={handleChangeText}
              onSelectionChange={handleSelectionChange}
              multiline
              autoCorrect={false}
              autoCapitalize="sentences"
              spellCheck={false}
              textAlignVertical="top"
              scrollEnabled={false}
              placeholder="Start writing in Markdown..."
              placeholderTextColor={colors.mutedForeground}
            />
          </ScrollView>
          <MarkdownToolbar onAction={handleToolbarAction} />
          {/* Bottom safe area spacer so toolbar clears nav bar */}
          <View style={{ height: bottomPad, backgroundColor: colors.card }} />
        </>
      )}

      {mode === "preview" && (
        <MarkdownPreview
          content={content}
          onToggleCheckbox={handleToggleCheckbox}
        />
      )}

      {mode === "outline" && (
        <OutlineView content={content} colors={colors} />
      )}
    </KeyboardAvoidingView>
  );
}

function OutlineView({
  content,
  colors,
}: {
  content: string;
  colors: ReturnType<typeof useColors>;
}) {
  const headings = content
    .split("\n")
    .filter((l) => l.match(/^#{1,3} /))
    .map((l) => {
      const level = l.match(/^(#+)/)?.[1].length ?? 1;
      const text = l.replace(/^#+\s*/, "");
      return { level, text };
    });

  if (headings.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
        <Ionicons name="list-outline" size={36} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, fontSize: 15 }}>
          No headings found
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, textAlign: "center", paddingHorizontal: 40 }}>
          Add headings with # H1, ## H2, or ### H3
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: 8 }}>
      {headings.map((h, i) => (
        <View
          key={i}
          style={{
            paddingHorizontal: 20 + (h.level - 1) * 16,
            paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: h.level === 1 ? 16 : h.level === 2 ? 14 : 13,
              fontWeight: h.level === 1 ? "700" : "500",
              color: h.level === 1 ? colors.foreground : colors.mutedForeground,
            }}
          >
            {h.text}
          </Text>
          <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
            H{h.level}
          </Text>
        </View>
      ))}
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
    topbar: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: topPad + 8,
      paddingBottom: 10,
      paddingHorizontal: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    iconBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    titleBlock: {
      flex: 1,
      alignItems: "center",
    },
    fileName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
      letterSpacing: -0.2,
    },
    saveStatus: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    topRight: {
      flexDirection: "row",
    },
    modeTabs: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    modeTab: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 999,
    },
    modeTabActive: {
      backgroundColor: "rgba(94,234,212,0.12)",
      borderWidth: 1,
      borderColor: "rgba(94,234,212,0.24)",
    },
    modeTabText: {
      fontSize: 13,
      fontWeight: "500",
    },
    editor: {
      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
      fontSize: 14,
      lineHeight: 24,
      minHeight: 320,
      textAlignVertical: "top",
    },
    editorScroll: {
      flex: 1,
    },
    editorScrollContent: {
      padding: 20,
      paddingBottom: 32,
      flexGrow: 1,
    },
  });
