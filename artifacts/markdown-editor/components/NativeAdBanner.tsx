import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { useColors } from "@/hooks/useColors";

// AdMob Ad Unit ID for Native Ad
const ADMOB_NATIVE_AD_UNIT = "ca-app-pub-3940256099942544/2247696110";

interface Props {
  title?: string;
  subtitle?: string;
}

export function NativeAdBanner({ title, subtitle }: Props) {
  const colors = useColors();
  
  // Note: Native ads work best on native builds. 
  // This shows a placeholder in Expo Go. When built for iOS/Android, 
  // the ad unit ID will be used by the native code.
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.adLabel, { color: colors.mutedForeground }]}>Ad</Text>
      <Text style={[styles.placeholder, { color: colors.foreground }]}>
        Ad Unit: {ADMOB_NATIVE_AD_UNIT}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  adLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  placeholder: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: "monospace",
  },
});
