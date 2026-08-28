"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { OriginalSourceLink } from "@/components/original-source-link";
import type { HomeBannerItem } from "@/lib/home-banners";
import { isSafeHttpUrl } from "@/lib/native-shell";

const AUTO_PLAY_MS = 4000;
const RESUME_AUTO_PLAY_MS = 5500;
const DESKTOP_PAGE_SIZE = 3;
/** 모바일: 중앙 폭 + 좌우 peek (스케일과 맞춤) */
const MOBILE_PAGE_RATIO = 0.84;
const GAP_PX = 4;
/** 스크롤이 이 시간 동안 멈춰 있으면 정착으로 판단 */
const SETTLE_MS = 160;
/** 가운데 1, 양옆은 이 비율까지 줄어듦 */
const SIDE_SCALE = 0.88;
const SIDE_OPACITY = 0.78;

type TrackPage = {
  key: string;
  logicalIndex: number;
  items: HomeBannerItem[];
  clone?: "start" | "end";
};

export function HomeBanner({ items }: { items: HomeBannerItem[] }) {
  const [variant, setVariant] = useState<"mobile" | "desktop" | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => setVariant(media.matches ? "desktop" : "mobile");
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mb-6" aria-label="추천 배너">
      {variant == null ? (
        <BannerShellPlaceholder layout="mobile" bleed />
      ) : (
        <BannerCarousel
          items={items}
          pageSize={variant === "mobile" ? 1 : DESKTOP_PAGE_SIZE}
          variant={variant}
        />
      )}
    </section>
  );
}

function BannerShellPlaceholder({
  layout,
  bleed = false,
}: {
  layout: "mobile" | "desktop";
  /** 바깥에 이미 -mx-4 가 있을 때 true */
  bleed?: boolean;
}) {
  if (layout === "desktop") {
    return (
      <div className="grid grid-cols-3 gap-2 py-1" aria-hidden>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="motion-shimmer aspect-square w-full rounded-2xl bg-zinc-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`${bleed ? "-mx-4 " : ""}px-[8%] py-2`} aria-hidden>
      <div className="motion-shimmer aspect-square w-full rounded-[1.35rem] bg-zinc-100" />
    </div>
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
  const pageElsRef = useRef<Array<HTMLDivElement | null>>([]);
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
  const [imagesReady, setImagesReady] = useState(false);
  const [positioned, setPositioned] = useState(false);
  const loadedSrcsRef = useRef(new Set<string>());
  const imagesReadyRef = useRef(false);

  const uniqueSrcs = useMemo(
    () => [...new Set(items.map((item) => item.imageSrc))],
    [items],
  );

  /** 이미지 로드 + 1번 슬라이드 스크롤 안착 둘 다 끝나야 공개 (콜드스타트 클론 플래시 방지) */
  const reveal = imagesReady && positioned;

  function markImageReady(src: string) {
    if (imagesReadyRef.current) return;
    loadedSrcsRef.current.add(src);
    if (!uniqueSrcs.every((item) => loadedSrcsRef.current.has(item))) return;
    imagesReadyRef.current = true;
    setImagesReady(true);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (imagesReadyRef.current) return;
      imagesReadyRef.current = true;
      setImagesReady(true);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, []);

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
    updateFocusScales();
  }

  /** 올리브영식: 가운데 크게, 양옆 peek는 작게 */
  function updateFocusScales() {
    if (!isMobile) return;
    const scroller = scrollerRef.current;
    const stridePx = stride();
    if (!scroller || stridePx <= 0) return;

    const centerX = scroller.scrollLeft + scroller.clientWidth / 2;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (const el of pageElsRef.current) {
      if (!el) continue;
      if (reduceMotion) {
        el.style.transform = "scale(1)";
        el.style.opacity = "1";
        continue;
      }
      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const progress = Math.min(1, Math.abs(elCenter - centerX) / stridePx);
      const scale = 1 - progress * (1 - SIDE_SCALE);
      const opacity = 1 - progress * (1 - SIDE_OPACITY);
      el.style.transform = `scale(${scale})`;
      el.style.opacity = String(opacity);
    }
  }

  function scrollToTrackIndex(trackIndex: number, behavior: ScrollBehavior) {
    const scroller = scrollerRef.current;
    if (!scroller || pageWidthRef.current <= 0) return;

    trackIndexRef.current = trackIndex;
    const logical = trackRef.current[trackIndex]?.logicalIndex ?? 0;
    setPageIndex((prev) => (prev === logical ? prev : logical));

    const left = trackIndex * stride();
    // 초기 점프는 scrollTo 애니메이션/비동기보다 scrollLeft 가 더 확실함
    if (behavior === "auto") {
      scroller.scrollLeft = left;
      updateFocusScales();
    } else {
      scroller.scrollTo({ left, behavior });
      // smooth 중에는 scroll 감시가 스케일을 갱신
    }
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
      } else {
        updateFocusScales();
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
    setPositioned(false);

    const snapToStart = () => {
      if (pageWidthRef.current <= 0) return;
      const startIndex = loop ? 1 : 0;
      scrollToTrackIndex(startIndex, "auto");
      if (!didInitRef.current) {
        didInitRef.current = true;
        setPositioned(true);
      }
    };

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

      // 레이아웃이 잡히는 즉시 1번으로 맞춤 — rAF 두 번 기다리면 클론(마지막 장)이 먼저 보임
      if (!didInitRef.current) {
        snapToStart();
        requestAnimationFrame(() => {
          snapToStart();
          updateFocusScales();
        });
      } else if (changed) {
        scrollToTrackIndex(trackIndexRef.current, "auto");
        updateFocusScales();
      } else {
        updateFocusScales();
      }
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
    if (!reveal || !autoPlayEnabled || !loop || layout.pageWidth <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      if (interactingRef.current) return;
      scrollToTrackIndex(trackIndexRef.current + 1, "smooth");
      window.setTimeout(startWatch, 450);
    }, AUTO_PLAY_MS);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal, autoPlayEnabled, loop, pageCount, layout.pageWidth]);

  if (pageCount === 0) return null;

  const { pageWidth: pageWidthPx, pad: padPx } = layout;

  const beginInteraction = () => {
    if (!reveal) return;
    interactingRef.current = true;
    pauseAutoPlay();
    startWatch();
  };

  const finishInteraction = () => {
    interactingRef.current = false;
    startWatch();
  };

  return (
    <div ref={rootRef} className="relative -mx-4 min-w-0 md:mx-0">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 transition-opacity duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          reveal ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden={reveal}
      >
        <BannerShellPlaceholder layout={variant} />
      </div>

      <div
        className={`transition-[opacity,transform] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          reveal ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2.5 opacity-0"
        }`}
        aria-busy={!reveal}
      >
        <div
          ref={scrollerRef}
          className="relative flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-none py-2"
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
          {track.map((page, trackIndex) => (
            <div
              key={page.key}
              ref={(node) => {
                pageElsRef.current[trackIndex] = node;
              }}
              className={
                isMobile
                  ? "shrink-0 origin-center will-change-transform"
                  : "grid shrink-0 grid-cols-3 gap-2"
              }
              style={{
                flex: pageWidthPx > 0 ? `0 0 ${pageWidthPx}px` : isMobile ? "0 0 84%" : "0 0 100%",
                width: pageWidthPx > 0 ? pageWidthPx : isMobile ? "84%" : "100%",
                scrollSnapAlign: "center",
                scrollSnapStop: "always",
              }}
            >
              {page.items.map((item) => (
                <BannerCard
                  key={`${page.key}-${item.id}`}
                  item={item}
                  // 게이트 동안 고유 이미지를 모두 우선 로드
                  priority={!page.clone}
                  layout={variant}
                  onReady={markImageReady}
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
                ? "pointer-events-none absolute bottom-7 right-[calc(8%+28px)] z-10"
                : "mt-3 flex justify-end"
            }
          >
            <span
              className={
                isMobile
                  ? "inline-flex items-center text-[11px] font-semibold tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
                  : "inline-flex items-center text-[11px] font-semibold tracking-wide text-muted-foreground"
              }
            >
              {String(pageIndex + 1).padStart(2, "0")}
              <span className="mx-1.5 opacity-50">|</span>
              {String(pageCount).padStart(2, "0")}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BannerCard({
  item,
  priority,
  layout,
  onReady,
}: {
  item: HomeBannerItem;
  priority?: boolean;
  layout: "mobile" | "desktop";
  onReady: (src: string) => void;
}) {
  const reportedRef = useRef(false);
  const imageRef = useRef<HTMLImageElement>(null);

  function reportReady() {
    if (reportedRef.current) return;
    reportedRef.current = true;
    onReady(item.imageSrc);
  }

  useEffect(() => {
    if (imageRef.current?.complete) reportReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.imageSrc]);

  const className = `group relative block aspect-square overflow-hidden bg-zinc-100 shadow-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-400 ${
    layout === "mobile" ? "rounded-[1.35rem]" : "rounded-2xl"
  }`;

  const content = (
    <>
      <Image
        ref={imageRef}
        src={item.imageSrc}
        alt={item.imageAlt}
        fill
        priority={priority}
        draggable={false}
        sizes={
          layout === "mobile"
            ? "(max-width: 768px) 84vw, 0px"
            : "(min-width: 768px) 33vw, 0px"
        }
        onLoad={reportReady}
        onError={reportReady}
        className="pointer-events-none object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 z-1 px-5 pb-5 pt-16 text-left">
        <p
          className={`font-semibold tracking-tight text-white ${
            layout === "mobile" ? "text-[1.35rem] leading-snug" : "text-xl leading-snug"
          }`}
        >
          {item.title}
        </p>
        <p className="mt-1 text-sm text-white/85">{item.subtitle}</p>
      </div>
    </>
  );

  if (isSafeHttpUrl(item.href)) {
    return (
      <OriginalSourceLink
        href={item.href}
        title={item.browserTitle ?? item.title}
        className={className}
      >
        {content}
      </OriginalSourceLink>
    );
  }

  return (
    <Link href={item.href} draggable={false} className={className}>
      {content}
    </Link>
  );
}
