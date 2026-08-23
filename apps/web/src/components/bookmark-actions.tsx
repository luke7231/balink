"use server";

import { prisma } from "@balink/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBookmarkedJobIdSet } from "@/lib/job-bookmarks";
import { getBookmarkedSubstituteIdSet } from "@/lib/substitute-bookmarks";

export type BookmarkActionResult =
  | { ok: true; bookmarked: boolean }
  | { ok: false; error: string };

async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }
  return userId;
}

export async function toggleJobBookmarkAction(jobPostId: string): Promise<BookmarkActionResult> {
  const userId = await requireUserId();
  if (!jobPostId.trim()) {
    return { ok: false, error: "공고를 찾을 수 없어요." };
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: jobPostId },
    select: { id: true },
  });
  if (!job) {
    return { ok: false, error: "공고를 찾을 수 없어요." };
  }

  const existing = await prisma.jobBookmark.findUnique({
    where: {
      userId_jobPostId: { userId, jobPostId },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.jobBookmark.delete({ where: { id: existing.id } });
    revalidatePath("/");
    revalidatePath(`/jobs/${jobPostId}`);
    revalidatePath("/saved");
    revalidatePath("/account");
    return { ok: true, bookmarked: false };
  }

  await prisma.jobBookmark.create({
    data: { userId, jobPostId },
  });
  revalidatePath("/");
  revalidatePath(`/jobs/${jobPostId}`);
  revalidatePath("/saved");
  revalidatePath("/account");
  return { ok: true, bookmarked: true };
}

export async function toggleSubstituteBookmarkAction(
  substitutePostId: string,
): Promise<BookmarkActionResult> {
  const userId = await requireUserId();
  if (!substitutePostId.trim()) {
    return { ok: false, error: "대강을 찾을 수 없어요." };
  }

  const post = await prisma.substitutePost.findUnique({
    where: { id: substitutePostId },
    select: { id: true },
  });
  if (!post) {
    return { ok: false, error: "대강을 찾을 수 없어요." };
  }

  const existing = await prisma.substituteBookmark.findUnique({
    where: {
      userId_substitutePostId: { userId, substitutePostId },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.substituteBookmark.delete({ where: { id: existing.id } });
    revalidatePath("/substitutes");
    revalidatePath(`/substitutes/${substitutePostId}`);
    revalidatePath("/saved");
    revalidatePath("/account");
    return { ok: true, bookmarked: false };
  }

  await prisma.substituteBookmark.create({
    data: { userId, substitutePostId },
  });
  revalidatePath("/substitutes");
  revalidatePath(`/substitutes/${substitutePostId}`);
  revalidatePath("/saved");
  revalidatePath("/account");
  return { ok: true, bookmarked: true };
}

/** Client home feed: resolve which of the visible jobs are bookmarked. */
export async function getBookmarkedJobIdsAction(jobPostIds: string[]): Promise<string[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || jobPostIds.length === 0) return [];
  const set = await getBookmarkedJobIdSet(userId, jobPostIds);
  return [...set];
}

/** Client substitute feed: resolve which of the visible posts are bookmarked. */
export async function getBookmarkedSubstituteIdsAction(
  substitutePostIds: string[],
): Promise<string[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || substitutePostIds.length === 0) return [];
  const set = await getBookmarkedSubstituteIdSet(userId, substitutePostIds);
  return [...set];
}
