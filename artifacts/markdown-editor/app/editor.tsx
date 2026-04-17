import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MarkdownPreview } from "@/components/MarkdownPreview";
import { MarkdownToolbar, ToolbarItem } from "@/components/MarkdownToolbar";
import { useFiles } from "@/context/FilesContext";
import { useColors } from "@/hooks/useColors";

type EditorMode = "write" | "preview" | "outline";

export default function EditorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getActiveFile, saveFile } = useFiles();

  const file = getActiveFile();
  const [content, setContent] = useState(file?.content ?? "");
  const [mode, setMode] = useState<EditorMode>("write");
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [cursorPos, setCursorPos] = useState(0);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (file) setContent(file.content);
  }, [file?.id]);

  const triggerSave = useCallback(
    (text: string) => {
      if (!file) return;
      setSaveStatus("Saving...");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveFile(file.id, text);
        setSaveStatus("Saved");
      }, 800);
    },
    [file, saveFile]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

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
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      if (file) saveFile(file.id, content);
    }
    router.back();
  };

  const handleSaveToDevice = async () => {
    if (!file) return;
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Save to device is only available on iOS and Android.");
      return;
    }
    try {
      const dir = FileSystem.documentDirectory;
      if (!dir) throw new Error("No document directory");
      const filePath = dir + file.name;
      await FileSystem.writeAsStringAsync(filePath, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: "text/plain",
          dialogTitle: `Save ${file.name}`,
          UTI: "public.plain-text",
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Saved", `File saved to app documents as "${file.name}".`);
      }
    } catch {
      Alert.alert("Error", "Could not save the file. Please try again.");
    }
  };

  const handleMenu = () => {
    Alert.alert(file?.name ?? "Options", "File actions", [
      {
        text: "Save to device / Share",
        onPress: handleSaveToDevice,
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
      behavior="padding"
      keyboardVerticalOffset={0}
    >
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
            scrollEnabled
            placeholder="Start writing in Markdown..."
            placeholderTextColor={colors.mutedForeground}
          />
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
      flex: 1,
      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
      fontSize: 14,
      lineHeight: 24,
      padding: 20,
      textAlignVertical: "top",
    },
  });
