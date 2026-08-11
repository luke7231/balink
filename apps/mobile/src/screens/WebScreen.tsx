import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Linking,
  StyleSheet,
  View,
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

const NATIVE_SHELL_BEFORE = `
  (function () {
    window.__BALINK_NATIVE_SHELL__ = true;
    try {
      var root = document.documentElement;
      root.classList.add('native-shell');
      if (!document.getElementById('balink-native-shell-css')) {
        var style = document.createElement('style');
        style.id = 'balink-native-shell-css';
        style.textContent = 'nav[aria-label="하단 메뉴"]{display:none!important;height:0!important;overflow:hidden!important}body{padding-bottom:0!important}';
        (root.firstChild ? root.insertBefore(style, root.firstChild) : root.appendChild(style));
      }
      window.dispatchEvent(new Event('balink:native-shell'));
    } catch (err) {}
  })();
  true;
`;

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
      if (pathname.indexOf('/notifications') === 0) return 'Notifications';
      if (
        pathname.indexOf('/account') === 0 ||
        pathname === '/saved' ||
        pathname.indexOf('/saved/') === 0 ||
        pathname === '/login' ||
        pathname.indexOf('/login/') === 0
      ) return 'Account';
      return 'Jobs';
    }

    function isTabRoot(pathname) {
      return (
        pathname === '/' ||
        pathname === '/substitutes' ||
        pathname === '/notifications' ||
        pathname === '/account' ||
        pathname === '/login'
      );
    }

    function isStack(pathname) {
      if (pathname.indexOf('/jobs/') === 0) return true;
      if (pathname.indexOf('/substitutes/') === 0 && pathname !== '/substitutes') return true;
      if (pathname.indexOf('/notifications/') === 0 && pathname !== '/notifications') return true;
      if (pathname === '/saved' || pathname.indexOf('/saved/') === 0) return true;
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
      if (el.target && el.target !== '_self') return;
      try {
        var url = new URL(el.href, location.href);
        if (url.origin !== location.origin) return;
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
  const { buildPermissionMessages, requestPushPermission, openNotificationSettings } = useBridge();

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
      } else if (message.type === "REQUEST_PUSH_PERMISSION") {
        void requestPushPermission().then(() => syncPermission());
      } else if (message.type === "OPEN_NOTIFICATION_SETTINGS") {
        openNotificationSettings();
      } else {
        void syncPermission();
      }
    },
    [navigation, openNotificationSettings, requestPushPermission, syncPermission],
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
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <WebView
        key={uri}
        ref={webViewRef}
        source={{ uri }}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsBackForwardNavigationGestures={false}
        injectedJavaScriptBeforeContentLoaded={NATIVE_SHELL_BEFORE}
        injectedJavaScript={NATIVE_NAV_INTERCEPT}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color="#111827" />
          </View>
        )}
        onLoadEnd={() => {
          webViewRef.current?.injectJavaScript(NATIVE_NAV_INTERCEPT);
          void syncPermission();
        }}
        onMessage={handleWebMessage}
        onNavigationStateChange={(state: WebViewNavigation) => {
          currentUrlRef.current = state.url;
          setCanGoBackInWeb(state.canGoBack);
        }}
        onShouldStartLoadWithRequest={handleNavigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loading: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
});
