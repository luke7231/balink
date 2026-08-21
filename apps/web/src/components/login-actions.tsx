"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithKakao() {
  await signIn("kakao", { redirectTo: "/" });
}

export async function signInWithApple() {
  await signIn("apple", { redirectTo: "/" });
}

export async function signOutAction() {
  // Stay on account so the native Account tab shows LoginScreen (not Jobs home).
  // Use a path; Auth.js still prefixes AUTH_URL — mobile rewrites localhost↔LAN.
  await signOut({ redirectTo: "/account" });
}
