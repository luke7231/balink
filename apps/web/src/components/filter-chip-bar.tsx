"use client";

import { useState, type ReactNode } from "react";
import { BottomSheet } from "@/components/bottom-sheet";

export interface FilterChipItem {
  key: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

interface FilterChipBarProps {
  chips: FilterChipItem[];
  activeCount: number;
  sheetTitle?: string;
  sheetContent: ReactNode;
  ariaLabel: string;
}

export function FilterChipBar({
  chips,
  activeCount,
  sheetTitle = "필터 설정",
  sheetContent,
  ariaLabel,
}: FilterChipBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section aria-label={ariaLabel} className="mb-6 min-w-0 max-w-full">
        <div className="flex min-w-0 max-w-full gap-2 pb-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`inline-flex h-10 shrink-0 touch-manipulation items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition ${
              activeCount > 0
                ? "bg-accent-subtle text-accent"
                : "border border-border bg-surface text-muted-foreground"
            }`}
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <SlidersIcon />
            <span>{activeCount > 0 ? activeCount : "필터"}</span>
          </button>

          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto overscroll-x-contain scrollbar-none">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                aria-pressed={chip.selected}
                onClick={chip.onSelect}
                className={`inline-flex h-10 shrink-0 items-center rounded-xl px-3.5 text-sm font-semibold whitespace-nowrap transition ${
                  chip.selected
                    ? "bg-accent-subtle text-accent"
                    : "border border-border bg-surface text-muted-foreground"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <BottomSheet open={open} title={sheetTitle} onClose={() => setOpen(false)}>
        <div
          onClick={(event) => {
            if ((event.target as Element).closest("[data-close-sheet]")) setOpen(false);
          }}
          onSubmit={() => setOpen(false)}
        >
          {sheetContent}
        </div>
      </BottomSheet>
    </>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M4 7h10M18 7h2M4 17h2M10 17h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="16" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8" cy="17" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
