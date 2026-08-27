"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { isAppleLoginEnabled } from "@/lib/auth-features";

export async function signInWithKakao() {
  await signIn("kakao", { redirectTo: "/" });
}

export async function signInWithApple() {
  if (!isAppleLoginEnabled()) redirect("/login");
  await signIn("apple", { redirectTo: "/" });
}

export async function signOutAction() {
  // Stay on account so the native Account tab shows LoginScreen (not Jobs home).
  // Use a path; Auth.js still prefixes AUTH_URL — mobile rewrites localhost↔LAN.
  await signOut({ redirectTo: "/account" });
}
