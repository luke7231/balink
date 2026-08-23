"use client";

import Link from "next/link";
import { BottomSheet } from "@/components/bottom-sheet";

export function RegionLimitSheet({
  open,
  referred = false,
  onClose,
}: {
  open: boolean;
  referred?: boolean;
  onClose: () => void;
}) {
  return (
    <BottomSheet open={open} title="관심지역을 더 열려면" onClose={onClose}>
      <div className="space-y-3">
        <section className={`rounded-2xl bg-surface-muted px-4 py-4 ${referred ? "opacity-60" : ""}`}>
          <h3 className="text-sm font-semibold text-foreground">하나 더 여는 법</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            공유받은 친구 코드를 넣으면 관심지역이 하나 더 열립니다.
          </p>
          {referred ? (
            <button
              type="button"
              disabled
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-muted-foreground"
            >
              코드를 이미 넣었어요
            </button>
          ) : (
            <Link
              href="/signup/invite-code?from=limit"
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-background hover:opacity-90"
            >
              친구 코드 입력하기
            </Link>
          )}
        </section>

        <section className="rounded-2xl bg-surface-muted px-4 py-4">
          <h3 className="text-sm font-semibold text-foreground">무제한 관심지역</h3>
          <ol className="mt-1.5 space-y-1 text-sm leading-relaxed">
            <li className="text-muted-foreground">
              <span className="tabular-nums font-semibold text-foreground">1.</span>{" "}
              친구가 링크를 통해 가입하거나, 직접 가입후 코드를 입력하면 됩니다.
            </li>
            <li className="font-bold text-foreground">
              <span className="tabular-nums">2.</span>{" "}
              그 친구가 알림 지역을 하나 이상 저장하면 내 관심지역이 무제한이 됩니다.
            </li>
          </ol>
          <Link
            href="/account/invite"
            className={`mt-4 flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold ${
              referred
                ? "bg-accent text-background hover:opacity-90"
                : "border border-border bg-surface text-foreground hover:bg-background"
            }`}
          >
            친구 초대하러 가기
          </Link>
        </section>
      </div>
    </BottomSheet>
  );
}
