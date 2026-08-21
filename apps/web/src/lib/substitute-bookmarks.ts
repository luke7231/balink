import { prisma } from "@balink/db";

export async function getBookmarkedSubstituteIdSet(
  userId: string | undefined,
  substitutePostIds: string[],
): Promise<Set<string>> {
  if (!userId || substitutePostIds.length === 0) return new Set();

  const rows = await prisma.substituteBookmark.findMany({
    where: {
      userId,
      substitutePostId: { in: substitutePostIds },
    },
    select: { substitutePostId: true },
  });

  return new Set(rows.map((row) => row.substitutePostId));
}
