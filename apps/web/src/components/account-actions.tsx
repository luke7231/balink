"use server";

import { prisma } from "@black-swan/db";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { unlinkKakaoAccount } from "@/lib/kakao-unlink";

export async function deleteAccountAction() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }

  const accounts = await prisma.account.findMany({
    where: { userId },
    select: {
      provider: true,
      access_token: true,
    },
  });

  for (const account of accounts) {
    if (account.provider === "kakao" && account.access_token) {
      const result = await unlinkKakaoAccount(account.access_token);
      if (!result.ok) {
        console.warn("[delete-account] kakao unlink failed", result.detail);
      }
    }
  }

  await prisma.user.delete({ where: { id: userId } });
  await signOut({ redirectTo: "/login?deleted=1" });
}
