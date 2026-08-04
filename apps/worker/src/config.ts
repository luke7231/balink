import "dotenv/config";
import type { LlmMode, SourceName } from "@black-swan/domain";

export type { LlmMode, SourceName };

export const config = {
  port: Number(process.env.WORKER_PORT || 4300),
  defaultLlmMode: (process.env.DEFAULT_LLM_MODE || "off") as LlmMode,
  substituteLlmMode: (process.env.SUBSTITUTE_LLM_MODE || "all") as LlmMode,
  scheduleEnabled: process.env.SCRAPER_SCHEDULE_ENABLED === "true",
  scheduleIntervalMinutes: parsePositiveNumber(process.env.SCRAPER_INTERVAL_MINUTES, 5),
  scheduleSources: parseSources(process.env.SCRAPER_SOURCES || "balletmania,esangdance"),
  scraperWorkDir: process.env.SCRAPER_WORK_DIR || "/tmp/black-swan-scraper",
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
