"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

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

const EXIT_MS = 280;
const MOTION =
  "duration-280 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:transform-none";

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
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [openSnapshot, setOpenSnapshot] = useState(open);

  if (open !== openSnapshot) {
    setOpenSnapshot(open);
    if (open) {
      setMounted(true);
    } else {
      setVisible(false);
    }
  }

  useEffect(() => {
    if (!mounted) return;

    if (open) {
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(frame);
    }

    const timer = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted, onClose]);

  if (!mounted) return null;
  if (typeof document === "undefined") return null;

  // Portal to body so `fixed` covers the viewport — ancestors with transform
  // (page motion) would otherwise clip the backdrop to a single section.
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="닫기"
        className={`absolute inset-0 bg-foreground/40 transition-opacity ${MOTION} ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`relative w-full rounded-3xl bg-surface p-5 shadow-2xl transition-[opacity,transform] will-change-transform ${MOTION} ${
          size === "md" ? "max-w-md" : "max-w-sm"
        } ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-2.5 scale-[0.985] opacity-0"
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
    </div>,
    document.body,
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
