import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { GraphQLContext } from '../../context/types.js';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: Date; output: Date; }
  JSON: { input: unknown; output: unknown; }
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
};

export type JobPost = {
  __typename?: 'JobPost';
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



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  DisplaySection: ResolverTypeWrapper<DisplaySection>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Health: ResolverTypeWrapper<Health>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  JobPost: ResolverTypeWrapper<JobPost>;
  JobPostConnection: ResolverTypeWrapper<JobPostConnection>;
  JobPostFilterInput: JobPostFilterInput;
  JobPostSourceLink: ResolverTypeWrapper<JobPostSourceLink>;
  JobPostSummary: ResolverTypeWrapper<JobPostSummary>;
  JobRegionCount: ResolverTypeWrapper<JobRegionCount>;
  JobRegionGroup: ResolverTypeWrapper<JobRegionGroup>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  PaginationInput: PaginationInput;
  Query: ResolverTypeWrapper<{}>;
  RepresentativePay: ResolverTypeWrapper<RepresentativePay>;
  ScraperRun: ResolverTypeWrapper<ScraperRun>;
  ScraperRunStatus: ScraperRunStatus;
  SourceName: SourceName;
  SourcePostSummary: ResolverTypeWrapper<SourcePostSummary>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  DateTime: Scalars['DateTime']['output'];
  DisplaySection: DisplaySection;
  Float: Scalars['Float']['output'];
  Health: Health;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  JobPost: JobPost;
  JobPostConnection: JobPostConnection;
  JobPostFilterInput: JobPostFilterInput;
  JobPostSourceLink: JobPostSourceLink;
  JobPostSummary: JobPostSummary;
  JobRegionCount: JobRegionCount;
  JobRegionGroup: JobRegionGroup;
  PageInfo: PageInfo;
  PaginationInput: PaginationInput;
  Query: {};
  RepresentativePay: RepresentativePay;
  ScraperRun: ScraperRun;
  SourcePostSummary: SourcePostSummary;
  String: Scalars['String']['output'];
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DisplaySectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DisplaySection'] = ResolversParentTypes['DisplaySection']> = {
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type HealthResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Health'] = ResolversParentTypes['Health']> = {
  jobCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  latestScraperRun?: Resolver<Maybe<ResolversTypes['ScraperRun']>, ParentType, ContextType>;
  ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  service?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type JobPostResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['JobPost'] = ResolversParentTypes['JobPost']> = {
  audienceTypes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  balletConfidence?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  classCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  confidence?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  contactEmails?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  contactMethods?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  contactPhones?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  days?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  displaySections?: Resolver<Array<ResolversTypes['DisplaySection']>, ParentType, ContextType>;
  dongOrStation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  durationMinutes?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isBallet?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  jobType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  locationSource?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  locationText?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  payMaxManwon?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  payMinManwon?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  payNegotiable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  payText?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  payType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  postedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  representativePay?: Resolver<Maybe<ResolversTypes['RepresentativePay']>, ParentType, ContextType>;
  representativePayText?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  requirements?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  sido?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sigungu?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sourcePrimary?: Resolver<ResolversTypes['SourceName'], ParentType, ContextType>;
  sources?: Resolver<Array<ResolversTypes['JobPostSourceLink']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  subjectTypes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  timeSlots?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  times?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type JobPostConnectionResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['JobPostConnection'] = ResolversParentTypes['JobPostConnection']> = {
  items?: Resolver<Array<ResolversTypes['JobPostSummary']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type JobPostSourceLinkResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['JobPostSourceLink'] = ResolversParentTypes['JobPostSourceLink']> = {
  confidence?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  source?: Resolver<ResolversTypes['SourceName'], ParentType, ContextType>;
  sourcePost?: Resolver<ResolversTypes['SourcePostSummary'], ParentType, ContextType>;
  sourceUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type JobPostSummaryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['JobPostSummary'] = ResolversParentTypes['JobPostSummary']> = {
  audienceTypes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  days?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  dongOrStation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  jobType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  locationText?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  payMaxManwon?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  payMinManwon?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  payNegotiable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  payText?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  postedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  representativePayText?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sido?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sigungu?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sourcePrimary?: Resolver<ResolversTypes['SourceName'], ParentType, ContextType>;
  subjectTypes?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  timeSlots?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  times?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type JobRegionCountResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['JobRegionCount'] = ResolversParentTypes['JobRegionCount']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sigungu?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type JobRegionGroupResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['JobRegionGroup'] = ResolversParentTypes['JobRegionGroup']> = {
  districts?: Resolver<Array<ResolversTypes['JobRegionCount']>, ParentType, ContextType>;
  sido?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PageInfoResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = {
  limit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalPages?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  health?: Resolver<ResolversTypes['Health'], ParentType, ContextType>;
  jobPost?: Resolver<Maybe<ResolversTypes['JobPost']>, ParentType, ContextType, RequireFields<QueryJobPostArgs, 'id'>>;
  jobPosts?: Resolver<ResolversTypes['JobPostConnection'], ParentType, ContextType, Partial<QueryJobPostsArgs>>;
  jobRegions?: Resolver<Array<ResolversTypes['JobRegionGroup']>, ParentType, ContextType>;
  scraperRuns?: Resolver<Array<ResolversTypes['ScraperRun']>, ParentType, ContextType, RequireFields<QueryScraperRunsArgs, 'limit'>>;
};

export type RepresentativePayResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['RepresentativePay'] = ResolversParentTypes['RepresentativePay']> = {
  alternateEvidence?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  confidence?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  displayText?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  evidence?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasConflict?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  maxManwon?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  minManwon?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  unit?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ScraperRunResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['ScraperRun'] = ResolversParentTypes['ScraperRun']> = {
  classified?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  collected?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  errorMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  finishedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  imported?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  llmMode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  source?: Resolver<Maybe<ResolversTypes['SourceName']>, ParentType, ContextType>;
  startedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ScraperRunStatus'], ParentType, ContextType>;
  targetDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SourcePostSummaryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['SourcePostSummary'] = ResolversParentTypes['SourcePostSummary']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  postedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  sourcePostId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sourceUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = GraphQLContext> = {
  DateTime?: GraphQLScalarType;
  DisplaySection?: DisplaySectionResolvers<ContextType>;
  Health?: HealthResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  JobPost?: JobPostResolvers<ContextType>;
  JobPostConnection?: JobPostConnectionResolvers<ContextType>;
  JobPostSourceLink?: JobPostSourceLinkResolvers<ContextType>;
  JobPostSummary?: JobPostSummaryResolvers<ContextType>;
  JobRegionCount?: JobRegionCountResolvers<ContextType>;
  JobRegionGroup?: JobRegionGroupResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RepresentativePay?: RepresentativePayResolvers<ContextType>;
  ScraperRun?: ScraperRunResolvers<ContextType>;
  SourcePostSummary?: SourcePostSummaryResolvers<ContextType>;
};

