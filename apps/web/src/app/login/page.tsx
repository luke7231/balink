import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginScreen } from "@/components/login-screen";
import { RememberInviteRef } from "@/components/remember-invite-ref";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string; ref?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const errorMessage = params.error
    ? "로그인에 실패했습니다. 다시 시도해 주세요."
    : null;
  const deletedMessage = params.deleted ? "계정이 삭제되었습니다." : null;

  return (
    <>
      <RememberInviteRef code={params.ref} />
      <LoginScreen errorMessage={errorMessage} deletedMessage={deletedMessage} showBrowseLink />
    </>
  );
}
