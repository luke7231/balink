"use client";

import { useCallback, useEffect, useRef } from "react";

type PushPermission = "granted" | "denied" | "undetermined" | "unavailable";
type Platform = "ios" | "android";

interface Credential {
  installationId: string;
  installationSecret: string;
}

interface PushState {
  isMobileApp: boolean;
  permissionStatus: PushPermission;
  canAskAgain: boolean;
  checkedAt: string | null;
  attached: boolean;
}

type NativeMessage =
  | ({ type: "PUSH_INSTALLATION"; platform: Platform } & Credential)
  | ({
      type: "PUSH_TOKEN";
      expoPushToken: string;
      platform: Platform;
    } & Credential)
  | {
      type: "PUSH_PERMISSION_STATUS";
      permission: PushPermission;
      canAskAgain: boolean;
      checkedAt: string;
    }
  | { type: "PUSH_OPENED"; href: string };

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage(message: string): void };
    balinkPush?: {
      requestPermission(): void;
      openSettings(): void;
      refreshPermission(): void;
      detach(): Promise<void>;
      getState(): PushState;
    };
  }
}

const INITIAL_STATE: PushState = {
  isMobileApp: false,
  permissionStatus: "undetermined",
  canAskAgain: true,
  checkedAt: null,
  attached: false,
};

export function MobileBridge() {
  const credentialRef = useRef<Credential | null>(null);
  const platformRef = useRef<Platform | null>(null);
  const tokenRef = useRef<string | null>(null);
  const stateRef = useRef<PushState>(INITIAL_STATE);
  const syncSequenceRef = useRef(0);

  const publishState = useCallback((patch: Partial<PushState>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    window.dispatchEvent(
      new CustomEvent<PushState>("balink:push-state", {
        detail: stateRef.current,
      }),
    );
  }, []);

  const syncInstallation = useCallback(async () => {
    const credential = credentialRef.current;
    const platform = platformRef.current;
    if (!credential || !platform) return;
    const sequence = ++syncSequenceRef.current;
    try {
      const response = await fetch("/api/push/installations", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...credential,
          expoPushToken: tokenRef.current,
          platform,
          permissionStatus: stateRef.current.permissionStatus,
          canAskAgain: stateRef.current.canAskAgain,
        }),
      });
      if (!response.ok) throw new Error(`installation sync failed: ${response.status}`);
      if (sequence !== syncSequenceRef.current) return;

      const attachResponse = await fetch("/api/push/installations/attach", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(credential),
      });
      publishState({ attached: attachResponse.ok });
    } catch (error) {
      console.warn("[mobile-bridge] push installation sync failed", error);
    }
  }, [publishState]);

  useEffect(() => {
    if (!window.ReactNativeWebView) return;
    publishState({ isMobileApp: true });

    const handleMessage = (event: MessageEvent<string>) => {
      if (typeof event.data !== "string") return;
      let message: NativeMessage;
      try {
        message = JSON.parse(event.data) as NativeMessage;
      } catch {
        return;
      }

      if (message.type === "PUSH_PERMISSION_STATUS") {
        publishState({
          permissionStatus: message.permission,
          canAskAgain: message.canAskAgain,
          checkedAt: message.checkedAt,
        });
        void syncInstallation();
      } else if (message.type === "PUSH_INSTALLATION") {
        credentialRef.current = {
          installationId: message.installationId,
          installationSecret: message.installationSecret,
        };
        platformRef.current = message.platform;
        void syncInstallation();
      } else if (message.type === "PUSH_TOKEN") {
        credentialRef.current = {
          installationId: message.installationId,
          installationSecret: message.installationSecret,
        };
        platformRef.current = message.platform;
        tokenRef.current = message.expoPushToken;
        void syncInstallation();
      }
    };

    window.addEventListener("message", handleMessage);
    window.balinkPush = {
      requestPermission: () => postNative({ type: "REQUEST_PUSH_PERMISSION" }),
      openSettings: () => postNative({ type: "OPEN_NOTIFICATION_SETTINGS" }),
      refreshPermission: () => postNative({ type: "GET_PUSH_PERMISSION" }),
      detach: async () => {
        const credential = credentialRef.current;
        if (!credential) return;
        const response = await fetch("/api/push/installations/detach", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(credential),
        });
        if (response.ok) publishState({ attached: false });
      },
      getState: () => stateRef.current,
    };
    postNative({ type: "READY" });

    return () => {
      window.removeEventListener("message", handleMessage);
      delete window.balinkPush;
    };
  }, [publishState, syncInstallation]);

  return null;
}

function postNative(message: {
  type:
    | "READY"
    | "GET_PUSH_PERMISSION"
    | "REQUEST_PUSH_PERMISSION"
    | "OPEN_NOTIFICATION_SETTINGS";
}) {
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
}
