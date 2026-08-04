import { prisma } from "@black-swan/db";

export async function getBookmarkedJobIdSet(
  userId: string | undefined,
  jobPostIds: string[],
): Promise<Set<string>> {
  if (!userId || jobPostIds.length === 0) return new Set();

  const rows = await prisma.jobBookmark.findMany({
    where: {
      userId,
      jobPostId: { in: jobPostIds },
    },
    select: { jobPostId: true },
  });

  return new Set(rows.map((row) => row.jobPostId));
}
