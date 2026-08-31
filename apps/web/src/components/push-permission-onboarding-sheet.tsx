"use client";

import { MapPinIcon } from "@balink/ui";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { ButtonPendingContent } from "@/components/pending-submit-button";
import { CTA_PRESS_CLASS } from "@/lib/button-classes";
import type { PushPermission } from "@/lib/push-permission";

interface PushState {
  isMobileApp: boolean;
  permissionStatus: PushPermission;
  canAskAgain: boolean;
  checkedAt: string | null;
  attached: boolean;
}

const INITIAL_STATE: PushState = {
  isMobileApp: false,
  permissionStatus: "undetermined",
  canAskAgain: true,
  checkedAt: null,
  attached: false,
};

/** Stable snapshot for useSyncExternalStore — must not allocate every read. */
let pushStateSnapshot: PushState = INITIAL_STATE;

const SEEN_KEY = "balink.push-permission-onboarding-seen";
const SEEN_EVENT = "balink:push-permission-onboarding-seen";

const BENEFITS = [
  {
    title: "원하는 지역만",
    Icon: MapPinIcon,
  },
  {
    title: "언제든 끄고 킬 수 있음",
    Icon: ToggleIcon,
  },
  {
    title: "당일 긴급 대강·신규 채용을 바로 알려줘요",
    Icon: BellIcon,
  },
] as const;

export function PushPermissionOnboardingSheet() {
  const state = useSyncExternalStore(
    subscribeToPushState,
    getPushStateSnapshot,
    () => INITIAL_STATE,
  );
  const seen = useSyncExternalStore(
    subscribeSeen,
    getSeenSnapshot,
    () => true,
  );
  const [requesting, setRequesting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    window.balinkPush?.refreshPermission();
  }, []);

  // Already decided at OS level — never show this sheet again.
  useEffect(() => {
    if (!state.isMobileApp || !state.checkedAt) return;
    if (state.permissionStatus === "undetermined" && state.canAskAgain) return;
    markSeen();
  }, [state.isMobileApp, state.checkedAt, state.permissionStatus, state.canAskAgain]);

  const shouldOpen =
    !seen &&
    !dismissed &&
    state.isMobileApp &&
    Boolean(state.checkedAt) &&
    state.permissionStatus === "undetermined" &&
    state.canAskAgain;

  const handleRequest = useCallback(() => {
    if (requesting) return;
    setRequesting(true);
    window.balinkPush?.requestPermission();
    markSeen();
    setDismissed(true);
  }, [requesting]);

  return (
    <BottomSheet
      open={shouldOpen}
      title="앱 알림"
      onClose={() => {}}
      dismissible={false}
    >
      <p className="text-base font-semibold leading-snug text-foreground">
        원하는 지역·알림을 받기 위해선,
        <br />
        알림 권한이 필요해요.
      </p>

      <ul className="mt-5 space-y-3">
        {BENEFITS.map(({ title, Icon }) => (
          <li
            key={title}
            className="flex items-center gap-3 rounded-2xl bg-surface-muted px-4 py-3.5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-foreground">
              <Icon size={20} className="text-foreground" />
            </span>
            <span className="min-w-0 text-sm font-semibold text-foreground">
              {title}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleRequest}
        disabled={requesting}
        aria-busy={requesting}
        className={`mt-6 flex h-13 w-full items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-background transition hover:opacity-90 disabled:opacity-60 ${CTA_PRESS_CLASS}`}
      >
        <ButtonPendingContent pending={requesting} pendingLabel="요청 중...">
          앱 알림 켜기
        </ButtonPendingContent>
      </button>
    </BottomSheet>
  );
}

function readPushState(): PushState {
  return window.balinkPush?.getState() ?? INITIAL_STATE;
}

function pushStateEquals(a: PushState, b: PushState): boolean {
  return (
    a.isMobileApp === b.isMobileApp &&
    a.permissionStatus === b.permissionStatus &&
    a.canAskAgain === b.canAskAgain &&
    a.checkedAt === b.checkedAt &&
    a.attached === b.attached
  );
}

function refreshPushStateSnapshot(): PushState {
  const next = readPushState();
  if (pushStateEquals(pushStateSnapshot, next)) return pushStateSnapshot;
  pushStateSnapshot = { ...next };
  return pushStateSnapshot;
}

function subscribeToPushState(onStoreChange: () => void) {
  const onEvent = () => {
    refreshPushStateSnapshot();
    onStoreChange();
  };
  window.addEventListener("balink:push-state", onEvent);
  return () => window.removeEventListener("balink:push-state", onEvent);
}

function getPushStateSnapshot(): PushState {
  return refreshPushStateSnapshot();
}

function subscribeSeen(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === SEEN_KEY || event.key === null) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(SEEN_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(SEEN_EVENT, onStoreChange);
  };
}

function getSeenSnapshot(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

function markSeen() {
  try {
    if (window.localStorage.getItem(SEEN_KEY) === "1") return;
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // ignore quota / private mode
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

function BellIcon({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className={["shrink-0", className].filter(Boolean).join(" ")}
    >
      <path
        d="M12 3.5a5 5 0 0 0-5 5v2.2c0 .7-.2 1.4-.6 2L5.2 14.4A1.4 1.4 0 0 0 6.4 16.5h11.2a1.4 1.4 0 0 0 1.2-2.1l-1.2-1.7c-.4-.6-.6-1.3-.6-2V8.5a5 5 0 0 0-5-5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 18.5a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ToggleIcon({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden
      className={["shrink-0", className].filter(Boolean).join(" ")}
    >
      <rect
        x="2.5"
        y="7"
        width="19"
        height="10"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="15.5" cy="12" r="3.2" fill="currentColor" />
    </svg>
  );
}
