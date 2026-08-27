import { prisma } from "@balink/db";
import { DEFAULT_AVATAR_PATH, saveRemoteProfileImage } from "@/lib/profile-image";
import { allocateUniqueNickname } from "@/lib/random-nickname";

/**
 * Auth.js still emits `createUser` when linking OAuth to an existing User by
 * email (`allowDangerousEmailAccountLinking`). That User is already provisioned
 * (email+password, or another social Account). Skip nickname/referral setup.
 *
 * At event time `linkAccount` has not run yet, so a brand-new social user has
 * no Account rows and no passwordHash.
 */
export function shouldProvisionAuthJsUser(user: {
  passwordHash?: string | null;
  accountCount: number;
}): boolean {
  if (user.passwordHash) return false;
  if (user.accountCount > 0) return false;
  return true;
}

export async function finalizeNewUserProfile(user: {
  id: string;
  image?: string | null;
}): Promise<void> {
  const name = await allocateUniqueNickname();
  let image = DEFAULT_AVATAR_PATH;

  if (user.image) {
    const saved = await saveRemoteProfileImage(user.id, user.image);
    if (saved) image = saved;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, image },
  });
}
