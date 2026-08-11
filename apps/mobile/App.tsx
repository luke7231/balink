import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";
import {
  type InstallationCredential,
  type NativeToWebMessage,
  type PushPermissionPayload,
  parseWebMessage,
  serializeNativeMessage,
} from "./src/bridge";

const WEB_BASE_URL =
  (Constants.expoConfig?.extra?.webUrl as string | undefined) ||
  "https://black-swan-web.vercel.app";
const INSTALLATION_ID_KEY = "black-swan.installation-id";
const INSTALLATION_SECRET_KEY = "black-swan.installation-secret";
const ALLOWED_PUSH_PATHS = ["/jobs/", "/substitutes/", "/notifications"];
const WEB_ORIGIN = new URL(WEB_BASE_URL).origin;
const WEBVIEW_AUTH_HOSTS = new Set(["kauth.kakao.com", "accounts.kakao.com", "appleid.apple.com"]);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const currentUrlRef = useRef(WEB_BASE_URL);
  const [canGoBack, setCanGoBack] = useState(false);
  const [credential, setCredential] = useState<InstallationCredential | null>(null);

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

  const openPushHref = useCallback(
    (href: unknown) => {
      if (typeof href !== "string" || !isAllowedPushHref(href)) return;
      const target = new URL(href, WEB_BASE_URL).toString();
      webViewRef.current?.injectJavaScript(`window.location.assign(${JSON.stringify(target)}); true;`);
      sendToWeb({ type: "PUSH_OPENED", href });
    },
    [sendToWeb],
  );

  const syncPermission = useCallback(async () => {
    const permission = await getPushPermission();
    sendToWeb({ type: "PUSH_PERMISSION_STATUS", ...permission });

    if (!credential) return;
    sendToWeb({
      type: "PUSH_INSTALLATION",
      platform: Platform.OS === "ios" ? "ios" : "android",
      ...credential,
    });

    if (permission.permission !== "granted") return;
    const expoPushToken = await getExpoPushToken();
    if (!expoPushToken) return;
    sendToWeb({
      type: "PUSH_TOKEN",
      expoPushToken,
      platform: Platform.OS === "ios" ? "ios" : "android",
      ...credential,
    });
  }, [credential, sendToWeb]);

  const requestPushPermission = useCallback(async () => {
    if (!Device.isDevice) {
      await syncPermission();
      return;
    }
    await Notifications.requestPermissionsAsync();
    await syncPermission();
  }, [syncPermission]);

  useEffect(() => {
    void getOrCreateInstallationCredential().then(setCredential);
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      void Notifications.setNotificationChannelAsync("match", {
        name: "맞춤 공고 알림",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      void syncPermission();
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openPushHref(response.notification.request.content.data?.href);
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openPushHref(response.notification.request.content.data?.href);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [openPushHref, syncPermission]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncPermission();
    });
    return () => subscription.remove();
  }, [syncPermission]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack) return false;
      webViewRef.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  const handleWebMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseWebMessage(event.nativeEvent.data);
      if (!message) return;
      if (message.type === "REQUEST_PUSH_PERMISSION") {
        void requestPushPermission();
      } else if (message.type === "OPEN_NOTIFICATION_SETTINGS") {
        void Linking.openSettings();
      } else {
        void syncPermission();
      }
    },
    [requestPushPermission, syncPermission],
  );

  const handleNavigation = useCallback((request: { url: string }) => {
    const { url } = request;
    if (url === "about:blank") return true;
    if (url.startsWith("tel:") || url.startsWith("mailto:")) {
      void Linking.openURL(url);
      return false;
    }
    try {
      const parsed = new URL(url);
      if (parsed.origin === WEB_ORIGIN || WEBVIEW_AUTH_HOSTS.has(parsed.hostname)) return true;
      void Linking.openURL(url);
      return false;
    } catch {
      return false;
    }
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top", "right", "bottom", "left"]}>
        <StatusBar barStyle="dark-content" />
        <WebView
          ref={webViewRef}
          source={{ uri: WEB_BASE_URL }}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color="#111827" />
            </View>
          )}
          onLoadEnd={() => void syncPermission()}
          onMessage={handleWebMessage}
          onNavigationStateChange={(state: WebViewNavigation) => {
            currentUrlRef.current = state.url;
            setCanGoBack(state.canGoBack);
          }}
          onShouldStartLoadWithRequest={handleNavigation}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

async function getPushPermission(): Promise<PushPermissionPayload> {
  if (!Device.isDevice) {
    return {
      permission: "unavailable",
      canAskAgain: false,
      checkedAt: new Date().toISOString(),
    };
  }
  const response = await Notifications.getPermissionsAsync();
  return {
    permission:
      response.status === Notifications.PermissionStatus.GRANTED
        ? "granted"
        : response.status === Notifications.PermissionStatus.DENIED
          ? "denied"
          : "undetermined",
    canAskAgain: response.canAskAgain,
    checkedAt: new Date().toISOString(),
  };
}

async function getExpoPushToken(): Promise<string | null> {
  const projectId =
    (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ||
    Constants.easConfig?.projectId;
  if (!projectId) return null;
  try {
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (error) {
    console.warn("Expo push token 발급 실패", error);
    return null;
  }
}

async function getOrCreateInstallationCredential(): Promise<InstallationCredential> {
  const existingId = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  const existingSecret = await SecureStore.getItemAsync(INSTALLATION_SECRET_KEY);
  if (existingId && existingSecret) {
    return { installationId: existingId, installationSecret: existingSecret };
  }

  const installationId = Crypto.randomUUID();
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const installationSecret = Array.from(randomBytes, (value) => value.toString(16).padStart(2, "0")).join("");
  await Promise.all([
    SecureStore.setItemAsync(INSTALLATION_ID_KEY, installationId),
    SecureStore.setItemAsync(INSTALLATION_SECRET_KEY, installationSecret),
  ]);
  return { installationId, installationSecret };
}

function isAllowedPushHref(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  if (href === "/") return true;
  return ALLOWED_PUSH_PATHS.some((prefix) => href === prefix.slice(0, -1) || href.startsWith(prefix));
}

function isTrustedWebUrl(url: string): boolean {
  try {
    return new URL(url).origin === WEB_ORIGIN;
  } catch {
    return false;
  }
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
