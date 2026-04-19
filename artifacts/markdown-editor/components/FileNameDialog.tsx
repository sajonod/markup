import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  title: string;
  description?: string;
  initialValue: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}

export function FileNameDialog({
  visible,
  title,
  description,
  initialValue,
  confirmLabel = "Save",
  onCancel,
  onConfirm,
}: Props) {
  const colors = useColors();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [initialValue, visible]);

  const trimmedValue = value.trim();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          {description ? (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {description}
            </Text>
          ) : null}
          <TextInput
            style={[
              styles.input,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
            value={value}
            onChangeText={setValue}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Enter file name"
            placeholderTextColor={colors.mutedForeground}
          />
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, { color: colors.foreground }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.primaryButton,
                {
                  backgroundColor: trimmedValue ? colors.primary : colors.muted,
                },
              ]}
              disabled={!trimmedValue}
              onPress={() => onConfirm(trimmedValue)}
            >
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  button: {
    minWidth: 92,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButton: {},
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
