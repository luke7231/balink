import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@balink/db";

const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60; // 30 days (Auth.js default)

function useSecureCookies(): boolean {
  const url = process.env.AUTH_URL?.trim() || "";
  if (url.startsWith("https://")) return true;
  if (process.env.VERCEL_ENV === "production") return true;
  return false;
}

export function sessionCookieName(): string {
  return useSecureCookies() ? "__Secure-authjs.session-token" : "authjs.session-token";
}

export async function createDatabaseSession(userId: string): Promise<void> {
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });

  const jar = await cookies();
  jar.set(sessionCookieName(), sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecureCookies(),
    expires,
  });
}

export const AUTH_TICKET_COOKIE = "balink.auth-ticket";

export async function setAuthTicketCookie(ticket: string): Promise<void> {
  const jar = await cookies();
  jar.set(AUTH_TICKET_COOKIE, ticket, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecureCookies(),
    maxAge: 15 * 60,
  });
}

export async function clearAuthTicketCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(AUTH_TICKET_COOKIE);
}

export async function readAuthTicketCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(AUTH_TICKET_COOKIE)?.value ?? null;
}
