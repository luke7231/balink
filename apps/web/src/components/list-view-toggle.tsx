"use client";

import type { ReactNode } from "react";
import type { ListViewMode } from "@/lib/list-view-preference";

interface ListViewToggleProps {
  value: ListViewMode;
  onChange: (mode: ListViewMode) => void;
}

export function ListViewToggle({ value, onChange }: ListViewToggleProps) {
  return (
    <div
      className="inline-flex shrink-0 items-center rounded-xl bg-surface-muted p-0.5"
      role="group"
      aria-label="목록 보기 방식"
    >
      <ToggleButton
        selected={value === "card"}
        ariaLabel="카드로 보기"
        onClick={() => onChange("card")}
      >
        <CardsIcon />
      </ToggleButton>
      <ToggleButton
        selected={value === "board"}
        ariaLabel="게시판으로 보기"
        onClick={() => onChange("board")}
      >
        <BoardIcon />
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  selected,
  ariaLabel,
  onClick,
  children,
}: {
  selected: boolean;
  ariaLabel: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
        selected
          ? "bg-surface text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function CardsIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect
        x="2.5"
        y="2.5"
        width="11"
        height="4.5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="2.5"
        y="9"
        width="11"
        height="4.5"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function BoardIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M3 4.5h10M3 8h10M3 11.5h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
