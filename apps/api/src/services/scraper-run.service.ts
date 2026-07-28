import type { ScraperRunSummary } from "@black-swan/domain";
import { ScraperRunRepository } from "@black-swan/db";

export class ScraperRunService {
  constructor(private readonly scraperRunRepository: ScraperRunRepository) {}

  async listRecent(limit = 20): Promise<ScraperRunSummary[]> {
    return this.scraperRunRepository.listRecent(limit);
  }

  async findLatest(): Promise<ScraperRunSummary | null> {
    return this.scraperRunRepository.findLatest();
  }
}
