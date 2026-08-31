"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { isAppleLoginEnabled, isAppleLoginVisibleOnDevice } from "@/lib/auth-features";
import { revalidateAuthBoundary } from "@/lib/auth-boundary";
import { parseUserAgent } from "@/lib/device";

export async function signInWithKakao() {
  // New users land on welcome (claim cookie); returning users are redirected home there.
  await signIn("kakao", { redirectTo: "/signup/welcome" });
}

export async function signInWithApple() {
  if (!isAppleLoginEnabled()) redirect("/login");
  const device = parseUserAgent((await headers()).get("user-agent"));
  if (!isAppleLoginVisibleOnDevice(device)) redirect("/login");
  await signIn("apple", { redirectTo: "/signup/welcome" });
}

export async function signOutAction() {
  revalidateAuthBoundary();
  // Stay on account so the native Account tab shows LoginScreen (not Jobs home).
  // Use a path; Auth.js still prefixes AUTH_URL — mobile rewrites localhost↔LAN.
  await signOut({ redirectTo: "/account" });
}
