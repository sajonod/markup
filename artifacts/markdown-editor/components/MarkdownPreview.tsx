import React, { useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { MarkdownToken, parseMarkdown } from "@/utils/markdown";

interface Props {
  content: string;
  onToggleCheckbox?: (lineIndex: number, checked: boolean) => void;
  scrollEnabled?: boolean;
}

function renderInline(text: string, colors: ReturnType<typeof useColors>) {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(
        <Text key={idx++} style={{ color: colors.foreground }}>
          {text.slice(last, match.index)}
        </Text>
      );
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <Text key={idx++} style={{ fontWeight: "700", color: colors.foreground }}>
          {token.slice(2, -2)}
        </Text>
      );
    } else if (token.startsWith("*")) {
      parts.push(
        <Text key={idx++} style={{ fontStyle: "italic", color: colors.foreground }}>
          {token.slice(1, -1)}
        </Text>
      );
    } else if (token.startsWith("`")) {
      parts.push(
        <Text
          key={idx++}
          style={{
            fontFamily: "JetBrainsMono_400Regular" as string,
            backgroundColor: colors.muted,
            color: colors.primary,
            paddingHorizontal: 4,
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {token.slice(1, -1)}
        </Text>
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    parts.push(
      <Text key={idx++} style={{ color: colors.foreground }}>
        {text.slice(last)}
      </Text>
    );
  }

  return parts.length > 0 ? parts : [<Text key={0} style={{ color: colors.foreground }}>{text}</Text>];
}

export function MarkdownPreview({ content, onToggleCheckbox, scrollEnabled = true }: Props) {
  const colors = useColors();
  const tokens = parseMarkdown(content);

  const lines = content.split("\n");

  const renderToken = useCallback(
    (token: MarkdownToken, index: number) => {
      const s = styles(colors);

      switch (token.type) {
        case "h1":
          return (
            <View key={index} style={s.h1Container}>
              <Text style={s.h1}>{token.content}</Text>
              <View style={s.h1Divider} />
            </View>
          );
        case "h2":
          return (
            <Text key={index} style={s.h2}>
              {token.content}
            </Text>
          );
        case "h3":
          return (
            <Text key={index} style={s.h3}>
              {token.content}
            </Text>
          );
        case "checkbox": {
          let lineIdx = -1;
          const checkPattern = token.checked
            ? `- [x] ${token.content}`
            : `- [ ] ${token.content}`;
          lineIdx = lines.findIndex(
            (l) =>
              l.toLowerCase() === checkPattern.toLowerCase() ||
              l === `- [X] ${token.content}`
          );

          return (
            <TouchableOpacity
              key={index}
              style={s.checkboxRow}
              onPress={() =>
                onToggleCheckbox?.(lineIdx, !token.checked)
              }
              activeOpacity={0.7}
            >
              <View
                style={[s.checkbox, token.checked && s.checkboxChecked]}
              >
                {token.checked && (
                  <Text style={s.checkboxMark}>✓</Text>
                )}
              </View>
              <Text
                style={[
                  s.checkboxText,
                  token.checked && s.checkboxTextDone,
                ]}
              >
                {token.content}
              </Text>
            </TouchableOpacity>
          );
        }
        case "bullet":
          return (
            <View key={index} style={s.bulletRow}>
              <View style={s.bulletDot} />
              <Text style={s.bulletText}>{renderInline(token.content, colors)}</Text>
            </View>
          );
        case "blockquote":
          return (
            <View key={index} style={s.blockquote}>
              <View style={s.blockquoteBar} />
              <Text style={s.blockquoteText}>{renderInline(token.content, colors)}</Text>
            </View>
          );
        case "code_block":
          return (
            <View key={index} style={s.codeBlock}>
              {token.language ? (
                <Text style={s.codeLang}>{token.language}</Text>
              ) : null}
              <Text style={s.code}>{token.content}</Text>
            </View>
          );
        case "paragraph":
          return (
            <Text key={index} style={s.paragraph}>
              {renderInline(token.content, colors)}
            </Text>
          );
        case "blank":
          return <View key={index} style={{ height: 8 }} />;
        default:
          return null;
      }
    },
    [colors, lines, onToggleCheckbox]
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={scrollEnabled}
      keyboardShouldPersistTaps="handled"
    >
      {tokens.map((token, i) => renderToken(token, i))}
    </ScrollView>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    h1Container: {
      marginBottom: 16,
      marginTop: 8,
    },
    h1: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.foreground,
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    h1Divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    h2: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 8,
      marginTop: 16,
    },
    h3: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 6,
      marginTop: 12,
    },
    paragraph: {
      fontSize: 15,
      lineHeight: 24,
      color: colors.foreground,
      marginBottom: 8,
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 10,
      gap: 12,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginTop: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxChecked: {
      backgroundColor: "rgba(94,234,212,0.2)",
      borderColor: colors.primary,
    },
    checkboxMark: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: "700",
    },
    checkboxText: {
      fontSize: 15,
      color: colors.foreground,
      flex: 1,
      lineHeight: 24,
    },
    checkboxTextDone: {
      textDecorationLine: "line-through",
      color: colors.mutedForeground,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 6,
      gap: 10,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 9,
    },
    bulletText: {
      fontSize: 15,
      color: colors.foreground,
      flex: 1,
      lineHeight: 24,
    },
    blockquote: {
      flexDirection: "row",
      gap: 12,
      marginVertical: 8,
    },
    blockquoteBar: {
      width: 3,
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    blockquoteText: {
      fontSize: 15,
      fontStyle: "italic",
      color: colors.mutedForeground,
      flex: 1,
      lineHeight: 24,
    },
    codeBlock: {
      backgroundColor: "rgba(0,0,0,0.3)",
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: "rgba(94,234,212,0.15)",
    },
    codeLang: {
      fontSize: 11,
      color: colors.primary,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      fontWeight: "600",
    },
    code: {
      fontFamily: "monospace",
      fontSize: 13,
      color: "#95f9eb",
      lineHeight: 20,
    },
  });
