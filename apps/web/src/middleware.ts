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

  const url = request.nextUrl.clone();
  url.pathname = CLAIM_WELCOME_PATH;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
