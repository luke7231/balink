export interface JobPostSummary {
  id: string;
  title: string;
  sourcePrimary: string;
  jobType: string | null;
  postedAt: string | null;
  locationText: string | null;
  sido: string | null;
  sigungu: string | null;
  dongOrStation: string | null;
  audienceTypes: string[];
  subjectTypes: string[];
  days: string[];
  timeSlots: string[];
  times: string[];
  payText: string | null;
  payMinManwon: number | null;
  payMaxManwon: number | null;
  payNegotiable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JobPostConnection {
  items: JobPostSummary[];
  pageInfo: PageInfo;
}

export interface JobPostSourceLink {
  id: string;
  source: string;
  sourceUrl: string;
  confidence: string | null;
  sourcePost: {
    id: string;
    sourcePostId: string;
    title: string;
    sourceUrl: string;
    postedAt: string | null;
  };
}

export interface JobPostDetail extends JobPostSummary {
  description: string | null;
  status: string | null;
  isBallet: boolean;
  balletConfidence: string | null;
  classCount: number | null;
  durationMinutes: number | null;
  payType: string | null;
  contactMethods: string[];
  contactEmails: string[];
  contactPhones: string[];
  requirements: unknown;
  confidence: unknown;
  sources: JobPostSourceLink[];
}

export interface HealthStatus {
  ok: boolean;
  service: string;
  jobCount: number;
}
