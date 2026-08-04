/** Revoke Kakao app connection for the user who owns this access token. */
export async function unlinkKakaoAccount(accessToken: string): Promise<{ ok: boolean; detail?: string }> {
  try {
    const response = await fetch("https://kapi.kakao.com/v1/user/unlink", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      return { ok: false, detail: detail.slice(0, 300) };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "unlink failed",
    };
  }
}
