import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CLAIM_INVITE_COOKIE,
  CLAIM_INVITE_DONE_COOKIE,
  CLAIM_INVITE_DONE_MAX_AGE_SEC,
} from "@/lib/referral-cookie-name";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function useSecure(request: NextRequest): boolean {
  return request.nextUrl.protocol === "https:";
}

/** Finish invite prompt: clear claim cookie, stamp done, then redirect. */
export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const response = NextResponse.redirect(new URL(next, request.nextUrl.origin));
  const secure = useSecure(request);
  response.cookies.set(CLAIM_INVITE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: 0,
  });
  response.cookies.set(CLAIM_INVITE_DONE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: CLAIM_INVITE_DONE_MAX_AGE_SEC,
  });
  return response;
}
