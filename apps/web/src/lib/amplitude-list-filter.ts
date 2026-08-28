"use client";

import { trackAmplitudeEvent } from "@/lib/amplitude-client";
import {
  AmplitudeEventName,
  type ClickedListFilterProps,
  type ChangedListSortProps,
  type ListFilterKind,
  type ListFilterSource,
} from "@/lib/amplitude-events";

type TrackListFilterInput = {
  screen: ClickedListFilterProps["screen"];
  postKind: ClickedListFilterProps["post_kind"];
  sort: string;
  filterSource: ListFilterSource;
  filterKind: ListFilterKind;
  filterValue?: string;
  filterSelected: boolean;
  activeSidoCount?: number;
  activeSigunguCount?: number;
  activeDateCount?: number;
  activeRegionCount?: number;
};

export function trackClickedListFilter(input: TrackListFilterInput) {
  const props: ClickedListFilterProps = {
    screen: input.screen,
    post_kind: input.postKind,
    filter_source: input.filterSource,
    filter_kind: input.filterKind,
    filter_selected: input.filterSelected,
    sort: input.sort,
    ...(input.filterValue ? { filter_value: input.filterValue } : {}),
    ...(input.activeSidoCount != null
      ? { active_sido_count: input.activeSidoCount }
      : {}),
    ...(input.activeSigunguCount != null
      ? { active_sigungu_count: input.activeSigunguCount }
      : {}),
    ...(input.activeDateCount != null ? { active_date_count: input.activeDateCount } : {}),
    ...(input.activeRegionCount != null
      ? { active_region_count: input.activeRegionCount }
      : {}),
  };
  trackAmplitudeEvent(AmplitudeEventName.ClickedListFilter, props);
}

type TrackListSortInput = {
  screen: ChangedListSortProps["screen"];
  postKind: ChangedListSortProps["post_kind"];
  sort: string;
  previousSort: string;
};

export function trackChangedListSort(input: TrackListSortInput) {
  if (input.sort === input.previousSort) return;
  trackAmplitudeEvent(AmplitudeEventName.ChangedListSort, {
    screen: input.screen,
    post_kind: input.postKind,
    sort: input.sort,
    previous_sort: input.previousSort,
  });
}

export function trackSubmittedSearch(input: {
  screen: "job_list";
  query: string;
  resultCount: number;
  hasRegionFilter: boolean;
}) {
  trackAmplitudeEvent(AmplitudeEventName.SubmittedSearch, {
    screen: input.screen,
    query: input.query,
    query_length: input.query.length,
    result_count: input.resultCount,
    has_region_filter: input.hasRegionFilter,
  });
}

export function trackClearedSearch(input: { screen: "job_list" }) {
  trackAmplitudeEvent(AmplitudeEventName.ClearedSearch, {
    screen: input.screen,
  });
}
