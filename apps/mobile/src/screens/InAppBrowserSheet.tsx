import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isKakaoAppUrl, openKakaoAppUrl, WEBVIEW_APP_NAME } from "../kakao-app-url";

interface InAppBrowserSheetProps {
  url: string | null;
  title?: string;
  isDark: boolean;
  onClose: () => void;
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function InAppBrowserSheet({ url, title, isDark, onClose }: InAppBrowserSheetProps) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const backgroundColor = isDark ? "#18181b" : "#ffffff";
  const mutedColor = isDark ? "#a1a1aa" : "#71717a";
  const textColor = isDark ? "#fafafa" : "#18181b";
  const accentColor = isDark ? "#fb7185" : "#e11d48";
  const host = url ? hostnameOf(url) : null;
  const heading = title?.trim() || "원문";

  const handleClose = useCallback(() => {
    setCanGoBack(false);
    setLoading(true);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setCanGoBack(false);
  }, [url]);

  useEffect(() => {
    if (!url) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      handleClose();
      return true;
    });
    return () => subscription.remove();
  }, [url, canGoBack, handleClose]);

  return (
    <Modal
      visible={Boolean(url)}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (canGoBack) {
          webViewRef.current?.goBack();
          return;
        }
        handleClose();
      }}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel="닫기" />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor,
              paddingBottom: Math.max(insets.bottom, 8),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: isDark ? "#3f3f46" : "#e4e4e7" }]} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {heading}
            </Text>
            <View style={styles.headerActions}>
              {url ? (
                <Pressable
                  onPress={() => void Linking.openURL(url)}
                  hitSlop={8}
                  accessibilityLabel="브라우저에서 열기"
                >
                  <Text style={[styles.action, { color: accentColor }]}>브라우저</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={handleClose} hitSlop={8} accessibilityLabel="닫기">
                <Text style={[styles.action, { color: mutedColor }]}>닫기</Text>
              </Pressable>
            </View>
          </View>
          {host ? (
            <Text style={[styles.host, { color: mutedColor }]} numberOfLines={1}>
              {host}
            </Text>
          ) : null}
          <View style={styles.webWrap}>
            {url ? (
              <WebView
                key={url}
                ref={webViewRef}
                source={{ uri: url }}
                style={{ backgroundColor }}
                javaScriptEnabled
                domStorageEnabled
                sharedCookiesEnabled
                thirdPartyCookiesEnabled
                originWhitelist={["*"]}
                applicationNameForUserAgent={WEBVIEW_APP_NAME}
                setSupportMultipleWindows={false}
                onShouldStartLoadWithRequest={({ url: nextUrl }) => {
                  if (isKakaoAppUrl(nextUrl)) {
                    openKakaoAppUrl(nextUrl);
                    return false;
                  }
                  return true;
                }}
                onLoadEnd={() => setLoading(false)}
                onNavigationStateChange={(state: WebViewNavigation) => {
                  setCanGoBack(state.canGoBack);
                }}
              />
            ) : null}
            {loading ? (
              <View style={[styles.loading, { backgroundColor }]} pointerEvents="none">
                <ActivityIndicator color={accentColor} />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    height: "92%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    marginTop: 10,
    height: 5,
    width: 48,
    borderRadius: 999,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  action: {
    fontSize: 14,
    fontWeight: "600",
  },
  host: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    fontSize: 12,
  },
  webWrap: {
    flex: 1,
    overflow: "hidden",
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
});
