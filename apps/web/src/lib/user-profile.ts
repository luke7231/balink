import { prisma } from "@balink/db";
import { DEFAULT_AVATAR_PATH, saveRemoteProfileImage } from "@/lib/profile-image";
import { allocateUniqueNickname } from "@/lib/random-nickname";

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
