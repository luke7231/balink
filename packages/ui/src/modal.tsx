"use client";

import { useEffect, useId, type ReactNode } from "react";

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** 하단 액션 영역 (확인/취소 버튼 등) */
  footer?: ReactNode;
  /** 배경 클릭으로 닫기. 기본 true */
  closeOnBackdrop?: boolean;
  /** 콘텐츠 영역 최대 너비 */
  size?: "sm" | "md";
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  closeOnBackdrop = true,
  size = "sm",
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-foreground/40"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`relative w-full rounded-3xl bg-surface p-5 shadow-2xl ${
          size === "md" ? "max-w-md" : "max-w-sm"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
            aria-label="닫기"
          >
            <CloseIcon />
          </button>
        </div>

        <div id={descriptionId} className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>

        {footer ? <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 4l8 8M12 4L4 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
