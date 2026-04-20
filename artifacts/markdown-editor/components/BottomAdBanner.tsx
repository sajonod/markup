import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { useColors } from "@/hooks/useColors";

// AdMob Ad Unit ID for Adaptive Banner
const ADMOB_BANNER_AD_UNIT = "ca-app-pub-3940256099942544/9214589741";

interface Props {
  bottomInset: number;
}

export function BottomAdBanner({ bottomInset }: Props) {
  const colors = useColors();
  
  return (
    <View style={[styles.wrapper, { paddingBottom: bottomInset, backgroundColor: colors.card, borderTopColor: colors.border }]}>
      <Text style={[styles.adText, { color: colors.mutedForeground }]}>
        🚀 Sponsored
      </Text>
      <Text style={[styles.adUnitId, { color: colors.mutedForeground }]}>
        {ADMOB_BANNER_AD_UNIT}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  adText: {
    fontSize: 12,
    fontWeight: "500",
  },
  adUnitId: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: "monospace",
  },
});
