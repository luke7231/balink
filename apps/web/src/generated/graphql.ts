import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  JSON: { input: unknown; output: unknown; }
};

export type AcademyGalleryImage = {
  __typename?: 'AcademyGalleryImage';
  order: Scalars['Int']['output'];
  sourceUrl?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type DisplaySection = {
  __typename?: 'DisplaySection';
  content: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type Health = {
  __typename?: 'Health';
  jobCount: Scalars['Int']['output'];
  latestScraperRun?: Maybe<ScraperRun>;
  ok: Scalars['Boolean']['output'];
  service: Scalars['String']['output'];
  substituteCount: Scalars['Int']['output'];
};

export type JobPost = {
  __typename?: 'JobPost';
  academyGallery: Array<AcademyGalleryImage>;
  academyLogoUrl?: Maybe<Scalars['String']['output']>;
  academyThumbnailUrl?: Maybe<Scalars['String']['output']>;
  audienceTypes: Array<Scalars['String']['output']>;
  balletConfidence?: Maybe<Scalars['String']['output']>;
  classCount?: Maybe<Scalars['Int']['output']>;
  confidence?: Maybe<Scalars['JSON']['output']>;
  contactEmails: Array<Scalars['String']['output']>;
  contactMethods: Array<Scalars['String']['output']>;
  contactPhones: Array<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  days: Array<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  displaySections: Array<DisplaySection>;
  dongOrStation?: Maybe<Scalars['String']['output']>;
  durationMinutes?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  isBallet: Scalars['Boolean']['output'];
  jobType?: Maybe<Scalars['String']['output']>;
  locationSource?: Maybe<Scalars['String']['output']>;
  locationText?: Maybe<Scalars['String']['output']>;
  payMaxManwon?: Maybe<Scalars['Float']['output']>;
  payMinManwon?: Maybe<Scalars['Float']['output']>;
  payNegotiable: Scalars['Boolean']['output'];
  payText?: Maybe<Scalars['String']['output']>;
  payType?: Maybe<Scalars['String']['output']>;
  postedAt?: Maybe<Scalars['DateTime']['output']>;
  representativePay?: Maybe<RepresentativePay>;
  representativePayText?: Maybe<Scalars['String']['output']>;
  requirements?: Maybe<Scalars['JSON']['output']>;
  sido?: Maybe<Scalars['String']['output']>;
  sigungu?: Maybe<Scalars['String']['output']>;
  sourcePrimary: SourceName;
  sources: Array<JobPostSourceLink>;
  status?: Maybe<Scalars['String']['output']>;
  subjectTypes: Array<Scalars['String']['output']>;
  timeSlots: Array<Scalars['String']['output']>;
  times: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type JobPostConnection = {
  __typename?: 'JobPostConnection';
  items: Array<JobPostSummary>;
  pageInfo: PageInfo;
};

export type JobPostFilterInput = {
  jobType?: InputMaybe<Scalars['String']['input']>;
  sido?: InputMaybe<Scalars['String']['input']>;
  sigungu?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<SourceName>;
};

export type JobPostSourceLink = {
  __typename?: 'JobPostSourceLink';
  confidence?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  source: SourceName;
  sourcePost: SourcePostSummary;
  sourceUrl: Scalars['String']['output'];
};

export type JobPostSummary = {
  __typename?: 'JobPostSummary';
  academyThumbnailUrl?: Maybe<Scalars['String']['output']>;
  audienceTypes: Array<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  days: Array<Scalars['String']['output']>;
  dongOrStation?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  jobType?: Maybe<Scalars['String']['output']>;
  locationText?: Maybe<Scalars['String']['output']>;
  payMaxManwon?: Maybe<Scalars['Float']['output']>;
  payMinManwon?: Maybe<Scalars['Float']['output']>;
  payNegotiable: Scalars['Boolean']['output'];
  payText?: Maybe<Scalars['String']['output']>;
  postedAt?: Maybe<Scalars['DateTime']['output']>;
  representativePayText?: Maybe<Scalars['String']['output']>;
  sido?: Maybe<Scalars['String']['output']>;
  sigungu?: Maybe<Scalars['String']['output']>;
  sourcePrimary: SourceName;
  subjectTypes: Array<Scalars['String']['output']>;
  timeSlots: Array<Scalars['String']['output']>;
  times: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type JobRegionCount = {
  __typename?: 'JobRegionCount';
  count: Scalars['Int']['output'];
  sigungu: Scalars['String']['output'];
};

export type JobRegionGroup = {
  __typename?: 'JobRegionGroup';
  districts: Array<JobRegionCount>;
  sido: Scalars['String']['output'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type PaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};

export type Query = {
  __typename?: 'Query';
  health: Health;
  jobPost?: Maybe<JobPost>;
  jobPosts: JobPostConnection;
  jobRegions: Array<JobRegionGroup>;
  scraperRuns: Array<ScraperRun>;
  substitutePost?: Maybe<SubstitutePost>;
  substitutePosts: SubstitutePostConnection;
};


export type QueryJobPostArgs = {
  id: Scalars['ID']['input'];
};


export type QueryJobPostsArgs = {
  filter?: InputMaybe<JobPostFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryScraperRunsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySubstitutePostArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySubstitutePostsArgs = {
  filter?: InputMaybe<SubstitutePostFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
};

export type RepresentativePay = {
  __typename?: 'RepresentativePay';
  alternateEvidence?: Maybe<Scalars['String']['output']>;
  confidence: Scalars['String']['output'];
  displayText: Scalars['String']['output'];
  evidence?: Maybe<Scalars['String']['output']>;
  hasConflict: Scalars['Boolean']['output'];
  maxManwon?: Maybe<Scalars['Float']['output']>;
  minManwon?: Maybe<Scalars['Float']['output']>;
  unit: Scalars['String']['output'];
};

export type ScraperRun = {
  __typename?: 'ScraperRun';
  classified: Scalars['Int']['output'];
  collected: Scalars['Int']['output'];
  errorMessage?: Maybe<Scalars['String']['output']>;
  finishedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  imported: Scalars['Int']['output'];
  llmMode: Scalars['String']['output'];
  source?: Maybe<SourceName>;
  startedAt: Scalars['DateTime']['output'];
  status: ScraperRunStatus;
  targetDate: Scalars['String']['output'];
};

export enum ScraperRunStatus {
  Failed = 'failed',
  Running = 'running',
  Success = 'success'
}

export enum SourceName {
  Balletmania = 'balletmania',
  Esangdance = 'esangdance'
}

export type SourcePostSummary = {
  __typename?: 'SourcePostSummary';
  id: Scalars['ID']['output'];
  postedAt?: Maybe<Scalars['DateTime']['output']>;
  sourcePostId: Scalars['String']['output'];
  sourceUrl: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type SubstitutePost = {
  __typename?: 'SubstitutePost';
  academyName?: Maybe<Scalars['String']['output']>;
  applicationInstructions?: Maybe<Scalars['String']['output']>;
  audienceTypes: Array<Scalars['String']['output']>;
  author?: Maybe<Scalars['String']['output']>;
  body?: Maybe<Scalars['String']['output']>;
  classification?: Maybe<Scalars['JSON']['output']>;
  contactEmails: Array<Scalars['String']['output']>;
  contactMethods: Array<Scalars['String']['output']>;
  contactPhones: Array<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dongOrStation?: Maybe<Scalars['String']['output']>;
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  lessonDates: Array<Scalars['String']['output']>;
  locationText?: Maybe<Scalars['String']['output']>;
  nextLessonAt?: Maybe<Scalars['DateTime']['output']>;
  notes: Array<Scalars['String']['output']>;
  payText?: Maybe<Scalars['String']['output']>;
  postedAt?: Maybe<Scalars['DateTime']['output']>;
  recommendCount: Scalars['Int']['output'];
  recurrence?: Maybe<SubstituteRecurrence>;
  representativePay?: Maybe<RepresentativePay>;
  representativePayText?: Maybe<Scalars['String']['output']>;
  requirements: Array<Scalars['String']['output']>;
  scheduleKind: Scalars['String']['output'];
  sessions: Array<SubstituteSession>;
  sido?: Maybe<Scalars['String']['output']>;
  sigungu?: Maybe<Scalars['String']['output']>;
  source: SourceName;
  sourceUrl: Scalars['String']['output'];
  status: SubstitutePostStatus;
  subjectTypes: Array<Scalars['String']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
  timeSlots: Array<SubstituteTimeSlot>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  urgency?: Maybe<Scalars['String']['output']>;
  viewCount: Scalars['Int']['output'];
};

export type SubstitutePostConnection = {
  __typename?: 'SubstitutePostConnection';
  items: Array<SubstitutePostSummary>;
  pageInfo: PageInfo;
};

export type SubstitutePostFilterInput = {
  sido?: InputMaybe<Scalars['String']['input']>;
  sigungu?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<SourceName>;
  status?: InputMaybe<SubstitutePostStatus>;
};

export enum SubstitutePostStatus {
  Deleted = 'DELETED',
  Expired = 'EXPIRED',
  Open = 'OPEN'
}

export type SubstitutePostSummary = {
  __typename?: 'SubstitutePostSummary';
  academyName?: Maybe<Scalars['String']['output']>;
  audienceTypes: Array<Scalars['String']['output']>;
  author?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  dongOrStation?: Maybe<Scalars['String']['output']>;
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  lessonDates: Array<Scalars['String']['output']>;
  locationText?: Maybe<Scalars['String']['output']>;
  nextLessonAt?: Maybe<Scalars['DateTime']['output']>;
  payText?: Maybe<Scalars['String']['output']>;
  postedAt?: Maybe<Scalars['DateTime']['output']>;
  recommendCount: Scalars['Int']['output'];
  recurrence?: Maybe<SubstituteRecurrence>;
  representativePayText?: Maybe<Scalars['String']['output']>;
  scheduleKind: Scalars['String']['output'];
  sessions: Array<SubstituteSession>;
  sido?: Maybe<Scalars['String']['output']>;
  sigungu?: Maybe<Scalars['String']['output']>;
  source: SourceName;
  sourceUrl: Scalars['String']['output'];
  status: SubstitutePostStatus;
  subjectTypes: Array<Scalars['String']['output']>;
  summary?: Maybe<Scalars['String']['output']>;
  timeSlots: Array<SubstituteTimeSlot>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  urgency?: Maybe<Scalars['String']['output']>;
  viewCount: Scalars['Int']['output'];
};

export type SubstituteRecurrence = {
  __typename?: 'SubstituteRecurrence';
  audienceTypes: Array<Scalars['String']['output']>;
  confidence: Scalars['String']['output'];
  daysOfWeek: Array<Scalars['String']['output']>;
  durationMinutes?: Maybe<Scalars['Int']['output']>;
  endDate?: Maybe<Scalars['String']['output']>;
  endDateInferred: Scalars['Boolean']['output'];
  endTime?: Maybe<Scalars['String']['output']>;
  evidence?: Maybe<Scalars['String']['output']>;
  pay?: Maybe<SubstituteSessionPay>;
  startDate?: Maybe<Scalars['String']['output']>;
  startTime?: Maybe<Scalars['String']['output']>;
  subjectTypes: Array<Scalars['String']['output']>;
};

export type SubstituteSession = {
  __typename?: 'SubstituteSession';
  audienceTypes: Array<Scalars['String']['output']>;
  confidence: Scalars['String']['output'];
  date?: Maybe<Scalars['String']['output']>;
  day?: Maybe<Scalars['String']['output']>;
  durationMinutes?: Maybe<Scalars['Int']['output']>;
  endTime?: Maybe<Scalars['String']['output']>;
  evidence?: Maybe<Scalars['String']['output']>;
  origin: Scalars['String']['output'];
  pay?: Maybe<SubstituteSessionPay>;
  startTime?: Maybe<Scalars['String']['output']>;
  subjectTypes: Array<Scalars['String']['output']>;
};

export type SubstituteSessionPay = {
  __typename?: 'SubstituteSessionPay';
  confidence: Scalars['String']['output'];
  evidence?: Maybe<Scalars['String']['output']>;
  maxManwon?: Maybe<Scalars['Float']['output']>;
  minManwon?: Maybe<Scalars['Float']['output']>;
  unit: Scalars['String']['output'];
};

export type SubstituteTimeSlot = {
  __typename?: 'SubstituteTimeSlot';
  end?: Maybe<Scalars['String']['output']>;
  raw?: Maybe<Scalars['String']['output']>;
  start?: Maybe<Scalars['String']['output']>;
};

export type HealthQueryVariables = Exact<{ [key: string]: never; }>;


export type HealthQuery = { __typename?: 'Query', health: { __typename?: 'Health', ok: boolean, service: string, jobCount: number, substituteCount: number } };

export type JobPostsQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationInput>;
}>;


export type JobPostsQuery = { __typename?: 'Query', jobPosts: { __typename?: 'JobPostConnection', items: Array<{ __typename?: 'JobPostSummary', id: string, title: string, sourcePrimary: SourceName, jobType?: string | null, postedAt?: string | null, locationText?: string | null, sido?: string | null, sigungu?: string | null, dongOrStation?: string | null, audienceTypes: Array<string>, subjectTypes: Array<string>, days: Array<string>, timeSlots: Array<string>, times: Array<string>, payText?: string | null, payMinManwon?: number | null, payMaxManwon?: number | null, payNegotiable: boolean, representativePayText?: string | null, academyThumbnailUrl?: string | null, createdAt: string, updatedAt: string }>, pageInfo: { __typename?: 'PageInfo', page: number, limit: number, total: number, totalPages: number } } };

export type JobPostQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type JobPostQuery = { __typename?: 'Query', jobPost?: { __typename?: 'JobPost', id: string, title: string, description?: string | null, sourcePrimary: SourceName, status?: string | null, jobType?: string | null, postedAt?: string | null, isBallet: boolean, balletConfidence?: string | null, locationText?: string | null, sido?: string | null, sigungu?: string | null, dongOrStation?: string | null, audienceTypes: Array<string>, subjectTypes: Array<string>, days: Array<string>, timeSlots: Array<string>, times: Array<string>, classCount?: number | null, durationMinutes?: number | null, payType?: string | null, payText?: string | null, payMinManwon?: number | null, payMaxManwon?: number | null, payNegotiable: boolean, representativePayText?: string | null, locationSource?: string | null, academyLogoUrl?: string | null, contactMethods: Array<string>, contactEmails: Array<string>, contactPhones: Array<string>, requirements?: unknown | null, confidence?: unknown | null, createdAt: string, updatedAt: string, displaySections: Array<{ __typename?: 'DisplaySection', title: string, content: string }>, representativePay?: { __typename?: 'RepresentativePay', unit: string, displayText: string, minManwon?: number | null, maxManwon?: number | null, evidence?: string | null, confidence: string, hasConflict: boolean, alternateEvidence?: string | null } | null, academyGallery: Array<{ __typename?: 'AcademyGalleryImage', type: string, order: number, url: string, sourceUrl?: string | null }>, sources: Array<{ __typename?: 'JobPostSourceLink', id: string, source: SourceName, sourceUrl: string, confidence?: string | null, sourcePost: { __typename?: 'SourcePostSummary', id: string, sourcePostId: string, title: string, sourceUrl: string, postedAt?: string | null } }> } | null };

export type SubstitutePostsQueryVariables = Exact<{
  filter?: InputMaybe<SubstitutePostFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
}>;


export type SubstitutePostsQuery = { __typename?: 'Query', substitutePosts: { __typename?: 'SubstitutePostConnection', items: Array<{ __typename?: 'SubstitutePostSummary', id: string, title: string, summary?: string | null, author?: string | null, postedAt?: string | null, scheduleKind: string, lessonDates: Array<string>, locationText?: string | null, sido?: string | null, sigungu?: string | null, dongOrStation?: string | null, payText?: string | null, representativePayText?: string | null, academyName?: string | null, urgency?: string | null, status: SubstitutePostStatus, nextLessonAt?: string | null, sourceUrl: string, createdAt: string, updatedAt: string, sessions: Array<{ __typename?: 'SubstituteSession', date?: string | null, day?: string | null, startTime?: string | null, endTime?: string | null, audienceTypes: Array<string>, subjectTypes: Array<string>, origin: string }>, recurrence?: { __typename?: 'SubstituteRecurrence', startDate?: string | null, endDate?: string | null, daysOfWeek: Array<string>, startTime?: string | null, endTime?: string | null, evidence?: string | null } | null, timeSlots: Array<{ __typename?: 'SubstituteTimeSlot', start?: string | null, end?: string | null, raw?: string | null }> }>, pageInfo: { __typename?: 'PageInfo', page: number, limit: number, total: number, totalPages: number } } };

export type SubstitutePostQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SubstitutePostQuery = { __typename?: 'Query', substitutePost?: { __typename?: 'SubstitutePost', id: string, title: string, summary?: string | null, author?: string | null, postedAt?: string | null, body?: string | null, scheduleKind: string, lessonDates: Array<string>, locationText?: string | null, sido?: string | null, sigungu?: string | null, dongOrStation?: string | null, payText?: string | null, representativePayText?: string | null, academyName?: string | null, requirements: Array<string>, applicationInstructions?: string | null, notes: Array<string>, urgency?: string | null, status: SubstitutePostStatus, nextLessonAt?: string | null, expiresAt?: string | null, recommendCount: number, viewCount: number, contactMethods: Array<string>, contactEmails: Array<string>, contactPhones: Array<string>, sourceUrl: string, classification?: unknown | null, createdAt: string, updatedAt: string, sessions: Array<{ __typename?: 'SubstituteSession', date?: string | null, day?: string | null, startTime?: string | null, endTime?: string | null, durationMinutes?: number | null, audienceTypes: Array<string>, subjectTypes: Array<string>, evidence?: string | null, origin: string, pay?: { __typename?: 'SubstituteSessionPay', unit: string, minManwon?: number | null, maxManwon?: number | null, evidence?: string | null } | null }>, recurrence?: { __typename?: 'SubstituteRecurrence', startDate?: string | null, endDate?: string | null, endDateInferred: boolean, daysOfWeek: Array<string>, startTime?: string | null, endTime?: string | null, durationMinutes?: number | null, audienceTypes: Array<string>, subjectTypes: Array<string>, evidence?: string | null } | null, timeSlots: Array<{ __typename?: 'SubstituteTimeSlot', start?: string | null, end?: string | null, raw?: string | null }>, representativePay?: { __typename?: 'RepresentativePay', unit: string, displayText: string, minManwon?: number | null, maxManwon?: number | null, evidence?: string | null, confidence: string } | null } | null };


export const HealthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Health"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"health"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ok"}},{"kind":"Field","name":{"kind":"Name","value":"service"}},{"kind":"Field","name":{"kind":"Name","value":"jobCount"}},{"kind":"Field","name":{"kind":"Name","value":"substituteCount"}}]}}]}}]} as unknown as DocumentNode<HealthQuery, HealthQueryVariables>;
export const JobPostsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"JobPosts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobPosts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePrimary"}},{"kind":"Field","name":{"kind":"Name","value":"jobType"}},{"kind":"Field","name":{"kind":"Name","value":"postedAt"}},{"kind":"Field","name":{"kind":"Name","value":"locationText"}},{"kind":"Field","name":{"kind":"Name","value":"sido"}},{"kind":"Field","name":{"kind":"Name","value":"sigungu"}},{"kind":"Field","name":{"kind":"Name","value":"dongOrStation"}},{"kind":"Field","name":{"kind":"Name","value":"audienceTypes"}},{"kind":"Field","name":{"kind":"Name","value":"subjectTypes"}},{"kind":"Field","name":{"kind":"Name","value":"days"}},{"kind":"Field","name":{"kind":"Name","value":"timeSlots"}},{"kind":"Field","name":{"kind":"Name","value":"times"}},{"kind":"Field","name":{"kind":"Name","value":"payText"}},{"kind":"Field","name":{"kind":"Name","value":"payMinManwon"}},{"kind":"Field","name":{"kind":"Name","value":"payMaxManwon"}},{"kind":"Field","name":{"kind":"Name","value":"payNegotiable"}},{"kind":"Field","name":{"kind":"Name","value":"representativePayText"}},{"kind":"Field","name":{"kind":"Name","value":"academyThumbnailUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}}]}}]}}]}}]} as unknown as DocumentNode<JobPostsQuery, JobPostsQueryVariables>;
export const JobPostDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"JobPost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobPost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePrimary"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"jobType"}},{"kind":"Field","name":{"kind":"Name","value":"postedAt"}},{"kind":"Field","name":{"kind":"Name","value":"isBallet"}},{"kind":"Field","name":{"kind":"Name","value":"balletConfidence"}},{"kind":"Field","name":{"kind":"Name","value":"locationText"}},{"kind":"Field","name":{"kind":"Name","value":"sido"}},{"kind":"Field","name":{"kind":"Name","value":"sigungu"}},{"kind":"Field","name":{"kind":"Name","value":"dongOrStation"}},{"kind":"Field","name":{"kind":"Name","value":"audienceTypes"}},{"kind":"Field","name":{"kind":"Name","value":"subjectTypes"}},{"kind":"Field","name":{"kind":"Name","value":"days"}},{"kind":"Field","name":{"kind":"Name","value":"timeSlots"}},{"kind":"Field","name":{"kind":"Name","value":"times"}},{"kind":"Field","name":{"kind":"Name","value":"classCount"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"payType"}},{"kind":"Field","name":{"kind":"Name","value":"payText"}},{"kind":"Field","name":{"kind":"Name","value":"payMinManwon"}},{"kind":"Field","name":{"kind":"Name","value":"payMaxManwon"}},{"kind":"Field","name":{"kind":"Name","value":"payNegotiable"}},{"kind":"Field","name":{"kind":"Name","value":"representativePayText"}},{"kind":"Field","name":{"kind":"Name","value":"displaySections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}}]}},{"kind":"Field","name":{"kind":"Name","value":"representativePay"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"displayText"}},{"kind":"Field","name":{"kind":"Name","value":"minManwon"}},{"kind":"Field","name":{"kind":"Name","value":"maxManwon"}},{"kind":"Field","name":{"kind":"Name","value":"evidence"}},{"kind":"Field","name":{"kind":"Name","value":"confidence"}},{"kind":"Field","name":{"kind":"Name","value":"hasConflict"}},{"kind":"Field","name":{"kind":"Name","value":"alternateEvidence"}}]}},{"kind":"Field","name":{"kind":"Name","value":"locationSource"}},{"kind":"Field","name":{"kind":"Name","value":"academyLogoUrl"}},{"kind":"Field","name":{"kind":"Name","value":"academyGallery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"sourceUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"contactMethods"}},{"kind":"Field","name":{"kind":"Name","value":"contactEmails"}},{"kind":"Field","name":{"kind":"Name","value":"contactPhones"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"confidence"}},{"kind":"Field","name":{"kind":"Name","value":"sources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"sourceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"confidence"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePost"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePostId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"sourceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"postedAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<JobPostQuery, JobPostQueryVariables>;
export const SubstitutePostsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SubstitutePosts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SubstitutePostFilterInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"substitutePosts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"postedAt"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleKind"}},{"kind":"Field","name":{"kind":"Name","value":"sessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"audienceTypes"}},{"kind":"Field","name":{"kind":"Name","value":"subjectTypes"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}}]}},{"kind":"Field","name":{"kind":"Name","value":"recurrence"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"daysOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"evidence"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lessonDates"}},{"kind":"Field","name":{"kind":"Name","value":"timeSlots"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"start"}},{"kind":"Field","name":{"kind":"Name","value":"end"}},{"kind":"Field","name":{"kind":"Name","value":"raw"}}]}},{"kind":"Field","name":{"kind":"Name","value":"locationText"}},{"kind":"Field","name":{"kind":"Name","value":"sido"}},{"kind":"Field","name":{"kind":"Name","value":"sigungu"}},{"kind":"Field","name":{"kind":"Name","value":"dongOrStation"}},{"kind":"Field","name":{"kind":"Name","value":"payText"}},{"kind":"Field","name":{"kind":"Name","value":"representativePayText"}},{"kind":"Field","name":{"kind":"Name","value":"academyName"}},{"kind":"Field","name":{"kind":"Name","value":"urgency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"nextLessonAt"}},{"kind":"Field","name":{"kind":"Name","value":"sourceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}}]}}]}}]}}]} as unknown as DocumentNode<SubstitutePostsQuery, SubstitutePostsQueryVariables>;
export const SubstitutePostDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SubstitutePost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"substitutePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"author"}},{"kind":"Field","name":{"kind":"Name","value":"postedAt"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleKind"}},{"kind":"Field","name":{"kind":"Name","value":"sessions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"audienceTypes"}},{"kind":"Field","name":{"kind":"Name","value":"subjectTypes"}},{"kind":"Field","name":{"kind":"Name","value":"pay"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"minManwon"}},{"kind":"Field","name":{"kind":"Name","value":"maxManwon"}},{"kind":"Field","name":{"kind":"Name","value":"evidence"}}]}},{"kind":"Field","name":{"kind":"Name","value":"evidence"}},{"kind":"Field","name":{"kind":"Name","value":"origin"}}]}},{"kind":"Field","name":{"kind":"Name","value":"recurrence"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDateInferred"}},{"kind":"Field","name":{"kind":"Name","value":"daysOfWeek"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"durationMinutes"}},{"kind":"Field","name":{"kind":"Name","value":"audienceTypes"}},{"kind":"Field","name":{"kind":"Name","value":"subjectTypes"}},{"kind":"Field","name":{"kind":"Name","value":"evidence"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lessonDates"}},{"kind":"Field","name":{"kind":"Name","value":"timeSlots"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"start"}},{"kind":"Field","name":{"kind":"Name","value":"end"}},{"kind":"Field","name":{"kind":"Name","value":"raw"}}]}},{"kind":"Field","name":{"kind":"Name","value":"locationText"}},{"kind":"Field","name":{"kind":"Name","value":"sido"}},{"kind":"Field","name":{"kind":"Name","value":"sigungu"}},{"kind":"Field","name":{"kind":"Name","value":"dongOrStation"}},{"kind":"Field","name":{"kind":"Name","value":"payText"}},{"kind":"Field","name":{"kind":"Name","value":"representativePay"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"displayText"}},{"kind":"Field","name":{"kind":"Name","value":"minManwon"}},{"kind":"Field","name":{"kind":"Name","value":"maxManwon"}},{"kind":"Field","name":{"kind":"Name","value":"evidence"}},{"kind":"Field","name":{"kind":"Name","value":"confidence"}}]}},{"kind":"Field","name":{"kind":"Name","value":"representativePayText"}},{"kind":"Field","name":{"kind":"Name","value":"academyName"}},{"kind":"Field","name":{"kind":"Name","value":"requirements"}},{"kind":"Field","name":{"kind":"Name","value":"applicationInstructions"}},{"kind":"Field","name":{"kind":"Name","value":"notes"}},{"kind":"Field","name":{"kind":"Name","value":"urgency"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"nextLessonAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"recommendCount"}},{"kind":"Field","name":{"kind":"Name","value":"viewCount"}},{"kind":"Field","name":{"kind":"Name","value":"contactMethods"}},{"kind":"Field","name":{"kind":"Name","value":"contactEmails"}},{"kind":"Field","name":{"kind":"Name","value":"contactPhones"}},{"kind":"Field","name":{"kind":"Name","value":"sourceUrl"}},{"kind":"Field","name":{"kind":"Name","value":"classification"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<SubstitutePostQuery, SubstitutePostQueryVariables>;