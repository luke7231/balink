type Listener = () => void;

const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) listener();
}

function onPopState() {
  notify();
}

export function subscribeFilterUrl(listener: Listener): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("popstate", onPopState);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("popstate", onPopState);
    }
  };
}

export function getFilterSearch(): string {
  if (typeof window === "undefined") return "";
  return window.location.search;
}

/** Next 라우터 네비게이션 없이 쿼리만 바꿔 스크롤·페이지 리렌더를 피한다. */
export function setFilterUrl(href: string): void {
  if (typeof window === "undefined") return;
  const url = new URL(href, window.location.href);
  const next = `${url.pathname}${url.search}`;
  const current = `${window.location.pathname}${window.location.search}`;
  if (next === current) return;
  const { scrollX, scrollY } = window;
  window.history.pushState(window.history.state, "", next);
  notify();
  window.scrollTo(scrollX, scrollY);
}
