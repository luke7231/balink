import { pathToFileURL } from "node:url";
import { prisma } from "@balink/db";
import {
  KNOWN_SIDO,
  canonicalizeAdminRegion,
  sanitizeLocationTextForStorage,
} from "@balink/domain";

interface BackfillOptions {
  dryRun: boolean;
}

interface BackfillSummary {
  jobPosts: { scanned: number; updated: number };
  substitutePosts: { scanned: number; updated: number };
  organizations: { scanned: number; updated: number };
  interestRegions: { scanned: number; updated: number; deleted: number };
}

function nonCanonicalNullableSidoWhere() {
  return {
    sido: { not: null, notIn: [...KNOWN_SIDO] },
  };
}

function nonCanonicalRequiredSidoWhere() {
  return {
    sido: { notIn: [...KNOWN_SIDO] },
  };
}

export async function backfillRegionAliases(options: BackfillOptions): Promise<BackfillSummary> {
  const summary: BackfillSummary = {
    jobPosts: { scanned: 0, updated: 0 },
    substitutePosts: { scanned: 0, updated: 0 },
    organizations: { scanned: 0, updated: 0 },
    interestRegions: { scanned: 0, updated: 0, deleted: 0 },
  };

  const jobPosts = await prisma.jobPost.findMany({
    where: nonCanonicalNullableSidoWhere(),
    select: {
      id: true,
      sido: true,
      sigungu: true,
      dongOrStation: true,
      locationText: true,
    },
  });
  summary.jobPosts.scanned = jobPosts.length;

  for (const post of jobPosts) {
    const next = canonicalizeAdminRegion(post);
    if (!next.changed) continue;
    const locationText = sanitizeLocationTextForStorage(
      post.locationText,
      next.sido,
      next.sigungu,
      next.dongOrStation,
    );
    console.log(
      `[jobPost] ${post.id}: ${post.sido}/${post.sigungu ?? "-"} -> ${next.sido}/${next.sigungu ?? "-"}`,
    );
    if (!options.dryRun) {
      await prisma.jobPost.update({
        where: { id: post.id },
        data: {
          sido: next.sido,
          sigungu: next.sigungu,
          dongOrStation: next.dongOrStation,
          locationText,
        },
      });
    }
    summary.jobPosts.updated += 1;
  }

  const substitutePosts = await prisma.substitutePost.findMany({
    where: nonCanonicalNullableSidoWhere(),
    select: {
      id: true,
      sido: true,
      sigungu: true,
      dongOrStation: true,
      locationText: true,
    },
  });
  summary.substitutePosts.scanned = substitutePosts.length;

  for (const post of substitutePosts) {
    const next = canonicalizeAdminRegion(post);
    if (!next.changed) continue;
    const locationText = sanitizeLocationTextForStorage(
      post.locationText,
      next.sido,
      next.sigungu,
      next.dongOrStation,
    );
    console.log(
      `[substitutePost] ${post.id}: ${post.sido}/${post.sigungu ?? "-"} -> ${next.sido}/${next.sigungu ?? "-"}`,
    );
    if (!options.dryRun) {
      await prisma.substitutePost.update({
        where: { id: post.id },
        data: {
          sido: next.sido,
          sigungu: next.sigungu,
          dongOrStation: next.dongOrStation,
          locationText,
        },
      });
    }
    summary.substitutePosts.updated += 1;
  }

  const organizations = await prisma.organization.findMany({
    where: nonCanonicalNullableSidoWhere(),
    select: { id: true, sido: true, sigungu: true },
  });
  summary.organizations.scanned = organizations.length;

  for (const org of organizations) {
    const next = canonicalizeAdminRegion({
      sido: org.sido,
      sigungu: org.sigungu,
      dongOrStation: null,
    });
    if (!next.changed) continue;
    console.log(
      `[organization] ${org.id}: ${org.sido}/${org.sigungu ?? "-"} -> ${next.sido}/${next.sigungu ?? "-"}`,
    );
    if (!options.dryRun) {
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          sido: next.sido,
          sigungu: next.sigungu,
        },
      });
    }
    summary.organizations.updated += 1;
  }

  const interestRegions = await prisma.userInterestRegion.findMany({
    where: nonCanonicalRequiredSidoWhere(),
    select: { id: true, userId: true, sido: true, sigungu: true },
  });
  summary.interestRegions.scanned = interestRegions.length;

  for (const region of interestRegions) {
    const next = canonicalizeAdminRegion({
      sido: region.sido,
      sigungu: region.sigungu,
      dongOrStation: null,
    });
    if (!next.changed) continue;

    if (!next.sido || !next.sigungu) {
      console.log(`[interestRegion] ${region.id}: ${region.sido}/${region.sigungu} -> delete (invalid)`);
      if (!options.dryRun) {
        await prisma.userInterestRegion.delete({ where: { id: region.id } });
      }
      summary.interestRegions.deleted += 1;
      continue;
    }

    const duplicate = await prisma.userInterestRegion.findFirst({
      where: {
        userId: region.userId,
        sido: next.sido,
        sigungu: next.sigungu,
        NOT: { id: region.id },
      },
      select: { id: true },
    });

    console.log(
      `[interestRegion] ${region.id}: ${region.sido}/${region.sigungu} -> ${next.sido}/${next.sigungu}${
        duplicate ? " (merge)" : ""
      }`,
    );

    if (!options.dryRun) {
      if (duplicate) {
        await prisma.userInterestRegion.delete({ where: { id: region.id } });
        summary.interestRegions.deleted += 1;
      } else {
        await prisma.userInterestRegion.update({
          where: { id: region.id },
          data: { sido: next.sido, sigungu: next.sigungu },
        });
        summary.interestRegions.updated += 1;
      }
    } else if (duplicate) {
      summary.interestRegions.deleted += 1;
    } else {
      summary.interestRegions.updated += 1;
    }
  }

  return summary;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const summary = await backfillRegionAliases({ dryRun });
  console.log(`[backfill-region-aliases] ${dryRun ? "dry-run " : ""}complete: ${JSON.stringify(summary)}`);
  await prisma.$disconnect();
}

const isDirectRun = Boolean(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href);

if (isDirectRun) {
  main().catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
}
