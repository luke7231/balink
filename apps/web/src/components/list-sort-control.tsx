"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";

export interface ListSortOption<T extends string> {
  value: T;
  label: string;
}

interface ListSortControlProps<T extends string> {
  value: T;
  options: Array<ListSortOption<T>>;
  onChange: (value: T) => void;
  sheetTitle?: string;
  ariaLabel?: string;
}

export function ListSortControl<T extends string>({
  value,
  options,
  onChange,
  sheetTitle = "정렬",
  ariaLabel = "정렬 기준 선택",
}: ListSortControlProps<T>) {
  const [open, setOpen] = useState(false);
  const currentLabel = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? "정렬";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span>{currentLabel}</span>
        <ChevronIcon />
      </button>

      <BottomSheet open={open} title={sheetTitle} onClose={() => setOpen(false)}>
        <div className="space-y-2" role="radiogroup" aria-label={sheetTitle}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm font-semibold transition ${
                  selected
                    ? "bg-accent-subtle text-accent"
                    : "border border-border text-foreground hover:bg-surface-muted"
                }`}
              >
                <span>{option.label}</span>
                {selected ? <CheckIcon /> : null}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.5l3 3 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
