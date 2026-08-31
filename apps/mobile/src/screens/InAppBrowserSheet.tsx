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
import type { WebViewMessageEvent } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { playHaptic } from "../haptics";
import {
  isKakaoAppUrl,
  openKakaoAppUrl,
  WEBVIEW_APP_NAME,
  WEBVIEW_USER_AGENT,
} from "../kakao-app-url";
import { SourceLoginAssistOverlay } from "../source-login-assist-overlay";
import {
  declineSourceLogin,
  deleteSourceLogin,
  fillSourceLoginScript,
  getSavedSourceLogin,
  isSourceLoginDeclined,
  parseSourceLoginMessage,
  saveSourceLogin,
  SOURCE_LOGIN_BEFORE_SCRIPT,
  SOURCE_LOGIN_DETECT_SCRIPT,
  type SourceLoginCredential,
} from "../source-login-assist";
import {
  isSourceSessionUrl,
  persistSourceCookies,
  persistSourceCookiesSoon,
  restoreSourceCookies,
} from "../source-session-cookies";
import { accentColorFor } from "../accent-palette";
import { isSourceLoginPageUrl, sourceLoginSite, type SourceLoginSite } from "../source-session-hosts";
import { useNativeTheme } from "../theme-context";

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
  const { accent } = useNativeTheme();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const pendingLoginRef = useRef<SourceLoginCredential | null>(null);
  const currentUrlRef = useRef<string | null>(url);
  const returnToUrlRef = useRef<string | null>(null);
  const didRedirectToLoginRef = useRef(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cookiesReady, setCookiesReady] = useState(false);
  const [loginFormVisible, setLoginFormVisible] = useState(false);
  const [savedLogin, setSavedLogin] = useState<SourceLoginCredential | null>(null);
  const [savePrompt, setSavePrompt] = useState<SourceLoginCredential | null>(null);
  const backgroundColor = isDark ? "#18181b" : "#ffffff";
  const mutedColor = isDark ? "#a1a1aa" : "#71717a";
  const textColor = isDark ? "#fafafa" : "#18181b";
  const accentColor = accentColorFor(accent, isDark);
  const host = url ? hostnameOf(url) : null;
  const heading = title?.trim() || "원문";
  const loginSite = url ? sourceLoginSite(url) : null;

  const resetLoginAssist = useCallback(() => {
    pendingLoginRef.current = null;
    returnToUrlRef.current = null;
    didRedirectToLoginRef.current = false;
    setLoginFormVisible(false);
    setSavedLogin(null);
    setSavePrompt(null);
  }, []);

  const handleClose = useCallback(() => {
    if (url) void persistSourceCookies(url);
    setCanGoBack(false);
    setLoading(true);
    setCookiesReady(false);
    resetLoginAssist();
    onClose();
  }, [onClose, resetLoginAssist, url]);

  useEffect(() => {
    if (!url) {
      setCookiesReady(false);
      resetLoginAssist();
      return;
    }
    let cancelled = false;
    setLoading(true);
    setCanGoBack(false);
    setCookiesReady(false);
    pendingLoginRef.current = null;
    returnToUrlRef.current = null;
    didRedirectToLoginRef.current = false;
    currentUrlRef.current = url;
    setLoginFormVisible(false);
    setSavePrompt(null);
    const site = sourceLoginSite(url);
    if (site) {
      void getSavedSourceLogin(site).then((credential) => {
        if (!cancelled) setSavedLogin(credential);
      });
    } else {
      setSavedLogin(null);
    }
    const prepare = isSourceSessionUrl(url)
      ? restoreSourceCookies(url)
      : Promise.resolve();
    void prepare.finally(() => {
      if (!cancelled) setCookiesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [resetLoginAssist, url]);

  const navigateWeb = useCallback((targetUrl: string) => {
    webViewRef.current?.injectJavaScript(
      `location.replace(${JSON.stringify(targetUrl)}); true;`,
    );
  }, []);

  const handleLoginGone = useCallback(async (site: SourceLoginSite) => {
    setLoginFormVisible(false);
    const pending = pendingLoginRef.current;
    if (!pending) return;
    const current = currentUrlRef.current;
    if (current && isSourceLoginPageUrl(current)) return;
    pendingLoginRef.current = null;
    const returnTo = returnToUrlRef.current;
    if (returnTo && didRedirectToLoginRef.current && currentUrlRef.current !== returnTo) {
      returnToUrlRef.current = null;
      navigateWeb(returnTo);
    }
    try {
      const existing = await getSavedSourceLogin(site);
      if (existing?.username === pending.username) {
        if (existing.password !== pending.password) {
          await saveSourceLogin(site, pending);
          setSavedLogin(pending);
        }
        return;
      }
      if (await isSourceLoginDeclined(site)) return;
      setSavePrompt(pending);
    } catch (error) {
      console.warn("원문 로그인 저장 확인 실패", error);
    }
  }, [navigateWeb]);

  const handleWebMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (!loginSite) return;
      const message = parseSourceLoginMessage(event.nativeEvent.data);
      if (!message) return;
      if (message.type === "SOURCE_LOGIN_FORM") {
        setLoginFormVisible(true);
        return;
      }
      if (message.type === "SOURCE_LOGIN_SUBMIT") {
        pendingLoginRef.current = {
          username: message.username,
          password: message.password,
        };
        return;
      }
      if (message.type === "SOURCE_LOGIN_REQUIRED") {
        if (didRedirectToLoginRef.current) return;
        didRedirectToLoginRef.current = true;
        returnToUrlRef.current = message.returnUrl || url;
        setLoginFormVisible(false);
        setLoading(true);
        navigateWeb(message.loginUrl);
        return;
      }
      void handleLoginGone(loginSite);
    },
    [handleLoginGone, loginSite, navigateWeb, url],
  );

  const handleFillLogin = useCallback(() => {
    if (!savedLogin) return;
    void playHaptic("selection");
    webViewRef.current?.injectJavaScript(
      fillSourceLoginScript(savedLogin.username, savedLogin.password),
    );
  }, [savedLogin]);

  const handleForgetLogin = useCallback(() => {
    if (!loginSite) return;
    void deleteSourceLogin(loginSite);
    setSavedLogin(null);
  }, [loginSite]);

  const handleRememberLogin = useCallback(() => {
    if (!loginSite || !savePrompt) return;
    void saveSourceLogin(loginSite, savePrompt);
    setSavedLogin(savePrompt);
    setSavePrompt(null);
    void playHaptic("success");
  }, [loginSite, savePrompt]);

  const handleDeclineLogin = useCallback(() => {
    if (!loginSite) return;
    void declineSourceLogin(loginSite);
    setSavePrompt(null);
  }, [loginSite]);

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
            {url && cookiesReady ? (
              <WebView
                key={url}
                ref={webViewRef}
                source={{ uri: url }}
                style={{ backgroundColor }}
                javaScriptEnabled
                domStorageEnabled
                sharedCookiesEnabled
                thirdPartyCookiesEnabled
                cacheEnabled
                originWhitelist={["*"]}
                applicationNameForUserAgent={WEBVIEW_APP_NAME}
                userAgent={WEBVIEW_USER_AGENT}
                setSupportMultipleWindows={false}
                injectedJavaScriptBeforeContentLoaded={
                  loginSite ? SOURCE_LOGIN_BEFORE_SCRIPT : undefined
                }
                onShouldStartLoadWithRequest={({ url: nextUrl }) => {
                  if (isKakaoAppUrl(nextUrl)) {
                    void openKakaoAppUrl(nextUrl).then((result) => {
                      if (result.opened || !result.fallbackUrl) return;
                      webViewRef.current?.injectJavaScript(
                        `window.location.replace(${JSON.stringify(result.fallbackUrl)}); true;`,
                      );
                    });
                    return false;
                  }
                  return true;
                }}
                onLoadEnd={() => {
                  setLoading(false);
                  if (!isSourceSessionUrl(url)) return;
                  persistSourceCookiesSoon(url);
                  webViewRef.current?.injectJavaScript(SOURCE_LOGIN_DETECT_SCRIPT);
                }}
                onNavigationStateChange={(state: WebViewNavigation) => {
                  currentUrlRef.current = state.url;
                  setCanGoBack(state.canGoBack);
                  if (isSourceSessionUrl(state.url)) persistSourceCookiesSoon(state.url);
                }}
                onMessage={handleWebMessage}
              />
            ) : null}
            {loading ? (
              <View style={[styles.loading, { backgroundColor }]} pointerEvents="none">
                <ActivityIndicator color={accentColor} />
              </View>
            ) : null}
            {loginSite ? (
              <SourceLoginAssistOverlay
                isDark={isDark}
                accentColor={accentColor}
                site={loginSite}
                savedLogin={savedLogin}
                loginFormVisible={loginFormVisible}
                savePrompt={savePrompt}
                onFill={handleFillLogin}
                onForget={handleForgetLogin}
                onRemember={handleRememberLogin}
                onDecline={handleDeclineLogin}
              />
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
