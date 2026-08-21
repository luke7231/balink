"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import {
  getPushPermissionAction,
  type PushPermission,
} from "@/lib/push-permission";

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

const UNAVAILABLE_DISMISS_KEY = "balink.push-unavailable-callout-dismissed";
const UNAVAILABLE_DISMISS_EVENT = "balink:push-unavailable-dismissed";

export function PushPermissionCallout({
  loggedIn,
  serverEnabled,
  activeRuleSummaries = [],
}: {
  loggedIn: boolean;
  serverEnabled: boolean;
  activeRuleSummaries?: string[];
}) {
  const state = useSyncExternalStore(
    subscribeToPushState,
    getPushStateSnapshot,
    getServerPushStateSnapshot,
  );
  const unavailableDismissed = useSyncExternalStore(
    subscribeUnavailableDismissed,
    getUnavailableDismissedSnapshot,
    () => false,
  );

  useEffect(() => {
    window.balinkPush?.refreshPermission();
  }, []);

  if (!state.isMobileApp) return null;

  if (!loggedIn) {
    return (
      <PushPanel
        tone={state.permissionStatus === "granted" ? "success" : "warning"}
        title={
          state.permissionStatus === "granted"
            ? "공용 앱 알림을 받고 있어요"
            : "긴급 대강과 신규 채용 소식을 받아보세요"
        }
        description={
          state.permissionStatus === "granted"
            ? "당일 긴급 대강은 바로, 신규 채용은 매일 한 번 알려드려요."
            : "로그인하지 않아도 당일 긴급 대강과 신규 채용 일일 요약을 받을 수 있어요."
        }
        action={permissionAction(state)}
      >
        <Link
          href="/login"
          className="text-xs font-semibold text-muted-foreground underline underline-offset-2"
        >
          맞춤 조건 알림은 로그인 후 설정
        </Link>
      </PushPanel>
    );
  }

  if (!serverEnabled || activeRuleSummaries.length === 0) {
    return (
      <PushPanel
        tone="neutral"
        title="맞춤 알림 조건이 꺼져 있어요"
        description="지역·요일 조건을 켜면 해당 공고가 등록될 때 앱으로 알려드려요."
      >
        <Link
          href="/notifications/rules"
          className="inline-flex rounded-full bg-foreground px-3.5 py-2 text-xs font-semibold text-background"
        >
          알림 조건 켜기
        </Link>
      </PushPanel>
    );
  }

  const rules = activeRuleSummaries.slice(0, 2).join(" · ");
  if (state.permissionStatus === "granted") {
    return (
      <PushPanel
        tone="success"
        title="이 디바이스에서 맞춤 알림을 받고 있어요"
        description={`${rules} 조건이 켜져 있어요.`}
      />
    );
  }
  if (state.permissionStatus === "unavailable") {
    if (unavailableDismissed) return null;
    return (
      <PushPanel
        tone="neutral"
        title="이 디바이스에서는 푸시를 사용할 수 없어요"
        description={`${rules} 조건은 켜져 있으며 알림함에서는 계속 확인할 수 있어요.`}
        onDismiss={dismissUnavailableCallout}
      />
    );
  }

  return (
    <PushPanel
      tone="warning"
      title="조건은 켜져 있지만 디바이스 알림이 꺼져 있어요"
      description={`${rules} 조건의 새 공고를 놓치지 않도록 앱 알림을 켜 주세요.`}
      action={permissionAction(state)}
    />
  );
}

function subscribeToPushState(onStoreChange: () => void) {
  window.addEventListener("balink:push-state", onStoreChange);
  return () => window.removeEventListener("balink:push-state", onStoreChange);
}

function getPushStateSnapshot(): PushState {
  return window.balinkPush?.getState() ?? INITIAL_STATE;
}

function getServerPushStateSnapshot(): PushState {
  return INITIAL_STATE;
}

function subscribeUnavailableDismissed(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === UNAVAILABLE_DISMISS_KEY || event.key === null)
      onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(UNAVAILABLE_DISMISS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(UNAVAILABLE_DISMISS_EVENT, onStoreChange);
  };
}

function getUnavailableDismissedSnapshot(): boolean {
  try {
    return window.localStorage.getItem(UNAVAILABLE_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function dismissUnavailableCallout() {
  try {
    window.localStorage.setItem(UNAVAILABLE_DISMISS_KEY, "1");
  } catch {
    // ignore quota / private mode
  }
  window.dispatchEvent(new Event(UNAVAILABLE_DISMISS_EVENT));
}

function permissionAction(state: PushState) {
  const action = getPushPermissionAction(
    state.permissionStatus,
    state.canAskAgain,
  );
  if (!action) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (action === "request") window.balinkPush?.requestPermission();
        else window.balinkPush?.openSettings();
      }}
      className="rounded-full bg-amber-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-800"
    >
      {action === "request" ? "앱 알림 켜기" : "앱 설정 열기"}
    </button>
  );
}

function PushPanel({
  tone,
  title,
  description,
  action,
  children,
  onDismiss,
}: {
  tone: "success" | "warning" | "neutral";
  title: string;
  description: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  onDismiss?: () => void;
}) {
  const colors = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    neutral: "border-border bg-surface-muted text-foreground",
  };
  return (
    <section
      className={`relative mb-6 rounded-2xl border px-4 py-4 ${colors[tone]}`}
    >
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="다시 보지 않기"
          className="absolute top-3 right-3 rounded-full p-1.5 text-muted-foreground transition hover:bg-surface hover:text-foreground"
        >
          <DismissIcon />
        </button>
      ) : null}
      <p className={`text-sm font-semibold ${onDismiss ? "pr-8" : ""}`}>
        {title}
      </p>
      <p
        className={`mt-1 text-xs leading-5 opacity-75 ${onDismiss ? "pr-8" : ""}`}
      >
        {description}
      </p>
      {action || children ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {action}
          {children}
        </div>
      ) : null}
    </section>
  );
}

function DismissIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
