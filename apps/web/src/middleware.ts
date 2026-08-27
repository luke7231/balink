import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CLAIM_INVITE_COOKIE } from "@/lib/referral-cookie-name";

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

function clearClaimInviteCookie(response: NextResponse) {
  response.cookies.set(CLAIM_INVITE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function middleware(request: NextRequest) {
  if (request.cookies.get(CLAIM_INVITE_COOKIE)?.value !== "1") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  // Let login complete; welcome/invite pages send unauthenticated users here.
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return NextResponse.next();
  }
  if (isClaimFlowPath(pathname)) {
    return NextResponse.next();
  }

  // Left the post-signup gate (마이 탭 → /account, 앱 재실행 등): same as skip.
  // Do not trap the rest of the app behind welcome for the cookie TTL.
  const response = NextResponse.next();
  clearClaimInviteCookie(response);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
