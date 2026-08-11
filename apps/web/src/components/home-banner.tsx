"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { HomeBannerItem } from "@/lib/home-banners";

const AUTO_PLAY_MS = 4000;
const RESUME_AUTO_PLAY_MS = 5500;
const SWIPE_CLICK_THRESHOLD = 8;
const SWIPE_CHANGE_THRESHOLD = 48;
const DESKTOP_PAGE_SIZE = 3;

type TrackPage = {
  key: string;
  logicalIndex: number;
  items: HomeBannerItem[];
  clone?: "start" | "end";
};

export function HomeBanner({ items }: { items: HomeBannerItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="motion-fade-up mb-6" aria-label="추천 배너" style={{ ["--motion-index" as string]: 0 }}>
      <BannerCarousel items={items} pageSize={1} variant="mobile" />
      <BannerCarousel items={items} pageSize={DESKTOP_PAGE_SIZE} variant="desktop" />
    </section>
  );
}

function chunkPages<T>(items: T[], pageSize: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += pageSize) {
    pages.push(items.slice(i, i + pageSize));
  }
  return pages;
}

function buildTrack(pages: HomeBannerItem[][]): TrackPage[] {
  if (pages.length === 0) return [];
  if (pages.length === 1) {
    return [{ key: "page-0", logicalIndex: 0, items: pages[0]! }];
  }

  const last = pages.length - 1;
  return [
    { key: "clone-end", logicalIndex: last, items: pages[last]!, clone: "end" },
    ...pages.map((items, index) => ({
      key: `page-${index}`,
      logicalIndex: index,
      items,
    })),
    { key: "clone-start", logicalIndex: 0, items: pages[0]!, clone: "start" },
  ];
}

function BannerCarousel({
  items,
  pageSize,
  variant,
}: {
  items: HomeBannerItem[];
  pageSize: number;
  variant: "mobile" | "desktop";
}) {
  const pages = useMemo(() => chunkPages(items, pageSize), [items, pageSize]);
  const pageCount = pages.length;
  const loop = pageCount > 1;
  const track = useMemo(() => buildTrack(pages), [pages]);

  const scrollerRef = useRef<HTMLDivElement>(null);
  /** track 배열 기준 인덱스 (루프 시 첫 실페이지 = 1) */
  const trackIndexRef = useRef(loop ? 1 : 0);
  const dragStartTrackRef = useRef(loop ? 1 : 0);
  const jumpingRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const normalizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startScrollLeft: number;
    moved: boolean;
  } | null>(null);

  const [pageIndex, setPageIndex] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [dragSuppressClick, setDragSuppressClick] = useState(false);

  function logicalFromTrack(trackIndex: number) {
    return track[trackIndex]?.logicalIndex ?? 0;
  }

  function scrollLeftForTrackIndex(trackIndex: number) {
    const root = scrollerRef.current;
    const pageEl = root?.querySelector<HTMLElement>(`[data-track-index="${trackIndex}"]`);
    if (!root || !pageEl) return null;

    if (variant === "mobile") {
      return Math.max(0, pageEl.offsetLeft - (root.clientWidth - pageEl.clientWidth) / 2);
    }
    return pageEl.offsetLeft;
  }

  function jumpToTrackIndex(trackIndex: number) {
    const root = scrollerRef.current;
    const left = scrollLeftForTrackIndex(trackIndex);
    if (!root || left == null) return;
    jumpingRef.current = true;
    root.scrollTo({ left, behavior: "auto" });
    trackIndexRef.current = trackIndex;
    setPageIndex(logicalFromTrack(trackIndex));
    requestAnimationFrame(() => {
      jumpingRef.current = false;
    });
  }

  function normalizeLoopPosition(trackIndex: number) {
    if (!loop) return;
    // [clone-last][0..n-1][clone-first]
    if (trackIndex <= 0) {
      jumpToTrackIndex(pageCount);
      return;
    }
    if (trackIndex >= pageCount + 1) {
      jumpToTrackIndex(1);
    }
  }

  function scrollToTrackIndex(trackIndex: number, behavior: ScrollBehavior = "smooth") {
    const root = scrollerRef.current;
    if (!root || track.length === 0) return;

    const maxTrack = track.length - 1;
    const next = Math.max(0, Math.min(maxTrack, trackIndex));
    const left = scrollLeftForTrackIndex(next);
    if (left == null) return;

    trackIndexRef.current = next;
    setPageIndex(logicalFromTrack(next));
    root.scrollTo({ left, behavior });

    if (behavior === "auto") {
      normalizeLoopPosition(next);
      return;
    }

    if (normalizeTimerRef.current) clearTimeout(normalizeTimerRef.current);
    normalizeTimerRef.current = setTimeout(() => {
      normalizeLoopPosition(trackIndexRef.current);
    }, 420);
  }

  function pauseAutoPlay() {
    setAutoPlayEnabled(false);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setAutoPlayEnabled(true);
    }, RESUME_AUTO_PLAY_MS);
  }

  useEffect(() => {
    scrollToTrackIndex(loop ? 1 : 0, "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, pageCount, loop]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (normalizeTimerRef.current) clearTimeout(normalizeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!autoPlayEnabled || !loop) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      scrollToTrackIndex(trackIndexRef.current + 1, "smooth");
    }, AUTO_PLAY_MS);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayEnabled, loop, pageCount]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || !loop) return;

    const onScrollEnd = () => {
      if (jumpingRef.current) return;
      normalizeLoopPosition(trackIndexRef.current);
    };

    root.addEventListener("scrollend", onScrollEnd);
    return () => root.removeEventListener("scrollend", onScrollEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop, pageCount, variant]);

  if (pageCount === 0) return null;

  const isMobile = variant === "mobile";

  return (
    <div
      className={
        isMobile
          ? "relative min-w-0 max-w-full md:hidden"
          : "relative hidden min-w-0 max-w-full md:block"
      }
    >
      <div
        ref={scrollerRef}
        className={
          isMobile
            ? "flex min-w-0 max-w-full touch-none snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 scrollbar-none"
            : "flex w-full min-w-0 max-w-full touch-none snap-x snap-mandatory gap-0 overflow-x-auto overscroll-x-contain scrollbar-none"
        }
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          const root = scrollerRef.current;
          if (!root) return;
          pauseAutoPlay();
          dragStartTrackRef.current = trackIndexRef.current;
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startScrollLeft: root.scrollLeft,
            moved: false,
          };
          root.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          const root = scrollerRef.current;
          if (!drag || !root || drag.pointerId !== event.pointerId) return;
          const deltaX = event.clientX - drag.startX;
          if (Math.abs(deltaX) > SWIPE_CLICK_THRESHOLD) {
            drag.moved = true;
            setDragSuppressClick(true);
            event.preventDefault();
          }
          root.scrollLeft = drag.startScrollLeft - deltaX;
        }}
        onPointerUp={(event) => {
          const drag = dragRef.current;
          const root = scrollerRef.current;
          if (!drag || !root || drag.pointerId !== event.pointerId) return;
          if (root.hasPointerCapture(event.pointerId)) {
            root.releasePointerCapture(event.pointerId);
          }

          const deltaX = event.clientX - drag.startX;
          const startTrack = dragStartTrackRef.current;
          if (drag.moved && Math.abs(deltaX) > SWIPE_CHANGE_THRESHOLD) {
            const next = deltaX < 0 ? startTrack + 1 : startTrack - 1;
            scrollToTrackIndex(next, "smooth");
          } else {
            scrollToTrackIndex(startTrack, "smooth");
          }

          dragRef.current = null;
          window.setTimeout(() => setDragSuppressClick(false), 0);
        }}
        onPointerCancel={() => {
          dragRef.current = null;
          setDragSuppressClick(false);
          scrollToTrackIndex(dragStartTrackRef.current, "smooth");
        }}
      >
        {track.map((page, trackIndex) => (
          <div
            key={page.key}
            data-track-index={trackIndex}
            data-logical-index={page.logicalIndex}
            className={
              isMobile
                ? "w-[82%] shrink-0 snap-center sm:w-[78%]"
                : "grid w-full min-w-full shrink-0 snap-start grid-cols-3 gap-3"
            }
          >
            {page.items.map((item, indexInPage) => (
              <BannerCard
                key={`${page.key}-${item.id}`}
                item={item}
                priority={!page.clone && page.logicalIndex === 0 && indexInPage === 0}
                layout={variant}
                suppressClick={dragSuppressClick}
              />
            ))}
            {!isMobile &&
              page.items.length < pageSize &&
              Array.from({ length: pageSize - page.items.length }).map((_, filler) => (
                <div key={`${page.key}-filler-${filler}`} aria-hidden="true" />
              ))}
          </div>
        ))}
      </div>

      {pageCount > 1 ? (
        <div
          className={
            isMobile
              ? "pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2"
              : "mt-3 flex justify-center"
          }
        >
          <span
            className={
              isMobile
                ? "inline-flex items-center rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur-sm"
                : "inline-flex items-center rounded-full bg-zinc-900/80 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white"
            }
          >
            {String(pageIndex + 1).padStart(2, "0")}
            <span className="mx-1.5 opacity-50">|</span>
            {String(pageCount).padStart(2, "0")}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function BannerCard({
  item,
  priority,
  layout,
  suppressClick = false,
}: {
  item: HomeBannerItem;
  priority?: boolean;
  layout: "mobile" | "desktop";
  suppressClick?: boolean;
}) {
  return (
    <Link
      href={item.href}
      draggable={false}
      onClick={(event) => {
        if (suppressClick) event.preventDefault();
      }}
      className={`group relative block overflow-hidden bg-foreground shadow-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-400 ${
        layout === "mobile" ? "aspect-4/5 rounded-[1.35rem]" : "aspect-3/4 rounded-2xl"
      }`}
    >
      <Image
        src={item.imageSrc}
        alt={item.imageAlt}
        fill
        priority={priority}
        draggable={false}
        sizes={
          layout === "mobile"
            ? "(max-width: 768px) 82vw, 0px"
            : "(min-width: 768px) 33vw, 0px"
        }
        className="pointer-events-none object-cover transition duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-black/10" />
      <div
        className={`absolute inset-x-0 bottom-0 z-1 ${
          layout === "mobile" ? "px-5 pb-10 pt-16 text-center" : "px-5 pb-5 pt-16 text-left"
        }`}
      >
        <p
          className={`font-semibold tracking-tight text-white ${
            layout === "mobile" ? "text-[1.35rem] leading-snug" : "text-xl leading-snug"
          }`}
        >
          {item.title}
        </p>
        <p className="mt-1 text-sm text-white/85">{item.subtitle}</p>
      </div>
    </Link>
  );
}
