export interface DisplaySection {
  title: string;
  content: string;
}

export type PayUnit =
  | "hourly"
  | "per_class"
  | "daily"
  | "weekly"
  | "monthly"
  | "lump_sum"
  | "variable"
  | "negotiable"
  | "unspecified";

export type LocationSource = "raw" | "hint" | "kakao" | "validated" | "llm";

export interface RepresentativePay {
  unit: PayUnit;
  displayText: string;
  minManwon: number | null;
  maxManwon: number | null;
  evidence: string | null;
  confidence: "high" | "medium" | "low";
  hasConflict: boolean;
  alternateEvidence: string | null;
}

export interface NormalizedLocation {
  source: LocationSource;
  locationText: string | null;
  sido: string | null;
  sigungu: string | null;
  dongOrStation: string | null;
  confidence: "high" | "medium" | "low";
}

export interface ListingEnrichment {
  displaySections: DisplaySection[];
  representativePay: RepresentativePay;
  location: NormalizedLocation;
  meta: {
    formattedAt: string;
    formatModel: string | null;
    geocodeAttempted: boolean;
  };
}
