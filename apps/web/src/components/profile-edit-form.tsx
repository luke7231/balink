"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ProfileAvatar, isDefaultAvatar } from "@/components/profile-avatar";
import {
  requestEmailChangeAction,
  resetProfileImageAction,
  updateDisplayNameAction,
  uploadProfileImageAction,
} from "@/components/profile-actions";

export function ProfileEditForm({
  initialName,
  initialEmail,
  initialImage,
  pendingEmail,
}: {
  initialName: string;
  initialEmail: string | null;
  initialImage: string | null;
  pendingEmail: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState("");
  const [image, setImage] = useState(initialImage);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function flash(result: { ok: true; message?: string } | { ok: false; error: string }) {
    if (result.ok) {
      setError(null);
      setMessage(result.message ?? "저장했습니다.");
      router.refresh();
    } else {
      setMessage(null);
      setError(result.error);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">프로필 사진</h2>
        <p className="mt-1 text-sm text-muted-foreground">jpg, png, webp · 최대 5MB</p>

        <div className="mt-5 flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
            className="relative overflow-hidden rounded-full ring-2 ring-border transition hover:opacity-90 disabled:opacity-50"
            aria-label="프로필 사진 변경"
          >
            <ProfileAvatar src={image} size={72} className="h-18 w-18 rounded-full object-cover" />
          </button>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={pending}
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-85 disabled:opacity-50"
            >
              사진 선택
            </button>
            {!isDefaultAvatar(image) ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await resetProfileImageAction();
                    flash(result);
                    if (result.ok) setImage(null);
                  });
                }}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-muted disabled:opacity-50"
              >
                기본 이미지로
              </button>
            ) : null}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            const previewUrl = URL.createObjectURL(file);
            setImage(previewUrl);
            const formData = new FormData();
            formData.set("image", file);
            startTransition(async () => {
              const result = await uploadProfileImageAction(formData);
              flash(result);
              if (!result.ok) {
                URL.revokeObjectURL(previewUrl);
                setImage(initialImage);
              }
            });
          }}
        />
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">이름</h2>
        <p className="mt-1 text-sm text-muted-foreground">2~20자 · 바로 저장됩니다</p>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await updateDisplayNameAction(name);
              flash(result);
            });
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={20}
            required
            className="h-12 flex-1 rounded-2xl border border-border bg-background px-4 text-base text-foreground outline-none focus:border-accent"
            placeholder="표시 이름"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-12 rounded-full bg-foreground px-5 text-sm font-semibold text-background hover:opacity-85 disabled:opacity-50"
          >
            저장
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">이메일</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          현재: {initialEmail?.trim() || "없음"}
          {pendingEmail ? ` · 인증 대기: ${pendingEmail}` : ""}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          새 주소로 인증 메일을 보내고, 링크를 확인한 뒤에 반영됩니다.
        </p>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await requestEmailChangeAction(email);
              flash(result);
              if (result.ok) setEmail("");
            });
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-12 flex-1 rounded-2xl border border-border bg-background px-4 text-base text-foreground outline-none focus:border-accent"
            placeholder="새 이메일 주소"
            autoComplete="email"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-12 rounded-full bg-foreground px-5 text-sm font-semibold text-background hover:opacity-85 disabled:opacity-50"
          >
            인증 메일 보내기
          </button>
        </form>
      </section>

      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl border border-accent-border bg-accent-subtle px-4 py-3 text-sm text-accent">
          {error}
        </p>
      ) : null}
    </div>
  );
}
