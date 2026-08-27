"use client";

import { useState } from "react";
import type { NotificationPreference } from "@balink/domain";

/** Keep local edits, but replace them when the server sends a new preference. */
export function useSyncedNotificationPreference(
  initialPreference: NotificationPreference,
) {
  const [preference, setPreference] = useState(initialPreference);
  const [snapshot, setSnapshot] = useState(initialPreference);
  if (initialPreference !== snapshot) {
    setSnapshot(initialPreference);
    setPreference(initialPreference);
  }
  return [preference, setPreference] as const;
}
