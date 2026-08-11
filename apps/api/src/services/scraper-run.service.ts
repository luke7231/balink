import type { ScraperRunSummary } from "@balink/domain";
import { ScraperRunRepository } from "@balink/db";

export class ScraperRunService {
  constructor(private readonly scraperRunRepository: ScraperRunRepository) {}

  async listRecent(limit = 20): Promise<ScraperRunSummary[]> {
    return this.scraperRunRepository.listRecent(limit);
  }

  async findLatest(): Promise<ScraperRunSummary | null> {
    return this.scraperRunRepository.findLatest();
  }
}
