import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@black-swan/db";
import NextAuth from "next-auth";
import Apple from "next-auth/providers/apple";
import Kakao from "next-auth/providers/kakao";
import type { Provider } from "next-auth/providers";

const providers: Provider[] = [
  Kakao({
    allowDangerousEmailAccountLinking: true,
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
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});

export const isAppleLoginEnabled = Boolean(
  process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET,
);
