import fs from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@black-swan/db";
import { ScraperRunRepository } from "@black-swan/db";
import type { LlmMode } from "@black-swan/domain";
import { runCommand, type CommandResult } from "./command.js";
import { config } from "./config.js";
import { importSubstituteClassifiedFile } from "./substitute-import.js";
import { refreshSubstituteLifecycle } from "./substitute-lifecycle.js";

const scraperRunRepository = new ScraperRunRepository();

export interface RunSubstituteScraperOptions {
  llmMode?: LlmMode;
  limit?: number;
}

export interface RunSubstituteScraperResult {
  runId: string;
  status: "success" | "failed";
  collected: number;
  classified: number;
  imported: number;
  skipped: number;
  logs: CommandResult[];
}

export async function runSubstituteScraper(
  options: RunSubstituteScraperOptions = {},
): Promise<RunSubstituteScraperResult> {
  const llmMode = options.llmMode || config.defaultLlmMode;
  const limit = options.limit ?? 15;
  const date = getTodayKstDate();
  const run = await scraperRunRepository.createRunning({
    targetDate: date,
    llmMode,
    source: "balletmania",
  });

  const logs: CommandResult[] = [];
  let collected = 0;
  let classified = 0;
  let imported = 0;
  let skipped = 0;

  try {
    await fs.mkdir(config.scraperWorkDir, { recursive: true });

    const listPath = path.join(config.scraperWorkDir, `balletmania-working-${date}.json`);
    const classifiedPath = path.join(config.scraperWorkDir, `balletmania-working-${date}-classified.json`);

    logs.push(
      await runCommand("pnpm", [
        "run",
        "collect:balletmania-working",
        "--",
        "--limit",
        String(limit),
        "--output",
        listPath,
      ]),
    );

    const listPayload = JSON.parse(await fs.readFile(listPath, "utf8")) as { listings: unknown[] };
    collected = listPayload.listings.length;

    logs.push(
      await runCommand("pnpm", [
        "run",
        "classify:balletmania-working",
        "--",
        "--input",
        listPath,
        "--output",
        classifiedPath,
        "--llm",
        llmMode,
      ]),
    );

    const classifiedPayload = JSON.parse(await fs.readFile(classifiedPath, "utf8")) as { total?: number };
    classified = classifiedPayload.total ?? collected;

    const importResult = await importSubstituteClassifiedFile(classifiedPath);
    imported = importResult.imported;
    skipped = importResult.skipped;

    const lifecycle = await refreshSubstituteLifecycle();
    logs.push({
      command: "substitute-lifecycle",
      stdout: `Expired ${lifecycle.expired}, deleted ${lifecycle.deleted}`,
      stderr: "",
    });

    await scraperRunRepository.markSuccess(run.id, {
      collected,
      classified,
      imported,
      logs: logs as unknown as Prisma.InputJsonValue,
    });

    return { runId: run.id, status: "success", collected, classified, imported, skipped, logs };
  } catch (error) {
    await scraperRunRepository.markFailed(run.id, {
      collected,
      classified,
      imported,
      errorMessage: error instanceof Error ? error.message : String(error),
      logs: logs as unknown as Prisma.InputJsonValue,
    });
    throw error;
  }
}

function getTodayKstDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
