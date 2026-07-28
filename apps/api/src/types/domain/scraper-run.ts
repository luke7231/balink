import type { ScraperRun } from "@prisma/client";
import type { ScraperRunStatus, SourceName } from "./enums.js";

export interface ScraperRunSummary {
  id: string;
  source: SourceName | null;
  targetDate: string;
  llmMode: string;
  status: ScraperRunStatus;
  startedAt: Date;
  finishedAt: Date | null;
  collected: number;
  classified: number;
  imported: number;
  errorMessage: string | null;
}

export function toScraperRunSummary(run: ScraperRun): ScraperRunSummary {
  return {
    id: run.id,
    source: run.source as SourceName | null,
    targetDate: run.targetDate,
    llmMode: run.llmMode,
    status: run.status as ScraperRunStatus,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    collected: run.collected,
    classified: run.classified,
    imported: run.imported,
    errorMessage: run.errorMessage,
  };
}

export interface HealthStatus {
  ok: boolean;
  service: string;
  jobCount: number;
  latestScraperRun: ScraperRunSummary | null;
}
