import { enqueueAnonymousDailyDigest } from "./anonymous-push.js";
import { config } from "./config.js";
import { runPushDispatchTick, runPushReceiptTick } from "./push-dispatcher.js";
import { runScraper } from "./scraper.js";
import { runSubstituteScraper } from "./substitute-scraper.js";

let running = false;

export function startScheduler(): void {
  if (config.scheduleEnabled) {
    const intervalMs = config.scheduleIntervalMinutes * 60_000;
    setInterval(() => {
      void tickScheduler();
    }, intervalMs).unref();
    void tickScheduler();
  }

  if (config.pushDispatchEnabled) {
    setInterval(() => {
      void runPushDispatchTick().catch((error) => {
        console.error("[scheduler] push dispatch failed", error);
      });
    }, config.pushDispatchIntervalSeconds * 1_000).unref();
    setInterval(() => {
      void runPushReceiptTick().catch((error) => {
        console.error("[scheduler] push receipt failed", error);
      });
    }, config.pushReceiptIntervalMinutes * 60_000).unref();
    void runPushDispatchTick();
    void runPushReceiptTick();
  }

  if (config.anonymousDailyDigestEnabled) {
    setInterval(() => {
      void enqueueAnonymousDailyDigest().catch((error) => {
        console.error("[scheduler] anonymous daily digest failed", error);
      });
    }, 5 * 60_000).unref();
    void enqueueAnonymousDailyDigest();
  }
}

async function tickScheduler(): Promise<void> {
  const date = todayKst();

  if (running) {
    console.info(`[scheduler] skipped ${date}: previous scraper run is still running`);
    return;
  }

  running = true;
  console.info(`[scheduler] started ${date}`);

  try {
    const result = await runScraper({ date });
    console.info(
      `[scheduler] completed ${date}: runId=${result.runId} collected=${result.collected} classified=${result.classified} imported=${result.imported}`,
    );
  } catch (error) {
    console.error(`[scheduler] job scraper failed ${date}`, error);
  }

  try {
    const substituteResult = await runSubstituteScraper();
    console.info(
      `[scheduler] substitute completed ${date}: runId=${substituteResult.runId} collected=${substituteResult.collected} normalized=${substituteResult.normalized} unchanged=${substituteResult.unchanged} llmFailed=${substituteResult.llmFailed}`,
    );
  } catch (error) {
    console.error(`[scheduler] substitute scraper failed ${date}`, error);
  } finally {
    running = false;
  }
}

function todayKst(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
