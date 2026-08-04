"use server";

import { prisma } from "@black-swan/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

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
    return { ok: false, error: "공고를 찾을 수 없습니다." };
  }

  const job = await prisma.jobPost.findUnique({
    where: { id: jobPostId },
    select: { id: true },
  });
  if (!job) {
    return { ok: false, error: "공고를 찾을 수 없습니다." };
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
