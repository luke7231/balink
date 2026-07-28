import { prisma } from "@black-swan/db";
import type { HealthStatus } from "../types/domain/scraper-run.js";
import type { ScraperRunService } from "./scraper-run.service.js";

export class HealthService {
  constructor(private readonly scraperRunService: ScraperRunService) {}

  async getStatus(serviceName: string): Promise<HealthStatus> {
    await prisma.$queryRaw`SELECT 1`;

    const [jobCount, latestScraperRun] = await Promise.all([
      prisma.jobPost.count({ where: { isBallet: true } }),
      this.scraperRunService.findLatest(),
    ]);

    return {
      ok: true,
      service: serviceName,
      jobCount,
      latestScraperRun,
    };
  }
}
