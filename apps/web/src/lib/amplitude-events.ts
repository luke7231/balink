/** Amplitude production event taxonomy (Object + past-tense Action). */

export const AmplitudeEventName = {
  ViewedHomePage: "Viewed Home Page",
  ViewedJobDetail: "Viewed Job Detail",
  ViewedSubstituteDetail: "Viewed Substitute Detail",
  ClickedDirectApply: "Clicked Direct Apply",
  ClickedSourceLink: "Clicked Source Link",
  ToggledBookmark: "Toggled Bookmark",
} as const;

export type AmplitudeEventName =
  (typeof AmplitudeEventName)[keyof typeof AmplitudeEventName];

export type AmplitudePostKind = "job" | "substitute";

export type AmplitudeScreen =
  | "home"
  | "job_detail"
  | "substitute_detail";

type BaseProps = {
  screen: AmplitudeScreen;
};

export type ViewedHomePageProps = BaseProps & {
  screen: "home";
};

export type ViewedJobDetailProps = BaseProps & {
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

export type ViewedSubstituteDetailProps = BaseProps & {
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
};

export type AmplitudeEventPropsByName = {
  [AmplitudeEventName.ViewedHomePage]: ViewedHomePageProps;
  [AmplitudeEventName.ViewedJobDetail]: ViewedJobDetailProps;
  [AmplitudeEventName.ViewedSubstituteDetail]: ViewedSubstituteDetailProps;
  [AmplitudeEventName.ClickedDirectApply]: ClickedDirectApplyProps;
  [AmplitudeEventName.ClickedSourceLink]: ClickedSourceLinkProps;
  [AmplitudeEventName.ToggledBookmark]: ToggledBookmarkProps;
};

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
