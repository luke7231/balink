import {
  DatabaseHealthRepository,
  JobPostRepository,
  ScraperRunRepository,
} from "@black-swan/db";
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
  const jobPostRepository = new JobPostRepository();
  const scraperRunRepository = new ScraperRunRepository();
  const databaseHealthRepository = new DatabaseHealthRepository();
  const scraperRun = new ScraperRunService(scraperRunRepository);
  const health = new HealthService(databaseHealthRepository, jobPostRepository, scraperRun);
  const jobPost = new JobPostService(jobPostRepository, {
    defaultPageSize: config.defaultPageSize,
    maxPageSize: config.maxPageSize,
  });

  return { health, jobPost, scraperRun };
}
