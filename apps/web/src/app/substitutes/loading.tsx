import { SiteHeader } from "@/components/site-header";
import { SubstitutesFallback } from "@/components/substitutes-fallback";

/** RSC 대기·전환 중에도 홈처럼 셸이 바로 보이게 */
export default function SubstitutesLoading() {
  return (
    <div className="home-surface min-h-full min-w-0 max-w-full overflow-x-clip page-bg">
      <SiteHeader />
      <main className="mx-auto min-w-0 max-w-5xl px-4 py-8">
        <SubstitutesFallback />
      </main>
    </div>
  );
}
