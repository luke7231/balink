import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CLAIM_INVITE_COOKIE,
} from "@/lib/referral-cookie-name";

/** Post-signup gate: welcome first, then optional invite-code entry. */
const CLAIM_WELCOME_PATH = "/signup/welcome";
const CLAIM_INVITE_PATH = "/signup/invite-code";

function isClaimFlowPath(pathname: string) {
  return (
    pathname === CLAIM_WELCOME_PATH ||
    pathname.startsWith(`${CLAIM_WELCOME_PATH}/`) ||
    pathname === CLAIM_INVITE_PATH ||
    pathname.startsWith(`${CLAIM_INVITE_PATH}/`)
  );
}

function useSecure(request: NextRequest): boolean {
  return request.nextUrl.protocol === "https:";
}

/**
 * Soft-dismiss open claim when leaving the gate (e.g. 마이 탭).
 * Do not stamp "done" here — AuthBoundarySync refreshes other tabs and would
 * permanently dismiss before the user taps skip.
 */
function clearOpenClaim(response: NextResponse, request: NextRequest) {
  response.cookies.set(CLAIM_INVITE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecure(request),
    maxAge: 0,
  });
}

export function middleware(request: NextRequest) {
  if (request.cookies.get(CLAIM_INVITE_COOKIE)?.value !== "1") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return NextResponse.next();
  }
  if (isClaimFlowPath(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  clearOpenClaim(response, request);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
