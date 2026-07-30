import type { HealthStatus } from "@black-swan/domain";
import { DatabaseHealthRepository, JobPostRepository, SubstitutePostRepository } from "@black-swan/db";
import type { ScraperRunService } from "./scraper-run.service.js";

export class HealthService {
  constructor(
    private readonly databaseHealthRepository: DatabaseHealthRepository,
    private readonly jobPostRepository: JobPostRepository,
    private readonly substitutePostRepository: SubstitutePostRepository,
    private readonly scraperRunService: ScraperRunService,
  ) {}

  async getStatus(serviceName: string): Promise<HealthStatus> {
    await this.databaseHealthRepository.ping();

    const [jobCount, substituteCount, latestScraperRun] = await Promise.all([
      this.jobPostRepository.countBalletPosts(),
      this.substitutePostRepository.countOpenPosts(),
      this.scraperRunService.findLatest(),
    ]);

    return {
      ok: true,
      service: serviceName,
      jobCount,
      substituteCount,
      latestScraperRun,
    };
  }
}
