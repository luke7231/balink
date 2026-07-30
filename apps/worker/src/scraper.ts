import path from "node:path";
import fs from "node:fs/promises";
import type { Prisma } from "@black-swan/db";
import { ScraperRunRepository } from "@black-swan/db";
import type { LlmMode, SourceName } from "@black-swan/domain";
import { runCommand, type CommandResult } from "./command.js";
import { config } from "./config.js";
import { filterNewListings } from "./incremental-listings.js";
import { importClassifiedFile } from "./import-classified.js";
import { postProcessClassifiedFile } from "./post-process-classified.js";

const scraperRunRepository = new ScraperRunRepository();

export interface RunScraperOptions {
  source?: SourceName;
  date: string;
  llmMode?: LlmMode;
}

export interface RunScraperResult {
  runId: string;
  status: "success" | "failed";
  collected: number;
  classified: number;
  imported: number;
  logs: CommandResult[];
}

export async function runScraper(options: RunScraperOptions): Promise<RunScraperResult> {
  validateDate(options.date);

  const sources = options.source ? [options.source] : config.scheduleSources;
  const llmMode = options.llmMode || config.defaultLlmMode;
  const run = await scraperRunRepository.createRunning({
    source: options.source,
    targetDate: options.date,
    llmMode,
  });

  const logs: CommandResult[] = [];
  let collected = 0;
  let classified = 0;
  let imported = 0;

  try {
    for (const source of sources) {
      const result = await runSourcePipeline(source, options.date, llmMode);
      logs.push(...result.logs);
      collected += result.collected;
      classified += result.classified;
      imported += result.imported;
    }

    await scraperRunRepository.markSuccess(run.id, {
      collected,
      classified,
      imported,
      logs: logs as unknown as Prisma.InputJsonValue,
    });

    return { runId: run.id, status: "success", collected, classified, imported, logs };
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

async function runSourcePipeline(source: SourceName, date: string, llmMode: LlmMode) {
  await fs.mkdir(config.scraperWorkDir, { recursive: true });

  const listPath = path.join(config.scraperWorkDir, `${source}-employ-${date}.json`);
  const newListPath = path.join(config.scraperWorkDir, `${source}-employ-${date}-new.json`);
  const classifiedPath = path.join(config.scraperWorkDir, `${source}-employ-${date}-classified.json`);
  const logs: CommandResult[] = [];

  logs.push(
    await runCommand("pnpm", [
      "run",
      `collect:${source}`,
      "--",
      "--date",
      date,
      "--output",
      listPath,
    ]),
  );

  const listPayload = JSON.parse(await fs.readFile(listPath, "utf8")) as {
    listings: Array<Record<string, unknown>>;
  };
  const { newListings, existingCount } = await filterNewListings(source, listPayload.listings);

  if (newListings.length === 0) {
    return {
      logs,
      collected: listPayload.listings.length,
      classified: 0,
      imported: 0,
    };
  }

  await fs.writeFile(
    newListPath,
    `${JSON.stringify({ ...listPayload, listings: newListings }, null, 2)}\n`,
    "utf8",
  );

  logs.push(
    await runCommand("pnpm", [
      "run",
      `classify:${source}`,
      "--",
      "--input",
      newListPath,
      "--output",
      classifiedPath,
      "--llm",
      llmMode,
    ]),
  );

  const processed = await postProcessClassifiedFile(classifiedPath);
  logs.push({
    command: `post-process-classified ${classifiedPath}`,
    stdout: `Processed ${processed} new listings (${existingCount} existing skipped)`,
    stderr: "",
  });

  const classifiedPayload = JSON.parse(await fs.readFile(classifiedPath, "utf8")) as { total?: number };
  const importResult = await importClassifiedFile(classifiedPath);

  return {
    logs,
    collected: listPayload.listings.length,
    classified: classifiedPayload.total || newListings.length,
    imported: importResult.imported,
  };
}

function validateDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date: ${date}. Expected YYYY-MM-DD.`);
  }
}
