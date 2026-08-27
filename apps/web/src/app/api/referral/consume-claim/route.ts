import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CLAIM_INVITE_COOKIE } from "@/lib/referral-cookie-name";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

/** Clear claim-invite cookie then redirect (RSC cannot mutate cookies). */
export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const response = NextResponse.redirect(new URL(next, request.nextUrl.origin));
  response.cookies.set(CLAIM_INVITE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
