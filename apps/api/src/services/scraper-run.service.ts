import { prisma } from "@black-swan/db";
import { toScraperRunSummary, type ScraperRunSummary } from "../types/domain/scraper-run.js";

export class ScraperRunService {
  async listRecent(limit = 20): Promise<ScraperRunSummary[]> {
    const runs = await prisma.scraperRun.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
    });

    return runs.map(toScraperRunSummary);
  }

  async findLatest(): Promise<ScraperRunSummary | null> {
    const run = await prisma.scraperRun.findFirst({
      orderBy: { startedAt: "desc" },
    });

    return run ? toScraperRunSummary(run) : null;
  }
}
