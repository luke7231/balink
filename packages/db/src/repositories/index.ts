import type {
  JobPostFilterInput,
  OrganizationCandidate,
  OrganizationExisting,
  SourceName,
} from "@balink/domain";
import {
  buildRegionFilterClauses,
  decideOrganizationMatch,
  jsonArray,
  mergeOrganizationFields,
  normalizePhone,
} from "@balink/domain";
import type { Organization, Prisma } from "@prisma/client";
import { prisma } from "../client.js";
import {
  toJobPostDetail,
  toJobPostSourceLink,
  toJobPostSummary,
  toOrganizationDetail,
  toOrganizationSummary,
  toScraperRunSummary,
  toSubstitutePostDetail,
  toSubstitutePostSummary,
} from "../mappers/index.js";

const sourcePostSelect = {
  id: true,
  sourcePostId: true,
  sourceUrl: true,
  title: true,
  postedAt: true,
} as const;

function splitFilterValues(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function regionWhere(sidos: string[], sigungus: string[]): { sido?: string; sigungu?: string } | { OR: Array<{ sido?: string; sigungu?: string }> } | Record<string, never> {
  const clauses = buildRegionFilterClauses(sidos, sigungus).map((clause) => ({
    ...(clause.sido ? { sido: clause.sido } : {}),
    ...(clause.sigungu ? { sigungu: clause.sigungu } : {}),
  }));
  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0]!;
  return { OR: clauses };
}

export class JobPostRepository {
  buildWhere(filter: JobPostFilterInput | null | undefined): Prisma.JobPostWhereInput {
    const sidos = splitFilterValues(filter?.sido);
    const sigungus = splitFilterValues(filter?.sigungu);

    return {
      isBallet: true,
      jobType: { not: "substitute" },
      ...regionWhere(sidos, sigungus),
      ...(filter?.jobType ? { jobType: filter.jobType } : {}),
      ...(filter?.source ? { sourcePrimary: filter.source } : {}),
    };
  }

  async findMany(
    where: Prisma.JobPostWhereInput,
    skip: number,
    take: number,
    sort: import("@balink/domain").JobPostSort = "LATEST",
  ) {
    const orderBy: Prisma.JobPostOrderByWithRelationInput[] =
      sort === "PAY_HIGH"
        ? [
            { payMaxManwon: { sort: "desc", nulls: "last" } },
            { postedAt: "desc" },
            { createdAt: "desc" },
          ]
        : [{ postedAt: "desc" }, { createdAt: "desc" }];

    const items = await prisma.jobPost.findMany({
      where,
      orderBy,
      skip,
      take,
    });
    return items.map(toJobPostSummary);
  }

  async count(where: Prisma.JobPostWhereInput) {
    return prisma.jobPost.count({ where });
  }

  async findById(id: string) {
    const job = await prisma.jobPost.findUnique({
      where: { id },
      include: {
        organization: true,
        jobPostSources: {
          include: { sourcePost: { select: sourcePostSelect } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return job ? toJobPostDetail(job) : null;
  }

  async findSources(jobPostId: string) {
    const links = await prisma.jobPostSource.findMany({
      where: { jobPostId },
      include: { sourcePost: { select: sourcePostSelect } },
      orderBy: { createdAt: "asc" },
    });
    return links.map(toJobPostSourceLink);
  }

  async groupRegions() {
    return prisma.jobPost.groupBy({
      by: ["sido", "sigungu"],
      where: {
        isBallet: true,
        jobType: { not: "substitute" },
        sido: { not: null },
        sigungu: { not: null },
      },
      _count: { _all: true },
      orderBy: [{ sido: "asc" }, { sigungu: "asc" }],
    });
  }

  async countBalletPosts() {
    return prisma.jobPost.count({
      where: { isBallet: true, jobType: { not: "substitute" } },
    });
  }
}

export interface ImportClassifiedItemInput {
  source: SourceName;
  sourcePostId: string;
  url: string;
  collectedAt: string;
  raw: Record<string, unknown>;
  classification: Record<string, unknown>;
  organizationCandidate?: OrganizationCandidate | null;
  normalized: {
    title: string;
    postedAt: Date | null;
    contentHash: string;
    sourceConfidence: string | null;
    jobPostData: Prisma.JobPostUncheckedCreateInput;
  };
}

type DbClient = Prisma.TransactionClient | typeof prisma;

function toOrganizationExisting(org: Organization): OrganizationExisting {
  return {
    id: org.id,
    name: org.name,
    normalizedName: org.normalizedName,
    type: org.type as OrganizationExisting["type"],
    matchKey: org.matchKey,
    sido: org.sido,
    sigungu: org.sigungu,
    dongOrStation: org.dongOrStation,
    phones: jsonArray(org.phonesJson),
    emails: jsonArray(org.emailsJson),
    logoUrl: org.logoUrl,
    gallery: Array.isArray(org.galleryJson)
      ? (org.galleryJson as unknown as OrganizationExisting["gallery"])
      : [],
    externalProfileUrl: org.externalProfileUrl,
  };
}

async function findOrganizationMatchCandidates(
  tx: DbClient,
  candidate: OrganizationCandidate,
): Promise<OrganizationExisting[]> {
  const phoneFilters = candidate.phones
    .map(normalizePhone)
    .filter((phone) => phone.length >= 8)
    .map((phone) => ({ phonesJson: { array_contains: phone } }));

  const rows = await tx.organization.findMany({
    where: {
      OR: [
        { matchKey: candidate.matchKey },
        ...(candidate.externalProfileUrl
          ? [{ externalProfileUrl: candidate.externalProfileUrl }]
          : []),
        { normalizedName: candidate.normalizedName },
        ...phoneFilters,
      ],
    },
    take: 50,
  });

  return rows.map(toOrganizationExisting);
}

async function resolveOrganizationForImport(
  tx: DbClient,
  candidate: OrganizationCandidate | null | undefined,
  existingOrganizationId: string | null,
): Promise<string | null> {
  // 재수집 시 기존 연결을 유지하고 누락 필드만 보강한다.
  if (existingOrganizationId) {
    if (candidate) {
      const existing = await tx.organization.findUnique({ where: { id: existingOrganizationId } });
      if (existing) {
        const merged = mergeOrganizationFields(toOrganizationExisting(existing), candidate);
        await tx.organization.update({
          where: { id: existing.id },
          data: {
            type: merged.type,
            sido: merged.sido,
            sigungu: merged.sigungu,
            dongOrStation: merged.dongOrStation,
            phonesJson: (merged.phones ?? []) as unknown as Prisma.InputJsonValue,
            emailsJson: (merged.emails ?? []) as unknown as Prisma.InputJsonValue,
            logoUrl: merged.logoUrl,
            galleryJson: (merged.gallery ?? []) as unknown as Prisma.InputJsonValue,
            externalProfileUrl: merged.externalProfileUrl,
          },
        });
      }
    }
    return existingOrganizationId;
  }

  if (!candidate) return null;

  const existing = await findOrganizationMatchCandidates(tx, candidate);
  const decision = decideOrganizationMatch(candidate, existing);

  if (decision.kind === "ambiguous" || decision.kind === "skip") {
    return null;
  }

  if (decision.kind === "reuse") {
    const org = await tx.organization.findUnique({ where: { id: decision.organizationId } });
    if (!org) return null;
    const merged = mergeOrganizationFields(toOrganizationExisting(org), candidate);
    await tx.organization.update({
      where: { id: org.id },
      data: {
        type: merged.type,
        sido: merged.sido,
        sigungu: merged.sigungu,
        dongOrStation: merged.dongOrStation,
        phonesJson: (merged.phones ?? []) as unknown as Prisma.InputJsonValue,
        emailsJson: (merged.emails ?? []) as unknown as Prisma.InputJsonValue,
        logoUrl: merged.logoUrl,
        galleryJson: (merged.gallery ?? []) as unknown as Prisma.InputJsonValue,
        externalProfileUrl: merged.externalProfileUrl,
      },
    });
    return org.id;
  }

  try {
    const created = await tx.organization.create({
      data: {
        name: candidate.name,
        normalizedName: candidate.normalizedName,
        type: candidate.type,
        matchKey: candidate.matchKey,
        sido: candidate.sido,
        sigungu: candidate.sigungu,
        dongOrStation: candidate.dongOrStation,
        phonesJson: candidate.phones as unknown as Prisma.InputJsonValue,
        emailsJson: candidate.emails as unknown as Prisma.InputJsonValue,
        logoUrl: candidate.logoUrl,
        galleryJson: candidate.gallery as unknown as Prisma.InputJsonValue,
        externalProfileUrl: candidate.externalProfileUrl,
      },
    });
    return created.id;
  } catch {
    // 동시 생성으로 matchKey 충돌 시 기존 조직 재사용
    const raced = await tx.organization.findUnique({ where: { matchKey: candidate.matchKey } });
    return raced?.id ?? null;
  }
}

export class OrganizationRepository {
  async findById(id: string, jobLimit = 50) {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        jobPosts: {
          where: { isBallet: true },
          orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
          take: jobLimit,
        },
      },
    });
    if (!org) return null;
    const jobPostCount = await prisma.jobPost.count({
      where: { organizationId: id, isBallet: true },
    });
    return {
      ...toOrganizationDetail(org),
      jobPostCount,
    };
  }

  async findSummaryById(id: string) {
    const org = await prisma.organization.findUnique({ where: { id } });
    return org ? toOrganizationSummary(org) : null;
  }
}

export class SourcePostRepository {
  async findExistingSourcePostIds(source: SourceName, sourcePostIds: string[]): Promise<Set<string>> {
    if (sourcePostIds.length === 0) return new Set();

    const rows = await prisma.sourcePost.findMany({
      where: {
        source,
        sourcePostId: { in: sourcePostIds },
      },
      select: { sourcePostId: true },
    });

    return new Set(rows.map((row) => row.sourcePostId));
  }

  async importClassifiedItem(input: ImportClassifiedItemInput) {
    return prisma.$transaction(async (tx) => {
      const sourcePost = await tx.sourcePost.upsert({
        where: {
          source_sourcePostId: {
            source: input.source,
            sourcePostId: input.sourcePostId,
          },
        },
        update: {
          sourceUrl: input.url,
          title: input.normalized.title,
          postedAt: input.normalized.postedAt,
          rawJson: input.raw as Prisma.InputJsonValue,
          classificationJson: input.classification as Prisma.InputJsonValue,
          contentHash: input.normalized.contentHash,
          fetchedAt: new Date(input.collectedAt),
        },
        create: {
          source: input.source,
          sourcePostId: input.sourcePostId,
          sourceUrl: input.url,
          title: input.normalized.title,
          postedAt: input.normalized.postedAt,
          rawJson: input.raw as Prisma.InputJsonValue,
          classificationJson: input.classification as Prisma.InputJsonValue,
          contentHash: input.normalized.contentHash,
          fetchedAt: new Date(input.collectedAt),
        },
      });

      const existingLink = await tx.jobPostSource.findFirst({
        where: { sourcePostId: sourcePost.id },
        select: { jobPostId: true, jobPost: { select: { organizationId: true } } },
      });

      const organizationId = await resolveOrganizationForImport(
        tx,
        input.organizationCandidate,
        existingLink?.jobPost.organizationId ?? null,
      );

      const jobPostData = {
        ...input.normalized.jobPostData,
        ...(organizationId ? { organizationId } : {}),
      };

      const jobPost = existingLink
        ? await tx.jobPost.update({
            where: { id: existingLink.jobPostId },
            data: jobPostData,
          })
        : await tx.jobPost.create({
            data: jobPostData,
          });

      await tx.jobPostSource.upsert({
        where: {
          jobPostId_sourcePostId: {
            jobPostId: jobPost.id,
            sourcePostId: sourcePost.id,
          },
        },
        update: {
          sourceUrl: input.url,
          confidence: input.normalized.sourceConfidence,
        },
        create: {
          jobPostId: jobPost.id,
          sourcePostId: sourcePost.id,
          source: input.source,
          sourceUrl: input.url,
          confidence: input.normalized.sourceConfidence,
        },
      });

      // source 키(link) 기준 신규 — 같은 내용·다른 URL이면 새 JobPost + created:true 가능
      return {
        sourcePostId: sourcePost.id,
        jobPostId: jobPost.id,
        jobPost,
        organizationId,
        created: !existingLink,
      };
    });
  }

  /**
   * 채용 보드 대강 라우팅용: SourcePost만 upsert하고, 이미 연결된 JobPost가 있으면 삭제.
   * (incremental filter가 SourcePost id를 보기 때문에 SourcePost는 반드시 남겨 둔다.)
   */
  async upsertSourcePostWithoutJob(input: {
    source: SourceName;
    sourcePostId: string;
    url: string;
    title: string;
    postedAt: Date | null;
    collectedAt: string;
    raw: Record<string, unknown>;
    classification: Record<string, unknown>;
    contentHash: string;
    sourceConfidence: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const sourcePost = await tx.sourcePost.upsert({
        where: {
          source_sourcePostId: {
            source: input.source,
            sourcePostId: input.sourcePostId,
          },
        },
        update: {
          sourceUrl: input.url,
          title: input.title,
          postedAt: input.postedAt,
          rawJson: input.raw as Prisma.InputJsonValue,
          classificationJson: input.classification as Prisma.InputJsonValue,
          contentHash: input.contentHash,
          fetchedAt: new Date(input.collectedAt),
        },
        create: {
          source: input.source,
          sourcePostId: input.sourcePostId,
          sourceUrl: input.url,
          title: input.title,
          postedAt: input.postedAt,
          rawJson: input.raw as Prisma.InputJsonValue,
          classificationJson: input.classification as Prisma.InputJsonValue,
          contentHash: input.contentHash,
          fetchedAt: new Date(input.collectedAt),
        },
      });

      const existingLinks = await tx.jobPostSource.findMany({
        where: { sourcePostId: sourcePost.id },
        select: { jobPostId: true },
      });
      const jobPostIds = [...new Set(existingLinks.map((link) => link.jobPostId))];
      if (jobPostIds.length > 0) {
        await tx.jobPost.deleteMany({ where: { id: { in: jobPostIds } } });
      }

      return { sourcePostId: sourcePost.id, deletedJobPostIds: jobPostIds };
    });
  }
}

export class ScraperRunRepository {
  async createRunning(input: { source?: SourceName; targetDate: string; llmMode: string }) {
    return prisma.scraperRun.create({
      data: {
        source: input.source ?? null,
        targetDate: input.targetDate,
        llmMode: input.llmMode,
        status: "running",
      },
    });
  }

  async markSuccess(
    id: string,
    data: { collected: number; classified: number; imported: number; logs: Prisma.InputJsonValue },
  ) {
    return prisma.scraperRun.update({
      where: { id },
      data: {
        status: "success",
        finishedAt: new Date(),
        collected: data.collected,
        classified: data.classified,
        imported: data.imported,
        logs: data.logs,
      },
    });
  }

  async markFailed(
    id: string,
    data: {
      collected: number;
      classified: number;
      imported: number;
      errorMessage: string;
      logs: Prisma.InputJsonValue;
    },
  ) {
    return prisma.scraperRun.update({
      where: { id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        collected: data.collected,
        classified: data.classified,
        imported: data.imported,
        errorMessage: data.errorMessage,
        logs: data.logs,
      },
    });
  }

  async listRecent(limit: number) {
    const runs = await prisma.scraperRun.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
    });
    return runs.map((run) => toScraperRunSummary(run));
  }

  async findLatest() {
    const run = await prisma.scraperRun.findFirst({
      orderBy: { startedAt: "desc" },
    });
    return run ? toScraperRunSummary(run) : null;
  }
}

export class DatabaseHealthRepository {
  async ping() {
    await prisma.$queryRaw`SELECT 1`;
  }
}

export interface UpsertSubstitutePostInput {
  source: SourceName;
  sourcePostId: string;
  sourceUrl: string;
  title: string;
  summary: string | null;
  body: string | null;
  author: string | null;
  authorMemberNo: string | null;
  postedAt: Date | null;
  sessions: import("@balink/domain").SubstituteSession[];
  recurrence: import("@balink/domain").SubstituteRecurrence | null;
  scheduleKind: import("@balink/domain").SubstituteScheduleKind;
  lessonDates: string[];
  timeSlots: Array<{ start: string | null; end: string | null; raw: string | null }>;
  audienceTypes: string[];
  subjectTypes: string[];
  locationText: string | null;
  sido: string | null;
  sigungu: string | null;
  dongOrStation: string | null;
  payText: string | null;
  representativePay: import("@balink/domain").RepresentativePay | null;
  representativePayText: string | null;
  academyName: string | null;
  requirements: string[];
  applicationInstructions: string | null;
  notes: string[];
  contactMethods: string[];
  contactEmails: string[];
  contactPhones: string[];
  urgency: string | null;
  status: "OPEN" | "EXPIRED" | "DELETED";
  nextLessonAt: Date | null;
  expiresAt: Date | null;
  recommendCount: number;
  viewCount: number;
  raw: Record<string, unknown>;
  classification: Record<string, unknown>;
  contentHash: string;
  normalizationVersion: number;
  normalizedAt: Date;
  lastSeenAt: Date;
}

export class SubstitutePostRepository {
  buildWhere(filter: import("@balink/domain").SubstitutePostFilterInput | null | undefined): Prisma.SubstitutePostWhereInput {
    const sidos = splitFilterValues(filter?.sido);
    const sigungus = splitFilterValues(filter?.sigungu);

    return {
      ...(filter?.status ? { status: filter.status } : { status: "OPEN" }),
      ...regionWhere(sidos, sigungus),
      ...(filter?.source ? { source: filter.source } : {}),
    };
  }

  async findMany(
    where: Prisma.SubstitutePostWhereInput,
    skip: number,
    take: number,
    sort: import("@balink/domain").SubstitutePostSort = "LATEST",
  ) {
    const orderBy: Prisma.SubstitutePostOrderByWithRelationInput[] =
      sort === "SOON"
        ? [
            { nextLessonAt: { sort: "asc", nulls: "last" } },
            { postedAt: "desc" },
            { createdAt: "desc" },
          ]
        : [{ postedAt: "desc" }, { createdAt: "desc" }];

    const items = await prisma.substitutePost.findMany({
      where,
      orderBy,
      skip,
      take,
    });
    return items.map((item) => toSubstitutePostSummary(item));
  }

  async count(where: Prisma.SubstitutePostWhereInput) {
    return prisma.substitutePost.count({ where });
  }

  async findById(id: string) {
    const post = await prisma.substitutePost.findUnique({ where: { id } });
    return post ? toSubstitutePostDetail(post) : null;
  }

  async findBySourcePostIds(source: SourceName, sourcePostIds: string[]) {
    if (sourcePostIds.length === 0) return [];

    return prisma.substitutePost.findMany({
      where: { source, sourcePostId: { in: sourcePostIds } },
      select: {
        id: true,
        sourcePostId: true,
        contentHash: true,
        normalizationVersion: true,
        status: true,
        lastDeletionCheckAt: true,
        nextLessonAt: true,
      },
    });
  }

  async findBySourceUrl(sourceUrl: string) {
    return prisma.substitutePost.findFirst({
      where: { sourceUrl },
      select: {
        id: true,
        source: true,
        sourcePostId: true,
        sourceUrl: true,
      },
    });
  }

  async findOpenPostsNeedingLifecycleCheck(limit = 50) {
    const now = new Date();
    const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    return prisma.substitutePost.findMany({
      where: {
        status: "OPEN",
        OR: [{ nextLessonAt: { lte: soon } }, { expiresAt: { lte: now } }],
      },
      orderBy: [{ nextLessonAt: "asc" }, { expiresAt: "asc" }],
      take: limit,
      select: {
        id: true,
        source: true,
        sourcePostId: true,
        sourceUrl: true,
        expiresAt: true,
        nextLessonAt: true,
        lastDeletionCheckAt: true,
      },
    });
  }

  async touchLastSeenAt(source: SourceName, sourcePostId: string, lastSeenAt: Date) {
    return prisma.substitutePost.update({
      where: {
        source_sourcePostId: {
          source,
          sourcePostId,
        },
      },
      data: { lastSeenAt },
    });
  }

  async markDeletionChecked(id: string, checkedAt: Date) {
    return prisma.substitutePost.update({
      where: { id },
      data: { lastDeletionCheckAt: checkedAt },
    });
  }

  async upsert(input: UpsertSubstitutePostInput) {
    const data = {
      sourceUrl: input.sourceUrl,
      title: input.title,
      summary: input.summary,
      body: input.body,
      author: input.author,
      authorMemberNo: input.authorMemberNo,
      postedAt: input.postedAt,
      sessionsJson: input.sessions as unknown as Prisma.InputJsonValue,
      recurrenceJson: (input.recurrence as unknown as Prisma.InputJsonValue) ?? null,
      scheduleKind: input.scheduleKind,
      lessonDatesJson: input.lessonDates as unknown as Prisma.InputJsonValue,
      timeSlotsJson: input.timeSlots as unknown as Prisma.InputJsonValue,
      audienceTypes: input.audienceTypes as unknown as Prisma.InputJsonValue,
      subjectTypes: input.subjectTypes as unknown as Prisma.InputJsonValue,
      locationText: input.locationText,
      sido: input.sido,
      sigungu: input.sigungu,
      dongOrStation: input.dongOrStation,
      payText: input.payText,
      representativePayJson: (input.representativePay as unknown as Prisma.InputJsonValue) ?? null,
      representativePayText: input.representativePayText,
      academyName: input.academyName,
      requirementsJson: input.requirements as unknown as Prisma.InputJsonValue,
      applicationInstructions: input.applicationInstructions,
      notesJson: input.notes as unknown as Prisma.InputJsonValue,
      contactMethodsJson: input.contactMethods as unknown as Prisma.InputJsonValue,
      contactEmailsJson: input.contactEmails as unknown as Prisma.InputJsonValue,
      contactPhonesJson: input.contactPhones as unknown as Prisma.InputJsonValue,
      urgency: input.urgency,
      status: input.status,
      nextLessonAt: input.nextLessonAt,
      expiresAt: input.expiresAt,
      recommendCount: input.recommendCount,
      viewCount: input.viewCount,
      rawJson: input.raw as unknown as Prisma.InputJsonValue,
      classificationJson: input.classification as unknown as Prisma.InputJsonValue,
      contentHash: input.contentHash,
      normalizationVersion: input.normalizationVersion,
      normalizedAt: input.normalizedAt,
      lastSeenAt: input.lastSeenAt,
    };

    const existing = await prisma.substitutePost.findUnique({
      where: {
        source_sourcePostId: {
          source: input.source,
          sourcePostId: input.sourcePostId,
        },
      },
      select: { id: true },
    });

    const post = await prisma.substitutePost.upsert({
      where: {
        source_sourcePostId: {
          source: input.source,
          sourcePostId: input.sourcePostId,
        },
      },
      update: data,
      create: {
        source: input.source,
        sourcePostId: input.sourcePostId,
        ...data,
      },
    });

    return { post, created: !existing };
  }

  async updateStatus(id: string, status: "OPEN" | "EXPIRED" | "DELETED") {
    return prisma.substitutePost.update({
      where: { id },
      data: { status },
    });
  }

  async updateStatusBySourcePost(
    source: SourceName,
    sourcePostId: string,
    status: "OPEN" | "EXPIRED" | "DELETED",
  ) {
    return prisma.substitutePost.update({
      where: {
        source_sourcePostId: {
          source,
          sourcePostId,
        },
      },
      data: { status },
    });
  }

  async countOpenPosts() {
    return prisma.substitutePost.count({ where: { status: "OPEN" } });
  }
}

export type MatchNotificationInsert = {
  userId: string;
  type: "job_match" | "substitute_match";
  title: string;
  body: string;
  href: string;
  jobPostId?: string | null;
  substitutePostId?: string | null;
  createdAt?: Date;
};

export class UserNotificationRepository {
  async createManyForMatch(rows: MatchNotificationInsert[]) {
    if (rows.length === 0) return { count: 0, notifications: [] };
    const result = await prisma.userNotification.createMany({
      data: rows.map((row) => ({
        userId: row.userId,
        type: row.type,
        title: row.title,
        body: row.body,
        href: row.href,
        jobPostId: row.jobPostId ?? null,
        substitutePostId: row.substitutePostId ?? null,
        ...(row.createdAt ? { createdAt: row.createdAt } : {}),
      })),
      skipDuplicates: true,
    });
    const notifications = await prisma.userNotification.findMany({
      where: {
        OR: rows.map((row) => ({
          userId: row.userId,
          ...(row.jobPostId
            ? { jobPostId: row.jobPostId }
            : { substitutePostId: row.substitutePostId }),
        })),
      },
    });
    return { count: result.count, notifications };
  }
}
