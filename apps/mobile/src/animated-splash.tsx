import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useNativeTheme } from "./theme-context";

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const LIGHT_BACKGROUND = "#faf7f6";
const DARK_BACKGROUND = "#09090b";

/** Soft brand entrance — a bit slower so it reads on cold start. */
const ENTER_MS = 720;
const HOLD_MS = 420;
const EXIT_MS = 400;
const ENTER_FROM_Y = 20;
const ENTER_FROM_SCALE = 0.94;

const logoLight = require("../assets/logo-horizontal.png");
const logoDark = require("../assets/logo-horizontal-dark.png");

void SplashScreen.preventAutoHideAsync();

export function AnimatedSplash() {
  const { isDark } = useNativeTheme();
  const [visible, setVisible] = useState(true);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(ENTER_FROM_Y)).current;
  const scale = useRef(new Animated.Value(ENTER_FROM_SCALE)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;

    async function play() {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      await SplashScreen.hideAsync();
      if (cancelled) return;

      if (reduceMotion) {
        setVisible(false);
        return;
      }

      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: ENTER_MS,
            easing: EASE_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: ENTER_MS,
            easing: EASE_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: ENTER_MS,
            easing: EASE_OUT,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(HOLD_MS),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: EXIT_MS,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && !cancelled) setVisible(false);
      });
    }

    void play();
    return () => {
      cancelled = true;
    };
  }, [logoOpacity, overlayOpacity, scale, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.overlay,
        {
          opacity: overlayOpacity,
          backgroundColor: isDark ? DARK_BACKGROUND : LIGHT_BACKGROUND,
        },
      ]}
    >
      <Animated.Image
        source={isDark ? logoDark : logoLight}
        resizeMode="contain"
        style={[
          styles.logo,
          {
            opacity: logoOpacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 188,
    height: 54,
  },
});
