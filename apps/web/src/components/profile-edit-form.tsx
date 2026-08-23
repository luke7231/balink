"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { MotionReveal } from "@/components/motion-reveal";
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
    <div>
      <MotionReveal index={2} variant="fade-up">
        <section className="border-t border-border py-7">
          <h2 className="text-base font-semibold text-foreground">프로필 사진</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            jpg, png, webp · 최대 5MB. 선택한 사진은 바로 반영됩니다.
          </p>

          <div className="mt-5 flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={pending}
              className="relative overflow-hidden rounded-full ring-2 ring-border transition hover:opacity-90 disabled:opacity-50"
              aria-label="프로필 사진 변경하기"
            >
              <ProfileAvatar src={image} size={72} className="h-18 w-18 rounded-full object-cover" />
            </button>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={pending}
                className="rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-85 disabled:opacity-50"
              >
                사진 변경하기
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
                  className="rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted disabled:opacity-50"
                >
                  기본 이미지로 바꾸기
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
      </MotionReveal>

      <MotionReveal index={3} variant="fade-up">
        <section className="border-t border-border py-7">
          <h2 className="text-base font-semibold text-foreground">이름</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            2~20자. 저장하면 바로 반영됩니다.
          </p>
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await updateDisplayNameAction(name);
                flash(result);
              });
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">표시 이름</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={20}
                required
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground outline-none focus:border-accent"
                placeholder="표시 이름"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-85 disabled:opacity-50"
            >
              {pending ? "저장 중..." : "이름 저장하기"}
            </button>
          </form>
        </section>
      </MotionReveal>

      <MotionReveal index={4} variant="fade-up">
        <section className="border-t border-border py-7">
          <h2 className="text-base font-semibold text-foreground">이메일</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            현재 {initialEmail?.trim() || "없음"}
            {pendingEmail ? ` · 인증 대기 ${pendingEmail}` : ""}. 새 주소로 인증 메일을 보내고,
            링크를 확인한 뒤에 반영됩니다.
          </p>
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await requestEmailChangeAction(email);
                flash(result);
                if (result.ok) setEmail("");
              });
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">새 이메일 주소</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground outline-none focus:border-accent"
                placeholder="새 이메일 주소"
                autoComplete="email"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-85 disabled:opacity-50"
            >
              {pending ? "보내는 중..." : "인증 메일 보내기"}
            </button>
          </form>
        </section>
      </MotionReveal>

      {message || error ? (
        <MotionReveal index={5} variant="fade-up">
          <div className="border-t border-border py-7">
            {message ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {message}
              </p>
            ) : null}
            {error ? (
              <p
                role="alert"
                className="rounded-2xl border border-accent-border bg-accent-subtle px-4 py-3 text-sm text-accent"
              >
                {error}
              </p>
            ) : null}
          </div>
        </MotionReveal>
      ) : null}
    </div>
  );
}
