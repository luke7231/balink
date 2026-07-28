import type { HealthStatus } from "@black-swan/domain";
import { DatabaseHealthRepository, JobPostRepository } from "@black-swan/db";
import type { ScraperRunService } from "./scraper-run.service.js";

export class HealthService {
  constructor(
    private readonly databaseHealthRepository: DatabaseHealthRepository,
    private readonly jobPostRepository: JobPostRepository,
    private readonly scraperRunService: ScraperRunService,
  ) {}

  async getStatus(serviceName: string): Promise<HealthStatus> {
    await this.databaseHealthRepository.ping();

    const [jobCount, latestScraperRun] = await Promise.all([
      this.jobPostRepository.countBalletPosts(),
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
