import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type TabPagerTransitionContextValue = {
  animationEnabled: boolean;
  /** 두 칸 이상 떨어진 탭으로 갈 때 페이저 슬라이드를 잠시 끈다 */
  runWithoutPagerAnimation: (action: () => void) => void;
};

const TabPagerTransitionContext = createContext<TabPagerTransitionContextValue>({
  animationEnabled: true,
  runWithoutPagerAnimation: (action) => action(),
});

export function TabPagerTransitionProvider({ children }: { children: ReactNode }) {
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runWithoutPagerAnimation = useCallback((action: () => void) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setAnimationEnabled(false);
    // 옵션이 반영된 다음 프레임에 이동해야 중간 탭을 훑지 않는다
    requestAnimationFrame(() => {
      action();
      resetTimerRef.current = setTimeout(() => {
        setAnimationEnabled(true);
        resetTimerRef.current = null;
      }, 50);
    });
  }, []);

  const value = useMemo(
    () => ({ animationEnabled, runWithoutPagerAnimation }),
    [animationEnabled, runWithoutPagerAnimation],
  );

  return (
    <TabPagerTransitionContext.Provider value={value}>{children}</TabPagerTransitionContext.Provider>
  );
}

export function useTabPagerTransition() {
  return useContext(TabPagerTransitionContext);
}
