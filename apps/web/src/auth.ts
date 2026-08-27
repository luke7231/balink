import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@balink/db";
import NextAuth from "next-auth";
import Apple from "next-auth/providers/apple";
import Kakao from "next-auth/providers/kakao";
import type { Provider } from "next-auth/providers";
import { isAppleLoginEnabled } from "@/lib/auth-features";
import { attachReferralFromCookie, markInviteClaimNeeded } from "@/lib/referral";
import {
  finalizeNewUserProfile,
  shouldProvisionAuthJsUser,
} from "@/lib/user-profile";

const providers: Provider[] = [
  Kakao({
    allowDangerousEmailAccountLinking: true,
    // Must include `url`: Auth.js deep-merge replaces the default string endpoint
    // when only `params` are provided, which then throws Invalid URL on sign-in.
    authorization: {
      url: "https://kauth.kakao.com/oauth/authorize",
      params: {
        scope: "profile_image",
      },
    },
  }),
];

if (
  isAppleLoginEnabled() &&
  process.env.AUTH_APPLE_ID &&
  process.env.AUTH_APPLE_SECRET
) {
  providers.push(
    Apple({
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const existing = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          passwordHash: true,
          _count: { select: { accounts: true } },
        },
      });
      if (
        !existing ||
        !shouldProvisionAuthJsUser({
          passwordHash: existing.passwordHash,
          accountCount: existing._count.accounts,
        })
      ) {
        return;
      }
      await finalizeNewUserProfile({ id: user.id, image: user.image });
      const attached = await attachReferralFromCookie(user.id);
      if (!attached) await markInviteClaimNeeded(user.id);
    },
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.name = user.name;
        session.user.email = user.email;
        session.user.image = user.image;
      }
      return session;
    },
  },
});

export { isAppleLoginEnabled, isEmailAuthEnabled } from "@/lib/auth-features";
