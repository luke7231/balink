import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  BackHandler,
  Linking,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";
import { useBridge } from "../bridge-context";
import { parseWebMessage, serializeNativeMessage, type NativeToWebMessage } from "../bridge";
import { playHaptic } from "../haptics";
import { openAppPath } from "../navigation/open-path";
import type { WebStackParamList } from "../navigation/types";
import { InAppBrowserSheet } from "./InAppBrowserSheet";
import { useNativeTheme } from "../theme-context";
import {
  WEBVIEW_AUTH_HOSTS,
  WEB_ORIGIN,
  isStackPath,
  isTabRootPath,
  isTrustedWebUrl,
  tabForPath,
  toAppPath,
  withNativeShell,
} from "../web-config";

function nativeShellBefore(isDark: boolean) {
  const resolvedTheme = isDark ? "dark" : "light";
  const background = isDark ? "#09090b" : "#ffffff";
  return `
  (function () {
    window.__BALINK_NATIVE_SHELL__ = true;
    try {
      var root = document.documentElement;
      root.classList.add('native-shell');
      root.classList.toggle('dark', ${isDark});
      root.style.colorScheme = '${resolvedTheme}';
      root.style.backgroundColor = '${background}';
      if (!document.getElementById('balink-native-shell-css')) {
        var style = document.createElement('style');
        style.id = 'balink-native-shell-css';
        style.textContent = 'nav[aria-label="하단 메뉴"]{display:none!important;height:0!important;overflow:hidden!important}body{padding-bottom:0!important}.motion-settled{animation:none!important}';
        (root.firstChild ? root.insertBefore(style, root.firstChild) : root.appendChild(style));
      }
      if (!window.__BALINK_MOTION_SETTLE__) {
        window.__BALINK_MOTION_SETTLE__ = true;
        document.addEventListener('animationend', function (event) {
          var el = event.target;
          if (!el || !el.classList) return;
          if (
            el.classList.contains('motion-fade-up') ||
            el.classList.contains('motion-fade-in') ||
            el.classList.contains('motion-soft-scale')
          ) {
            el.classList.add('motion-settled');
          }
        }, true);
      }
      window.dispatchEvent(new Event('balink:native-shell'));
    } catch (err) {}
  })();
  true;
`;
}

/** Intercept same-origin navigations that should use native tabs/stacks. */
const NATIVE_NAV_INTERCEPT = `
  (function () {
    if (window.__BALINK_NAV_INTERCEPT__) return true;
    window.__BALINK_NAV_INTERCEPT__ = true;
    window.__BALINK_NATIVE_SHELL__ = true;
    try {
      document.documentElement.classList.add('native-shell');
      window.dispatchEvent(new Event('balink:native-shell'));
    } catch (err) {}

    function tabOf(pathname) {
      if (pathname.indexOf('/substitutes') === 0) return 'Substitutes';
      if (pathname === '/saved' || pathname.indexOf('/saved/') === 0) return 'Bookmarks';
      if (pathname.indexOf('/notifications') === 0) return 'Notifications';
      if (
        pathname.indexOf('/account') === 0 ||
        pathname === '/login' ||
        pathname.indexOf('/login/') === 0 ||
        pathname === '/privacy' ||
        pathname === '/terms'
      ) return 'Account';
      return 'Jobs';
    }

    function isTabRoot(pathname) {
      return (
        pathname === '/' ||
        pathname === '/substitutes' ||
        pathname === '/saved' ||
        pathname === '/notifications' ||
        pathname === '/account' ||
        pathname === '/login'
      );
    }

    function isStack(pathname) {
      if (pathname.indexOf('/jobs/') === 0) return true;
      if (pathname.indexOf('/substitutes/') === 0 && pathname !== '/substitutes') return true;
      if (pathname.indexOf('/notifications/') === 0 && pathname !== '/notifications') return true;
      if (pathname.indexOf('/saved/') === 0 && pathname !== '/saved') return true;
      if (pathname.indexOf('/account/') === 0 && pathname !== '/account') return true;
      if (pathname === '/privacy' || pathname === '/terms') return true;
      return false;
    }

    function shouldNative(pathname) {
      if (isStack(pathname)) return true;
      if (isTabRoot(pathname) && tabOf(pathname) !== tabOf(location.pathname)) return true;
      return false;
    }

    function postNav(path) {
      if (!window.ReactNativeWebView) return;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NATIVE_NAV', path: path }));
    }

    document.addEventListener('click', function (event) {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var el = event.target;
      while (el && el.tagName !== 'A') el = el.parentElement;
      if (!el || !el.href) return;
      try {
        var url = new URL(el.href, location.href);
        if (url.origin !== location.origin) {
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            event.preventDefault();
            event.stopPropagation();
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'OPEN_IN_APP_BROWSER',
                url: url.toString(),
                title: (el.getAttribute('data-browser-title') || el.textContent || '원문').replace(/\s+/g, ' ').trim().slice(0, 40)
              }));
            }
          }
          return;
        }
        if (el.target && el.target !== '_self') return;
        var path = url.pathname + url.search;
        if (!shouldNative(url.pathname)) return;
        event.preventDefault();
        event.stopPropagation();
        postNav(path);
      } catch (err) {}
    }, true);

    true;
  })();
`;

type WebRoute = RouteProp<WebStackParamList, "Home" | "Web">;
type WebNav = NativeStackNavigationProp<WebStackParamList>;

export function WebScreen() {
  const route = useRoute<WebRoute>();
  const navigation = useNavigation<WebNav>();
  const path = route.params?.path || "/";
  const uri = useMemo(() => withNativeShell(path), [path]);
  const webViewRef = useRef<WebView>(null);
  const currentUrlRef = useRef(uri);
  const [canGoBackInWeb, setCanGoBackInWeb] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState<{ url: string; title?: string } | null>(null);
  const { buildPermissionMessages, requestPushPermission, openNotificationSettings } = useBridge();
  const { preference, resolvedTheme, isDark, setPreference } = useNativeTheme();
  const backgroundColor = isDark ? "#09090b" : "#ffffff";

  const sendToWeb = useCallback((message: NativeToWebMessage) => {
    if (!isTrustedWebUrl(currentUrlRef.current)) return;
    webViewRef.current?.injectJavaScript(`
      (function () {
        var data = '${serializeNativeMessage(message)}';
        window.dispatchEvent(new MessageEvent('message', { data: data }));
        document.dispatchEvent(new MessageEvent('message', { data: data }));
      })();
      true;
    `);
  }, []);

  const syncPermission = useCallback(async () => {
    const messages = await buildPermissionMessages();
    for (const message of messages) sendToWeb(message);
  }, [buildPermissionMessages, sendToWeb]);

  const syncTheme = useCallback(() => {
    sendToWeb({ type: "THEME_STATE", preference, resolvedTheme });
    webViewRef.current?.injectJavaScript(`
      (function () {
        var root = document.documentElement;
        root.classList.toggle('dark', ${isDark});
        root.style.colorScheme = '${resolvedTheme}';
        root.style.backgroundColor = '${backgroundColor}';
        if (document.body) document.body.style.backgroundColor = '${backgroundColor}';
      })();
      true;
    `);
  }, [backgroundColor, isDark, preference, resolvedTheme, sendToWeb]);

  useEffect(() => {
    syncTheme();
  }, [syncTheme]);

  useFocusEffect(
    useCallback(() => {
      void syncPermission();
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        if (canGoBackInWeb) {
          webViewRef.current?.goBack();
          return true;
        }
        return false;
      });
      return () => subscription.remove();
    }, [navigation, canGoBackInWeb, syncPermission]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncPermission();
    });
    return () => subscription.remove();
  }, [syncPermission]);

  const handleWebMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseWebMessage(event.nativeEvent.data);
      if (!message) return;
      if (message.type === "HAPTIC") {
        void playHaptic(message.style);
      } else if (message.type === "NATIVE_NAV") {
        openAppPath(navigation, message.path);
      } else if (message.type === "OPEN_IN_APP_BROWSER") {
        setInAppBrowser({ url: message.url, title: message.title });
      } else if (message.type === "SET_THEME") {
        setPreference(message.preference);
      } else if (message.type === "REQUEST_PUSH_PERMISSION") {
        void requestPushPermission().then(() => syncPermission());
      } else if (message.type === "OPEN_NOTIFICATION_SETTINGS") {
        openNotificationSettings();
      } else {
        void syncPermission();
      }
    },
    [navigation, openNotificationSettings, requestPushPermission, setPreference, syncPermission],
  );

  const handleNavigation = useCallback(
    (request: { url: string }) => {
      const { url } = request;
      if (url === "about:blank") return true;
      if (url.startsWith("tel:") || url.startsWith("mailto:")) {
        void Linking.openURL(url);
        return false;
      }

      try {
        const parsed = new URL(url);
        if (WEBVIEW_AUTH_HOSTS.has(parsed.hostname)) return true;
        if (parsed.origin !== WEB_ORIGIN) {
          if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            setInAppBrowser({ url });
            return false;
          }
          void Linking.openURL(url);
          return false;
        }

        const appPath = toAppPath(url);
        if (!appPath) return false;
        const pathname = appPath.split("?")[0] || "/";
        const currentPath = toAppPath(currentUrlRef.current);
        const currentPathname = currentPath?.split("?")[0] || "/";

        if (pathname === currentPathname) return true;

        if (isTabRootPath(pathname)) {
          if (tabForPath(pathname) === tabForPath(currentPathname) && isTabRootPath(currentPathname)) {
            return true;
          }
          return !openAppPath(navigation, appPath);
        }

        if (isStackPath(pathname)) {
          return !openAppPath(navigation, appPath);
        }

        return true;
      } catch {
        return false;
      }
    },
    [navigation],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={["top", "left", "right"]}
    >
      <WebView
        key={uri}
        ref={webViewRef}
        source={{ uri }}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        cacheMode="LOAD_DEFAULT"
        style={{ backgroundColor }}
        containerStyle={{ backgroundColor }}
        allowsBackForwardNavigationGestures={false}
        injectedJavaScriptBeforeContentLoaded={nativeShellBefore(isDark)}
        injectedJavaScript={NATIVE_NAV_INTERCEPT}
        onLoadEnd={() => {
          webViewRef.current?.injectJavaScript(NATIVE_NAV_INTERCEPT);
          void syncPermission();
          syncTheme();
        }}
        onMessage={handleWebMessage}
        onNavigationStateChange={(state: WebViewNavigation) => {
          currentUrlRef.current = state.url;
          setCanGoBackInWeb(state.canGoBack);
        }}
        onShouldStartLoadWithRequest={handleNavigation}
        onOpenWindow={({ nativeEvent }) => {
          const targetUrl = nativeEvent.targetUrl;
          try {
            const parsed = new URL(targetUrl);
            if (parsed.origin === WEB_ORIGIN) {
              const appPath = toAppPath(targetUrl);
              if (appPath) openAppPath(navigation, appPath);
              return;
            }
            if (parsed.protocol === "http:" || parsed.protocol === "https:") {
              setInAppBrowser({ url: targetUrl });
              return;
            }
            void Linking.openURL(targetUrl);
          } catch {
            /* ignore */
          }
        }}
        setSupportMultipleWindows
      />
      <InAppBrowserSheet
        url={inAppBrowser?.url ?? null}
        title={inAppBrowser?.title}
        isDark={isDark}
        onClose={() => setInAppBrowser(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
