import type { AlertJobType, NotificationPreference, NotificationRule } from "@balink/domain";
import { uniqueInterestRegionCount } from "@balink/domain";

/** Amplitude production event taxonomy (Object + past-tense Action). */

export const AmplitudeEventName = {
  /** Autocapture page view + post context (post_id, region, bookmark state, …). */
  ViewedJobDetail: "Viewed Job Detail",
  ViewedSubstituteDetail: "Viewed Substitute Detail",
  ClickedDirectApply: "Clicked Direct Apply",
  ClickedSourceLink: "Clicked Source Link",
  ToggledBookmark: "Toggled Bookmark",
  CreatedNotificationRule: "Created Notification Rule",
  UpdatedNotificationPreference: "Updated Notification Preference",
  DeletedNotificationRule: "Deleted Notification Rule",
  ClickedListFilter: "Clicked List Filter",
  ChangedListSort: "Changed List Sort",
} as const;

export type AmplitudeEventName =
  (typeof AmplitudeEventName)[keyof typeof AmplitudeEventName];

export type AmplitudePostKind = "job" | "substitute";

export type AmplitudeScreen =
  | "job_detail"
  | "substitute_detail"
  | "job_list"
  | "substitute_list"
  | "notification_settings"
  | "notification_rules"
  | "saved";

export type ListFilterSource = "chip" | "sheet_apply" | "sheet_reset";

export type ListFilterKind =
  | "region_all"
  | "region_sido"
  | "region_sigungu"
  | "region_combo"
  | "date_all"
  | "date"
  | "sheet_apply"
  | "sheet_reset";

export type NotificationPreferenceScreen =
  | "notification_settings"
  | "notification_rules";

export type NotificationUpdateKind =
  | "rule_edit"
  | "master_toggle"
  | "rule_toggle";

export type ViewedJobDetailProps = {
  screen: "job_detail";
  post_kind: "job";
  post_id: string;
  organization_id?: string | null;
  job_type?: string | null;
  sido?: string | null;
  sigungu?: string | null;
  has_direct_apply: boolean;
  is_bookmarked: boolean;
};

export type ViewedSubstituteDetailProps = {
  screen: "substitute_detail";
  post_kind: "substitute";
  post_id: string;
  status?: string | null;
  urgency?: string | null;
  sido?: string | null;
  sigungu?: string | null;
  has_direct_apply: boolean;
  is_bookmarked: boolean;
};

export type ClickedDirectApplyProps = {
  screen: "job_detail" | "substitute_detail";
  post_kind: AmplitudePostKind;
  post_id: string;
};

export type ClickedSourceLinkProps = {
  screen: "job_detail" | "substitute_detail";
  post_kind: AmplitudePostKind;
  post_id: string;
  source_label?: string | null;
};

export type ToggledBookmarkProps = {
  screen: "job_detail" | "substitute_detail" | "saved";
  post_kind: AmplitudePostKind;
  post_id: string;
  bookmarked: boolean;
  has_job_bookmarks: boolean;
  has_substitute_bookmarks: boolean;
};

export type NotificationPreferenceContextProps = {
  screen: NotificationPreferenceScreen;
  notifications_enabled: boolean;
  notification_rule_count: number;
  enabled_notification_rule_count: number;
  has_regular_notification_rules: boolean;
  has_substitute_notification_rules: boolean;
  unique_notification_region_count: number;
};

export type CreatedNotificationRuleProps = NotificationPreferenceContextProps & {
  screen: "notification_settings";
  rule_id: string;
  job_type: AlertJobType;
};

export type UpdatedNotificationPreferenceProps = NotificationPreferenceContextProps & {
  update_kind: NotificationUpdateKind;
  rule_id?: string;
};

export type DeletedNotificationRuleProps = NotificationPreferenceContextProps & {
  screen: "notification_rules";
  rule_id: string;
  job_type: AlertJobType;
};

export type ClickedListFilterProps = {
  screen: "job_list" | "substitute_list";
  post_kind: AmplitudePostKind;
  filter_source: ListFilterSource;
  filter_kind: ListFilterKind;
  filter_value?: string;
  filter_selected: boolean;
  active_sido_count?: number;
  active_sigungu_count?: number;
  active_date_count?: number;
  active_region_count?: number;
  sort: string;
};

export type ChangedListSortProps = {
  screen: "job_list" | "substitute_list";
  post_kind: AmplitudePostKind;
  sort: string;
  previous_sort: string;
};

export type AmplitudeEventPropsByName = {
  [AmplitudeEventName.ViewedJobDetail]: ViewedJobDetailProps;
  [AmplitudeEventName.ViewedSubstituteDetail]: ViewedSubstituteDetailProps;
  [AmplitudeEventName.ClickedDirectApply]: ClickedDirectApplyProps;
  [AmplitudeEventName.ClickedSourceLink]: ClickedSourceLinkProps;
  [AmplitudeEventName.ToggledBookmark]: ToggledBookmarkProps;
  [AmplitudeEventName.CreatedNotificationRule]: CreatedNotificationRuleProps;
  [AmplitudeEventName.UpdatedNotificationPreference]: UpdatedNotificationPreferenceProps;
  [AmplitudeEventName.DeletedNotificationRule]: DeletedNotificationRuleProps;
  [AmplitudeEventName.ClickedListFilter]: ClickedListFilterProps;
  [AmplitudeEventName.ChangedListSort]: ChangedListSortProps;
};

export function buildNotificationPreferenceContextProps(
  preference: NotificationPreference,
  screen: NotificationPreferenceScreen,
): NotificationPreferenceContextProps {
  const enabledRules = preference.rules.filter((rule) => rule.enabled);
  return {
    screen,
    notifications_enabled: preference.enabled,
    notification_rule_count: preference.rules.length,
    enabled_notification_rule_count: enabledRules.length,
    has_regular_notification_rules: preference.rules.some(
      (rule) => rule.jobType === "regular",
    ),
    has_substitute_notification_rules: preference.rules.some(
      (rule) => rule.jobType === "substitute",
    ),
    unique_notification_region_count: uniqueInterestRegionCount(preference.rules),
  };
}

export function buildCreatedNotificationRuleProps(
  preference: NotificationPreference,
  rule: NotificationRule,
): CreatedNotificationRuleProps {
  return {
    ...buildNotificationPreferenceContextProps(preference, "notification_settings"),
    screen: "notification_settings",
    rule_id: rule.id,
    job_type: rule.jobType,
  };
}

export function buildUpdatedNotificationPreferenceProps(
  preference: NotificationPreference,
  screen: NotificationPreferenceScreen,
  input: { updateKind: NotificationUpdateKind; ruleId?: string },
): UpdatedNotificationPreferenceProps {
  return {
    ...buildNotificationPreferenceContextProps(preference, screen),
    update_kind: input.updateKind,
    ...(input.ruleId ? { rule_id: input.ruleId } : {}),
  };
}

export function buildDeletedNotificationRuleProps(
  preference: NotificationPreference,
  rule: Pick<NotificationRule, "id" | "jobType">,
): DeletedNotificationRuleProps {
  return {
    ...buildNotificationPreferenceContextProps(preference, "notification_rules"),
    screen: "notification_rules",
    rule_id: rule.id,
    job_type: rule.jobType,
  };
}

/** Drop null/undefined so Amplitude payloads stay dense and schema-stable. */
export function compactAmplitudeProps<T extends Record<string, unknown>>(
  props: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === "") continue;
    out[key] = value;
  }
  return out;
}
