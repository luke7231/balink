import { pathToFileURL } from "node:url";
import { prisma, type Prisma } from "@balink/db";
import {
  decideOrganizationMatch,
  jsonArray,
  mergeOrganizationFields,
  type OrganizationCandidate,
  type OrganizationExisting,
} from "@balink/domain";
import { buildOrganizationCandidate } from "./organization-matching.js";

export interface BackfillOrganizationsOptions {
  dryRun?: boolean;
  limit?: number;
  offset?: number;
  ids?: string[];
}

export interface BackfillOrganizationsSummary {
  targeted: number;
  created: number;
  linked: number;
  reused: number;
  enriched: number;
  ambiguous: number;
  skipped: number;
  failed: number;
  failures: string[];
}

export async function backfillOrganizations(
  options: BackfillOrganizationsOptions = {},
): Promise<BackfillOrganizationsSummary> {
  const summary: BackfillOrganizationsSummary = {
    targeted: 0,
    created: 0,
    linked: 0,
    reused: 0,
    enriched: 0,
    ambiguous: 0,
    skipped: 0,
    failed: 0,
    failures: [],
  };

  const posts = await prisma.jobPost.findMany({
    where: options.ids?.length ? { id: { in: options.ids } } : undefined,
    orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
    skip: options.offset ?? 0,
    ...(options.limit ? { take: options.limit } : {}),
    include: {
      jobPostSources: {
        include: {
          sourcePost: {
            select: {
              source: true,
              rawJson: true,
              classificationJson: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  summary.targeted = posts.length;
  console.log(
    `[backfill-organizations] targets=${posts.length} dryRun=${Boolean(options.dryRun)}`,
  );

  // dry-run에서도 동일 실행 내 재사용을 시뮬레이션한다.
  const simulatedOrgs = new Map<string, OrganizationExisting>();

  for (const [index, post] of posts.entries()) {
    const label = `${index + 1}/${posts.length} ${post.id}`;
    try {
      if (post.organizationId) {
        summary.skipped += 1;
        console.log(`[backfill-organizations] skipped ${label}: already linked`);
        continue;
      }

      const sourceLink = post.jobPostSources[0];
      if (!sourceLink) {
        summary.skipped += 1;
        console.log(`[backfill-organizations] skipped ${label}: no source`);
        continue;
      }

      const raw = asRecord(sourceLink.sourcePost.rawJson);
      const classification = asRecord(sourceLink.sourcePost.classificationJson);
      const contact = asRecord(classification.contact);
      const displaySections = Array.isArray(post.displaySectionsJson)
        ? (post.displaySectionsJson as Array<{ title?: string | null; content?: string | null }>)
        : [];

      const candidate = buildOrganizationCandidate({
        source: sourceLink.source,
        company: stringValue(raw.company),
        companyType: stringValue(raw.companyType),
        displaySections,
        sido: post.sido,
        sigungu: post.sigungu,
        dongOrStation: post.dongOrStation,
        phones: post.contactPhones ?? contact.phones,
        emails: post.contactEmails ?? contact.emails,
        logoUrl: post.academyLogoUrl,
        gallery: post.academyGalleryJson,
        academyImages: raw.academyImages,
      });

      if (!candidate) {
        summary.skipped += 1;
        console.log(`[backfill-organizations] skipped ${label}: no organization name`);
        continue;
      }

      const existing = options.dryRun
        ? [...simulatedOrgs.values()]
        : await loadMatchCandidates(candidate);
      const decision = decideOrganizationMatch(candidate, existing);

      if (decision.kind === "ambiguous") {
        summary.ambiguous += 1;
        console.log(
          `[backfill-organizations] ambiguous ${label}: ${decision.reason} ids=${decision.candidateIds.join(",")}`,
        );
        continue;
      }

      if (decision.kind === "skip") {
        summary.skipped += 1;
        console.log(`[backfill-organizations] skipped ${label}: ${decision.reason}`);
        continue;
      }

      if (options.dryRun) {
        if (decision.kind === "create") {
          const fakeId = `dry-${candidate.matchKey}`;
          simulatedOrgs.set(fakeId, {
            id: fakeId,
            name: candidate.name,
            normalizedName: candidate.normalizedName,
            type: candidate.type,
            matchKey: candidate.matchKey,
            sido: candidate.sido,
            sigungu: candidate.sigungu,
            dongOrStation: candidate.dongOrStation,
            phones: candidate.phones,
            emails: candidate.emails,
            logoUrl: candidate.logoUrl,
            gallery: candidate.gallery,
            externalProfileUrl: candidate.externalProfileUrl,
          });
          summary.created += 1;
          summary.linked += 1;
          console.log(
            `[backfill-organizations] dry-run create+link ${label}: ${candidate.name} (${candidate.matchKey})`,
          );
        } else {
          summary.reused += 1;
          summary.linked += 1;
          console.log(
            `[backfill-organizations] dry-run reuse+link ${label}: ${decision.organizationId} via ${decision.reason}`,
          );
        }
        continue;
      }

      if (decision.kind === "create") {
        const created = await prisma.organization.create({
          data: organizationCreateData(candidate),
        });
        await prisma.jobPost.update({
          where: { id: post.id },
          data: { organizationId: created.id },
        });
        summary.created += 1;
        summary.linked += 1;
        console.log(
          `[backfill-organizations] created+linked ${label}: ${created.id} ${candidate.name}`,
        );
        continue;
      }

      const org = await prisma.organization.findUnique({ where: { id: decision.organizationId } });
      if (!org) {
        summary.failed += 1;
        summary.failures.push(`${post.id}: missing organization ${decision.organizationId}`);
        continue;
      }

      const merged = mergeOrganizationFields(toExisting(org), candidate);
      await prisma.organization.update({
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
      await prisma.jobPost.update({
        where: { id: post.id },
        data: { organizationId: org.id },
      });
      summary.reused += 1;
      summary.enriched += 1;
      summary.linked += 1;
      console.log(
        `[backfill-organizations] reused+linked ${label}: ${org.id} via ${decision.reason}`,
      );
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      summary.failures.push(`${post.id}: ${message}`);
      console.error(`[backfill-organizations] failed ${label}: ${message}`);
    }
  }

  return summary;
}

async function loadMatchCandidates(candidate: OrganizationCandidate): Promise<OrganizationExisting[]> {
  const phoneFilters = candidate.phones
    .filter((phone) => phone.length >= 8)
    .map((phone) => ({ phonesJson: { array_contains: phone } }));

  const rows = await prisma.organization.findMany({
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
  return rows.map(toExisting);
}

function organizationCreateData(candidate: OrganizationCandidate) {
  return {
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
  };
}

function toExisting(org: {
  id: string;
  name: string;
  normalizedName: string;
  type: OrganizationExisting["type"];
  matchKey: string;
  sido: string | null;
  sigungu: string | null;
  dongOrStation: string | null;
  phonesJson: unknown;
  emailsJson: unknown;
  logoUrl: string | null;
  galleryJson: unknown;
  externalProfileUrl: string | null;
}): OrganizationExisting {
  return {
    id: org.id,
    name: org.name,
    normalizedName: org.normalizedName,
    type: org.type,
    matchKey: org.matchKey,
    sido: org.sido,
    sigungu: org.sigungu,
    dongOrStation: org.dongOrStation,
    phones: jsonArray(org.phonesJson),
    emails: jsonArray(org.emailsJson),
    logoUrl: org.logoUrl,
    gallery: Array.isArray(org.galleryJson)
      ? (org.galleryJson as OrganizationExisting["gallery"])
      : [],
    externalProfileUrl: org.externalProfileUrl,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const summary = await backfillOrganizations({
    dryRun: Boolean(args.dryRun),
    limit: args.limit ? Number(args.limit) : undefined,
    offset: args.offset ? Number(args.offset) : undefined,
    ids: args.ids,
  });
  console.log(`[backfill-organizations] complete: ${JSON.stringify(summary)}`);
  if (summary.failures.length) {
    console.log(`[backfill-organizations] failures:\n${summary.failures.join("\n")}`);
  }
  await prisma.$disconnect();
  if (summary.failed > 0) process.exitCode = 1;
}

function parseArgs(argv: string[]) {
  const parsed: { dryRun?: boolean; limit?: string; offset?: string; ids?: string[] } = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--limit") parsed.limit = argv[++index];
    else if (arg === "--offset") parsed.offset = argv[++index];
    else if (arg === "--ids") {
      parsed.ids = (argv[++index] || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    }
  }
  return parsed;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
}
