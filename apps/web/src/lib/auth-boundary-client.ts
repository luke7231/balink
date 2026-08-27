"use client";

import { useEffect, type FormEvent, type MutableRefObject } from "react";
import { notifyWebViewSync } from "@/lib/native-shell";

/** Notify native shell that auth changed — other tab WebViews refresh on focus. */
export function notifyAuthBoundaryChange(): boolean {
  return notifyWebViewSync("auth");
}

export type PrepareAuthBoundaryOptions = {
  /** Detach push from the current user (logout / account delete). */
  detachPush?: boolean;
};

/**
 * Client half of the auth-boundary pipeline.
 * Always bumps native WEB_SYNC(auth); optionally detaches push first.
 */
export async function prepareAuthBoundaryChange(
  options: PrepareAuthBoundaryOptions = {},
): Promise<void> {
  notifyWebViewSync("auth");
  if (!options.detachPush) return;
  const detach = window.balinkPush?.detach;
  if (!detach) return;
  await Promise.race([
    detach(),
    new Promise<void>((resolve) => window.setTimeout(resolve, 1_500)),
  ]);
}

/**
 * Form submit handler for server actions that cross the auth boundary
 * (logout, account delete). Notifies native, optionally detaches push, then submits.
 */
export function createAuthBoundaryFormSubmit(options: {
  submittingRef: MutableRefObject<boolean>;
  detachPush?: boolean;
}) {
  return (event: FormEvent<HTMLFormElement>) => {
    if (options.submittingRef.current) return;
    const form = event.currentTarget;
    const shouldDetach = Boolean(options.detachPush && window.balinkPush?.detach);

    if (!shouldDetach) {
      notifyWebViewSync("auth");
      return;
    }

    event.preventDefault();
    options.submittingRef.current = true;
    void prepareAuthBoundaryChange({ detachPush: true }).finally(() => {
      form.requestSubmit();
    });
  };
}

/** Mount once on post-auth landing screens (welcome, OAuth return). */
export function AuthBoundarySync() {
  useEffect(() => {
    notifyAuthBoundaryChange();
  }, []);
  return null;
}
