import { prisma } from "../packages/db/dist/index.js";

const args = process.argv.slice(2);
const action = args.shift();
const reasonIndex = args.indexOf("--reason");
const reason = reasonIndex >= 0 ? args.splice(reasonIndex, 2)[1]?.trim() : undefined;
const apply = args.includes("--apply");
const ids = [...new Set(args.filter((arg) => arg !== "--apply"))];

try {
  if (!["hide", "show"].includes(action) || !ids.length || ids.some((id) => !/^c[a-z0-9]+$/.test(id)) || (action === "hide" && !reason)) {
    throw new Error('사용법: pnpm posts:visibility hide|show <ID...> [--reason "미노출 사유"] [--apply]');
  }
  await prisma.$transaction(async (tx) => {
    const [jobs, substitutes] = await Promise.all([
      tx.jobPost.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, hiddenAt: true, hiddenReason: true } }),
      tx.substitutePost.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, hiddenAt: true, hiddenReason: true } }),
    ]);
    for (const id of ids) {
      if ([...jobs, ...substitutes].filter((post) => post.id === id).length !== 1) {
        throw new Error(`ID를 유일하게 확인할 수 없습니다: ${id}. 전체 작업을 취소합니다.`);
      }
    }
    console.table([
      ...jobs.map((post) => ({ type: "job", ...post })),
      ...substitutes.map((post) => ({ type: "substitute", ...post })),
    ]);
    if (!apply) {
      console.info(`미리보기: ${ids.length}건 ${action}. 실제 적용은 --apply를 추가하세요.`);
      return;
    }
    const hiddenAt = new Date();
    for (const [model, posts] of [[tx.jobPost, jobs], [tx.substitutePost, substitutes]]) {
      // Repeating hide preserves the original timestamp and reason.
      await model.updateMany({
        where: { id: { in: posts.map((post) => post.id) }, ...(action === "hide" ? { hiddenAt: null } : {}) },
        data: action === "hide" ? { hiddenAt, hiddenReason: reason } : { hiddenAt: null, hiddenReason: null },
      });
    }
    console.info(`적용 완료: ${ids.length}건 ${action}`);
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : "미노출 처리 실패");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
