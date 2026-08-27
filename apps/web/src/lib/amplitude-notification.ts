"use client";

import { trackAmplitudeEvent } from "@/lib/amplitude-client";
import {
  AmplitudeEventName,
  buildSavedNotificationPreferenceProps,
  type SavedNotificationPreferenceProps,
} from "@/lib/amplitude-events";
import type { NotificationPreference } from "@balink/domain";

export function trackSavedNotificationPreference(
  preference: NotificationPreference,
  screen: SavedNotificationPreferenceProps["screen"],
) {
  trackAmplitudeEvent(
    AmplitudeEventName.SavedNotificationPreference,
    buildSavedNotificationPreferenceProps(preference, screen),
  );
}
