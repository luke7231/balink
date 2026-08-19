import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SOURCE_LOGIN_LABELS, type SourceLoginSite } from "./source-session-hosts";
import { onAccentColor } from "./accent-palette";
import type { SourceLoginCredential } from "./source-login-assist";

interface SourceLoginAssistOverlayProps {
  isDark: boolean;
  accentColor: string;
  site: SourceLoginSite;
  savedLogin: SourceLoginCredential | null;
  loginFormVisible: boolean;
  savePrompt: SourceLoginCredential | null;
  onFill: () => void;
  onForget: () => void;
  onRemember: () => void;
  onDecline: () => void;
}

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((value) => Number.isNaN(value))) return hex;
  return `rgba(${r},${g},${b},${alpha})`;
}

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const sync = (enabled: boolean) => setReduceMotion(enabled);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", sync);
    void AccessibilityInfo.isReduceMotionEnabled().then(sync);
    return () => subscription.remove();
  }, []);

  return reduceMotion;
}

function useNeonFloat() {
  const translateY = useRef(new Animated.Value(-5)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) {
      translateY.setValue(0);
      return;
    }
    translateY.setValue(-5);
    const motion = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 5,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -5,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    motion.start();
    return () => {
      motion.stop();
    };
  }, [reduceMotion, translateY]);

  return { transform: [{ translateY }] };
}

function NeonSignFrame({
  accentColor,
  plateColor,
  rounded,
  style,
  children,
}: {
  accentColor: string;
  plateColor: string;
  rounded: "pill" | "card";
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const floatStyle = useNeonFloat();
  const outerRadius = rounded === "pill" ? 999 : 26;
  const innerRadius = rounded === "pill" ? 999 : 22;
  return (
    <Animated.View
      style={[
        styles.glowOuter,
        floatStyle,
        {
          borderRadius: outerRadius,
          borderColor: withAlpha(accentColor, 0.2),
          shadowColor: accentColor,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.glowMid,
          {
            borderRadius: outerRadius,
            borderColor: withAlpha(accentColor, 0.42),
          },
        ]}
      >
        <View
          style={[
            styles.signBody,
            {
              borderRadius: innerRadius,
              borderColor: withAlpha(accentColor, 0.88),
              backgroundColor: plateColor,
            },
          ]}
        >
          {children}
        </View>
      </View>
    </Animated.View>
  );
}

function SignMark({ accentColor }: { accentColor: string }) {
  return (
    <Text style={[styles.signMark, { color: accentColor }]}>발링크 추천</Text>
  );
}

function SparkleMark({ accentColor, size = 22 }: { accentColor: string; size?: number }) {
  const reduceMotion = useReduceMotion();
  const twinkle = useRef(new Animated.Value(0.72)).current;

  useEffect(() => {
    if (reduceMotion) {
      twinkle.setValue(1);
      return;
    }
    const motion = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(twinkle, {
          toValue: 0.62,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    motion.start();
    return () => {
      motion.stop();
    };
  }, [reduceMotion, twinkle]);

  return (
    <Animated.View
      style={[
        styles.sparkleWrap,
        {
          width: size + 6,
          height: size + 2,
          opacity: twinkle,
          transform: [
            {
              scale: twinkle.interpolate({
                inputRange: [0.62, 1],
                outputRange: [0.9, 1],
              }),
            },
          ],
        },
      ]}
    >
      <MaterialCommunityIcons name="star-four-points" size={size} color={accentColor} />
      <View style={[styles.sparkleSmall, { top: -2, right: -1 }]}>
        <MaterialCommunityIcons
          name="star-four-points"
          size={Math.round(size * 0.42)}
          color={accentColor}
        />
      </View>
    </Animated.View>
  );
}

export function SourceLoginAssistOverlay({
  isDark,
  accentColor,
  site,
  savedLogin,
  loginFormVisible,
  savePrompt,
  onFill,
  onForget,
  onRemember,
  onDecline,
}: SourceLoginAssistOverlayProps) {
  const label = SOURCE_LOGIN_LABELS[site];
  const plateColor = isDark ? "#140f14" : "#ffffff";
  const textColor = isDark ? "#fafafa" : "#18181b";
  const mutedColor = isDark ? "#a1a1aa" : "#71717a";
  const onAccent = onAccentColor(isDark);

  if (savePrompt) {
    return (
      <View style={styles.promptWrap} pointerEvents="box-none">
        <NeonSignFrame
          accentColor={accentColor}
          plateColor={plateColor}
          rounded="pill"
          style={styles.promptFrame}
        >
          <View style={styles.chipRow}>
            <View style={styles.promptHit}>
              <SparkleMark accentColor={accentColor} />
              <View style={styles.chipMain}>
                <SignMark accentColor={accentColor} />
                <Text style={[styles.chipText, { color: textColor }]}>이 아이디를 기억할까요?</Text>
                <Text style={[styles.promptId, { color: mutedColor }]} numberOfLines={1}>
                  {label} · {savePrompt.username}
                </Text>
              </View>
            </View>
            <View style={styles.promptSide}>
              <Pressable onPress={onDecline} hitSlop={8} accessibilityLabel="다음에">
                <Text style={[styles.chipForget, { color: mutedColor }]}>다음에</Text>
              </Pressable>
              <Pressable
                onPress={onRemember}
                hitSlop={8}
                accessibilityLabel="기억하기"
                style={[styles.rememberPill, { backgroundColor: accentColor }]}
              >
                <Text style={[styles.promptPrimaryText, { color: onAccent }]}>기억하기</Text>
              </Pressable>
            </View>
          </View>
        </NeonSignFrame>
      </View>
    );
  }

  if (!loginFormVisible || !savedLogin) return null;

  return (
    <View style={styles.chipWrap} pointerEvents="box-none">
      <NeonSignFrame
        accentColor={accentColor}
        plateColor={plateColor}
        rounded="pill"
        style={styles.chipFrame}
      >
        <View style={styles.chipRow}>
          <Pressable
            onPress={onFill}
            accessibilityLabel={`발링크 추천, ${label} 아이디 채우기`}
            style={styles.chipHit}
          >
            <SparkleMark accentColor={accentColor} />
            <View style={styles.chipMain}>
              <SignMark accentColor={accentColor} />
              <Text style={[styles.chipText, { color: textColor }]} numberOfLines={1}>
                {label} · {savedLogin.username}
              </Text>
            </View>
          </Pressable>
          <Pressable onPress={onForget} hitSlop={8} accessibilityLabel="저장된 로그인 지우기">
            <Text style={[styles.chipForget, { color: mutedColor }]}>지우기</Text>
          </Pressable>
        </View>
      </NeonSignFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  chipWrap: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 2,
    alignItems: "center",
  },
  chipFrame: {
    maxWidth: "100%",
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sparkleWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleSmall: {
    position: "absolute",
  },
  glowOuter: {
    borderWidth: 2,
    shadowOpacity: 0.48,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  glowMid: {
    borderWidth: 1,
    padding: 1,
  },
  signBody: {
    overflow: "hidden",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  signMark: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 3,
  },
  chipHit: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chipMain: {
    flexShrink: 1,
    paddingRight: 4,
  },
  chipText: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: "600",
  },
  chipForget: {
    fontSize: 12,
    fontWeight: "600",
    paddingBottom: 1,
  },
  promptWrap: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 16,
    zIndex: 2,
  },
  promptFrame: {
    alignSelf: "stretch",
  },
  promptHit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  promptId: {
    marginTop: 2,
    fontSize: 12,
  },
  promptSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  rememberPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  promptPrimaryText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
