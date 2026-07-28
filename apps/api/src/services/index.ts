import { config } from "../config.js";
import { HealthService } from "./health.service.js";
import { JobPostService } from "./job-post.service.js";
import { ScraperRunService } from "./scraper-run.service.js";

export interface AppServices {
  health: HealthService;
  jobPost: JobPostService;
  scraperRun: ScraperRunService;
}

export function createServices(): AppServices {
  const scraperRun = new ScraperRunService();
  const health = new HealthService(scraperRun);
  const jobPost = new JobPostService({
    defaultPageSize: config.defaultPageSize,
    maxPageSize: config.maxPageSize,
  });

  return { health, jobPost, scraperRun };
}
