import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CLAIM_INVITE_COOKIE } from "@/lib/referral-cookie-name";

const CLAIM_PATH = "/signup/invite-code";

export function middleware(request: NextRequest) {
  if (request.cookies.get(CLAIM_INVITE_COOKIE)?.value !== "1") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (pathname === CLAIM_PATH || pathname.startsWith(`${CLAIM_PATH}/`)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = CLAIM_PATH;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
