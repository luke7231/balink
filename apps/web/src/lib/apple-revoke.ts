/** Revoke Sign in with Apple tokens when the user deletes their account. */
export async function revokeAppleAccount(token: string, hint: "refresh_token" | "access_token") {
  const clientId = process.env.AUTH_APPLE_ID?.trim();
  const clientSecret = process.env.AUTH_APPLE_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return { ok: false, detail: "Apple credentials are not configured" };
  }

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      token,
      token_type_hint: hint,
    });
    const response = await fetch("https://appleid.apple.com/auth/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      return { ok: false, detail: detail.slice(0, 300) || `status ${response.status}` };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "revoke failed",
    };
  }
}
