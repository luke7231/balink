"use client";

import { trackAmplitudeEvent } from "@/lib/amplitude-client";
import {
  AmplitudeEventName,
  buildCreatedNotificationRuleProps,
  buildDeletedNotificationRuleProps,
  buildUpdatedNotificationPreferenceProps,
  type NotificationPreferenceScreen,
  type NotificationUpdateKind,
} from "@/lib/amplitude-events";
import type { NotificationPreference, NotificationRule } from "@balink/domain";

export function trackCreatedNotificationRule(
  preference: NotificationPreference,
  rule: NotificationRule,
) {
  trackAmplitudeEvent(
    AmplitudeEventName.CreatedNotificationRule,
    buildCreatedNotificationRuleProps(preference, rule),
  );
}

export function trackUpdatedNotificationPreference(
  preference: NotificationPreference,
  screen: NotificationPreferenceScreen,
  input: { updateKind: NotificationUpdateKind; ruleId?: string },
) {
  trackAmplitudeEvent(
    AmplitudeEventName.UpdatedNotificationPreference,
    buildUpdatedNotificationPreferenceProps(preference, screen, input),
  );
}

export function trackDeletedNotificationRule(
  preference: NotificationPreference,
  rule: Pick<NotificationRule, "id" | "jobType">,
) {
  trackAmplitudeEvent(
    AmplitudeEventName.DeletedNotificationRule,
    buildDeletedNotificationRuleProps(preference, rule),
  );
}
