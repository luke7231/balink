"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  closeLabel?: string;
  headerAction?: ReactNode;
  /** iframe 등 남은 높이를 채우는 콘텐츠용 */
  fill?: boolean;
}

const EXIT_MS = 280;

export function BottomSheet({
  open,
  title,
  onClose,
  children,
  closeLabel = "닫기",
  headerAction,
  fill = false,
}: BottomSheetProps) {
  const titleId = useId();
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

  return createPortal(
    <div className="fixed inset-0 z-60">
      <button
        type="button"
        aria-label="닫기"
        className={`absolute inset-0 bg-foreground/40 transition-opacity duration-280 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl transition-transform duration-280 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform motion-reduce:transition-none ${
          fill ? "h-[92dvh] max-h-[92dvh]" : "max-h-[85vh]"
        } ${visible ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="flex justify-center pt-3">
          <div className="h-1.5 w-12 rounded-full bg-surface-muted" />
        </div>
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
          <h2 id={titleId} className="min-w-0 truncate text-lg font-semibold text-foreground">
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-1">
            {headerAction}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-surface-muted"
            >
              {closeLabel}
            </button>
          </div>
        </div>
        {fill ? (
          <div className="min-h-0 flex-1 pb-[env(safe-area-inset-bottom)]">{children}</div>
        ) : (
          <div className="max-h-[calc(85vh-5rem)] overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
