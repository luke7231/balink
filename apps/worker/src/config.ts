import "dotenv/config";
import type { LlmMode, SourceName } from "@balink/domain";

export type { LlmMode, SourceName };

export const config = {
  port: Number(process.env.WORKER_PORT || 4300),
  defaultLlmMode: (process.env.DEFAULT_LLM_MODE || "off") as LlmMode,
  substituteLlmMode: (process.env.SUBSTITUTE_LLM_MODE || "all") as LlmMode,
  scheduleEnabled: process.env.SCRAPER_SCHEDULE_ENABLED === "true",
  scheduleIntervalMinutes: parsePositiveNumber(process.env.SCRAPER_INTERVAL_MINUTES, 5),
  scheduleSources: parseSources(process.env.SCRAPER_SOURCES || "balletmania,esangdance"),
  scraperWorkDir: process.env.SCRAPER_WORK_DIR || "/tmp/balink-scraper",
  expoAccessToken: process.env.EXPO_ACCESS_TOKEN || "",
  pushDispatchEnabled: process.env.PUSH_DISPATCH_ENABLED === "true",
  pushDispatchIntervalSeconds: parsePositiveNumber(
    process.env.PUSH_DISPATCH_INTERVAL_SECONDS,
    30,
  ),
  pushReceiptIntervalMinutes: parsePositiveNumber(
    process.env.PUSH_RECEIPT_INTERVAL_MINUTES,
    15,
  ),
  pushDispatchBatchSize: parsePositiveNumber(process.env.PUSH_DISPATCH_BATCH_SIZE, 100),
  pushReceiptBatchSize: parsePositiveNumber(process.env.PUSH_RECEIPT_BATCH_SIZE, 300),
  pushMaxAttempts: parsePositiveNumber(process.env.PUSH_MAX_ATTEMPTS, 5),
  anonymousUrgentPushEnabled: process.env.ANONYMOUS_URGENT_PUSH_ENABLED !== "false",
  anonymousDailyDigestEnabled: process.env.ANONYMOUS_DAILY_DIGEST_ENABLED !== "false",
  anonymousDailyDigestHourKst: parseHour(
    process.env.ANONYMOUS_DAILY_DIGEST_HOUR_KST,
    19,
  ),
};

function parseSources(value: string): SourceName[] {
  return value
    .split(",")
    .map((source) => source.trim())
    .filter((source): source is SourceName => source === "balletmania" || source === "esangdance");
}

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
}

function parseHour(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 23 ? parsed : fallback;
}
