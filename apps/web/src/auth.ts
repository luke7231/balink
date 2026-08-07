import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@black-swan/db";
import NextAuth from "next-auth";
import Apple from "next-auth/providers/apple";
import Kakao from "next-auth/providers/kakao";
import type { Provider } from "next-auth/providers";
import { finalizeNewUserProfile } from "@/lib/user-profile";

const providers: Provider[] = [
  Kakao({
    allowDangerousEmailAccountLinking: true,
    // Must include `url`: Auth.js deep-merge replaces the default string endpoint
    // when only `params` are provided, which then throws Invalid URL on sign-in.
    authorization: {
      url: "https://kauth.kakao.com/oauth/authorize",
      params: {
        scope: "profile_image account_email",
      },
    },
  }),
];

if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
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
      await finalizeNewUserProfile({ id: user.id, image: user.image });
    },
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.name = user.name;
        session.user.image = user.image;
      }
      return session;
    },
  },
});

export const isAppleLoginEnabled = Boolean(
  process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET,
);
