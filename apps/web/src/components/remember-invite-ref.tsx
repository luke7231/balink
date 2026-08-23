"use client";

import { useEffect } from "react";
import { rememberInviteCodeAction } from "@/components/referral-actions";

export function RememberInviteRef({ code }: { code?: string | null }) {
  useEffect(() => {
    if (!code) return;
    void rememberInviteCodeAction(code);
  }, [code]);

  return null;
}
