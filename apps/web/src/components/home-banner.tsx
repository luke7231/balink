"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { HomeBannerItem } from "@/lib/home-banners";

const AUTO_PLAY_MS = 4000;
const RESUME_AUTO_PLAY_MS = 5500;
const DESKTOP_PAGE_SIZE = 3;
/** 모바일: 중앙 82%, 좌우 피크 9% → 시작 시 6 | 1 | 2 */
const MOBILE_PAGE_RATIO = 0.82;
const GAP_PX = 12;
/** 스크롤이 이 시간 동안 멈춰 있으면 정착으로 판단 */
const SETTLE_MS = 160;

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
    ...pages.map((pageItems, index) => ({
      key: `page-${index}`,
      logicalIndex: index,
      items: pageItems,
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

  const isMobile = variant === "mobile";

  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackIndexRef = useRef(loop ? 1 : 0);
  const pageWidthRef = useRef(0);
  const didInitRef = useRef(false);
  const interactingRef = useRef(false);

  const watchRafRef = useRef<number | null>(null);
  const lastLeftRef = useRef(Number.NaN);
  const stableSinceRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trackRef = useRef(track);
  const pageCountRef = useRef(pageCount);
  const loopRef = useRef(loop);

  const [pageIndex, setPageIndex] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [layout, setLayout] = useState({ pageWidth: 0, pad: 0 });

  // 스크롤 감시 루프가 최신 트랙 정보를 읽도록 렌더 후 동기화한다
  useEffect(() => {
    trackRef.current = track;
    pageCountRef.current = pageCount;
    loopRef.current = loop;
  });

  function pauseAutoPlay() {
    setAutoPlayEnabled(false);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setAutoPlayEnabled(true), RESUME_AUTO_PLAY_MS);
  }

  function stride() {
    return pageWidthRef.current + GAP_PX;
  }

  function indexFromScrollLeft() {
    const scroller = scrollerRef.current;
    if (!scroller || pageWidthRef.current <= 0) return trackIndexRef.current;
    const maxIndex = Math.max(0, trackRef.current.length - 1);
    return Math.max(0, Math.min(maxIndex, Math.round(scroller.scrollLeft / stride())));
  }

  function syncIndicator() {
    const next = indexFromScrollLeft();
    trackIndexRef.current = next;
    const logical = trackRef.current[next]?.logicalIndex ?? 0;
    setPageIndex((prev) => (prev === logical ? prev : logical));
  }

  function scrollToTrackIndex(trackIndex: number, behavior: ScrollBehavior) {
    const scroller = scrollerRef.current;
    if (!scroller || pageWidthRef.current <= 0) return;

    trackIndexRef.current = trackIndex;
    const logical = trackRef.current[trackIndex]?.logicalIndex ?? 0;
    setPageIndex((prev) => (prev === logical ? prev : logical));

    // 좌우 패딩이 (viewport - page)/2 이므로 index * stride 가 곧 중앙 정렬 위치
    scroller.scrollTo({ left: trackIndex * stride(), behavior });
  }

  /** 클론 페이지에 멈추면 대응하는 실제 페이지로 순간 이동 */
  function normalizeLoopPosition() {
    if (!loopRef.current) return;
    const count = pageCountRef.current;
    const index = trackIndexRef.current;
    if (index <= 0) {
      scrollToTrackIndex(count, "auto");
      return;
    }
    if (index >= count + 1) {
      scrollToTrackIndex(1, "auto");
    }
  }

  /**
   * iOS WKWebView는 관성 스크롤 중 scroll 이벤트를 건너뛰는 경우가 있어
   * 위치가 멈출 때까지 rAF로 직접 관찰한다.
   */
  function startWatch() {
    if (watchRafRef.current != null) return;

    lastLeftRef.current = Number.NaN;
    stableSinceRef.current = performance.now();

    const tick = () => {
      const scroller = scrollerRef.current;
      if (!scroller) {
        watchRafRef.current = null;
        return;
      }

      const left = scroller.scrollLeft;
      const now = performance.now();

      if (Number.isNaN(lastLeftRef.current) || Math.abs(left - lastLeftRef.current) > 0.5) {
        lastLeftRef.current = left;
        stableSinceRef.current = now;
        syncIndicator();
      }

      const settled = now - stableSinceRef.current > SETTLE_MS;
      if (settled && !interactingRef.current) {
        watchRafRef.current = null;
        syncIndicator();
        normalizeLoopPosition();
        return;
      }

      watchRafRef.current = requestAnimationFrame(tick);
    };

    watchRafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (watchRafRef.current != null) cancelAnimationFrame(watchRafRef.current);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const scroller = scrollerRef.current;
    if (!root || !scroller) return;

    didInitRef.current = false;

    const measure = () => {
      const viewportWidth = scroller.clientWidth || root.clientWidth;
      if (viewportWidth <= 0) return;

      const nextPageWidth = isMobile
        ? Math.round(viewportWidth * MOBILE_PAGE_RATIO)
        : viewportWidth;
      const nextPad = isMobile ? Math.max(0, (viewportWidth - nextPageWidth) / 2) : 0;
      const changed = nextPageWidth !== pageWidthRef.current;

      pageWidthRef.current = nextPageWidth;
      if (changed) setLayout({ pageWidth: nextPageWidth, pad: nextPad });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!didInitRef.current) {
            didInitRef.current = true;
            scrollToTrackIndex(loop ? 1 : 0, "auto");
          } else if (changed) {
            scrollToTrackIndex(trackIndexRef.current, "auto");
          }
        });
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(scroller);

    const onScroll = () => {
      syncIndicator();
      startWatch();
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, pageCount, loop]);

  useEffect(() => {
    if (!autoPlayEnabled || !loop || layout.pageWidth <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      if (interactingRef.current) return;
      scrollToTrackIndex(trackIndexRef.current + 1, "smooth");
      window.setTimeout(startWatch, 450);
    }, AUTO_PLAY_MS);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayEnabled, loop, pageCount, layout.pageWidth]);

  if (pageCount === 0) return null;

  const { pageWidth: pageWidthPx, pad: padPx } = layout;

  const beginInteraction = () => {
    interactingRef.current = true;
    pauseAutoPlay();
    startWatch();
  };

  const finishInteraction = () => {
    interactingRef.current = false;
    startWatch();
  };

  return (
    <div
      ref={rootRef}
      className={
        isMobile
          ? "relative -mx-4 min-w-0 md:hidden"
          : "relative hidden min-w-0 max-w-full md:block"
      }
    >
      <div
        ref={scrollerRef}
        className="relative flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-none py-1"
        style={{
          gap: GAP_PX,
          ...(pageWidthPx > 0 && isMobile
            ? { paddingInline: padPx, scrollPaddingInline: padPx }
            : {}),
        }}
        onTouchStart={beginInteraction}
        onTouchMove={startWatch}
        onTouchEnd={finishInteraction}
        onTouchCancel={finishInteraction}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") beginInteraction();
        }}
        onPointerUp={(event) => {
          if (event.pointerType === "mouse") finishInteraction();
        }}
        onPointerCancel={(event) => {
          if (event.pointerType === "mouse") finishInteraction();
        }}
      >
        {track.map((page) => (
          <div
            key={page.key}
            className={
              isMobile ? "shrink-0" : "grid shrink-0 grid-cols-3 gap-3"
            }
            style={{
              flex: pageWidthPx > 0 ? `0 0 ${pageWidthPx}px` : isMobile ? "0 0 82%" : "0 0 100%",
              width: pageWidthPx > 0 ? pageWidthPx : isMobile ? "82%" : "100%",
              scrollSnapAlign: "center",
              scrollSnapStop: "always",
            }}
          >
            {page.items.map((item, indexInPage) => (
              <BannerCard
                key={`${page.key}-${item.id}`}
                item={item}
                priority={!page.clone && page.logicalIndex === 0 && indexInPage === 0}
                layout={variant}
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
}: {
  item: HomeBannerItem;
  priority?: boolean;
  layout: "mobile" | "desktop";
}) {
  return (
    <Link
      href={item.href}
      draggable={false}
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
