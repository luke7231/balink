"use client";

import { useCallback, useSyncExternalStore } from "react";

export const LIST_VIEW_STORAGE_KEY = "balink.list-view";
export const LIST_VIEW_CHANGE_EVENT = "balink:list-view-change";

export type ListViewMode = "card" | "board";

const DEFAULT_MODE: ListViewMode = "card";

export function isListViewMode(value: unknown): value is ListViewMode {
  return value === "card" || value === "board";
}

export function readListViewMode(): ListViewMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    const stored = window.localStorage.getItem(LIST_VIEW_STORAGE_KEY);
    return isListViewMode(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

export function writeListViewMode(mode: ListViewMode): void {
  try {
    window.localStorage.setItem(LIST_VIEW_STORAGE_KEY, mode);
  } catch {
    // Preference still applies in-memory when storage is unavailable.
  }
  window.dispatchEvent(
    new CustomEvent(LIST_VIEW_CHANGE_EVENT, { detail: { mode } }),
  );
}

function subscribeListViewMode(onStoreChange: () => void): () => void {
  const onCustom = () => onStoreChange();
  const onStorage = (event: StorageEvent) => {
    if (event.key === LIST_VIEW_STORAGE_KEY || event.key === null) {
      onStoreChange();
    }
  };
  window.addEventListener(LIST_VIEW_CHANGE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(LIST_VIEW_CHANGE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function useListViewMode(): [ListViewMode, (mode: ListViewMode) => void] {
  const mode = useSyncExternalStore(
    subscribeListViewMode,
    readListViewMode,
    () => DEFAULT_MODE,
  );

  const setMode = useCallback((next: ListViewMode) => {
    writeListViewMode(next);
  }, []);

  return [mode, setMode];
}
