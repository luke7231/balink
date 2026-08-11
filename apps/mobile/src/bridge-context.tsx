import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Linking, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { InstallationCredential, NativeToWebMessage, PushPermissionPayload } from "./bridge";
import {
  getExpoPushToken,
  getOrCreateInstallationCredential,
  getPushPermission,
  requestPushPermission as requestNativePushPermission,
} from "./installation";
import { isAllowedPushHref } from "./web-config";

type PushOpenHandler = (href: string) => void;

interface BridgeContextValue {
  credential: InstallationCredential | null;
  buildPermissionMessages: () => Promise<NativeToWebMessage[]>;
  requestPushPermission: () => Promise<void>;
  openNotificationSettings: () => void;
  setPushOpenHandler: (handler: PushOpenHandler | null) => void;
}

const BridgeContext = createContext<BridgeContextValue | null>(null);

export function BridgeProvider({ children }: { children: ReactNode }) {
  const [credential, setCredential] = useState<InstallationCredential | null>(null);
  const pushOpenHandlerRef = useRef<PushOpenHandler | null>(null);

  useEffect(() => {
    void getOrCreateInstallationCredential().then(setCredential);
  }, []);

  const openPushHref = useCallback((href: unknown) => {
    if (typeof href !== "string" || !isAllowedPushHref(href)) return;
    pushOpenHandlerRef.current?.(href);
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

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {});
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        openPushHref(response.notification.request.content.data?.href);
      },
    );
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openPushHref(response.notification.request.content.data?.href);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [openPushHref]);

  const buildPermissionMessages = useCallback(async (): Promise<NativeToWebMessage[]> => {
    const permission: PushPermissionPayload = await getPushPermission();
    const messages: NativeToWebMessage[] = [{ type: "PUSH_PERMISSION_STATUS", ...permission }];
    if (!credential) return messages;

    messages.push({
      type: "PUSH_INSTALLATION",
      platform: Platform.OS === "ios" ? "ios" : "android",
      ...credential,
    });

    if (permission.permission === "granted") {
      const expoPushToken = await getExpoPushToken();
      if (expoPushToken) {
        messages.push({
          type: "PUSH_TOKEN",
          expoPushToken,
          platform: Platform.OS === "ios" ? "ios" : "android",
          ...credential,
        });
      }
    }
    return messages;
  }, [credential]);

  const requestPushPermission = useCallback(async () => {
    await requestNativePushPermission();
  }, []);

  const setPushOpenHandler = useCallback((handler: PushOpenHandler | null) => {
    pushOpenHandlerRef.current = handler;
  }, []);

  const value = useMemo(
    () => ({
      credential,
      buildPermissionMessages,
      requestPushPermission,
      openNotificationSettings: () => {
        void Linking.openSettings();
      },
      setPushOpenHandler,
    }),
    [credential, buildPermissionMessages, requestPushPermission, setPushOpenHandler],
  );

  return <BridgeContext.Provider value={value}>{children}</BridgeContext.Provider>;
}

export function useBridge(): BridgeContextValue {
  const value = useContext(BridgeContext);
  if (!value) throw new Error("useBridge must be used within BridgeProvider");
  return value;
}
