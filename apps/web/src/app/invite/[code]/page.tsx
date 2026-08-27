import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Old invite URLs used to sign people up here. Signup is normal; codes are entered after. */
export default async function InvitePage() {
  redirect("/signup");
}
