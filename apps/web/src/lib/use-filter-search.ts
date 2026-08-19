"use client";

import { useSyncExternalStore } from "react";
import { getFilterSearch, subscribeFilterUrl } from "@/lib/filter-url";

export function useFilterSearch(serverSearch: string): string {
  return useSyncExternalStore(subscribeFilterUrl, getFilterSearch, () => serverSearch);
}

export function hrefSearch(href: string): string {
  const index = href.indexOf("?");
  return index >= 0 ? href.slice(index) : "";
}
