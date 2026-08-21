import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const BACKGROUND = "#faf7f6";

void SplashScreen.preventAutoHideAsync();

export function AnimatedSplash() {
  const [visible, setVisible] = useState(true);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const scale = useRef(new Animated.Value(0.98)).current;
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
            duration: 420,
            easing: EASE_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 420,
            easing: EASE_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 420,
            easing: EASE_OUT,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(240),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 280,
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
      style={[styles.overlay, { opacity: overlayOpacity }]}
    >
      <Animated.Image
        source={require("../assets/logo-horizontal.png")}
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
    backgroundColor: BACKGROUND,
  },
  logo: {
    width: 188,
    height: 63,
  },
});
