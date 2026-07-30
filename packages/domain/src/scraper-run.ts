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

export interface HealthStatus {
  ok: boolean;
  service: string;
  jobCount: number;
  substituteCount: number;
  latestScraperRun: ScraperRunSummary | null;
}
