import {
  DatabaseHealthRepository,
  JobPostRepository,
  ScraperRunRepository,
  SubstitutePostRepository,
} from "@black-swan/db";
import { config } from "../config.js";
import { HealthService } from "./health.service.js";
import { JobPostService } from "./job-post.service.js";
import { ScraperRunService } from "./scraper-run.service.js";
import { SubstitutePostService } from "./substitute-post.service.js";

export interface AppServices {
  health: HealthService;
  jobPost: JobPostService;
  substitutePost: SubstitutePostService;
  scraperRun: ScraperRunService;
}

export function createServices(): AppServices {
  const jobPostRepository = new JobPostRepository();
  const substitutePostRepository = new SubstitutePostRepository();
  const scraperRunRepository = new ScraperRunRepository();
  const databaseHealthRepository = new DatabaseHealthRepository();
  const scraperRun = new ScraperRunService(scraperRunRepository);
  const health = new HealthService(
    databaseHealthRepository,
    jobPostRepository,
    substitutePostRepository,
    scraperRun,
  );
  const jobPost = new JobPostService(jobPostRepository, {
    defaultPageSize: config.defaultPageSize,
    maxPageSize: config.maxPageSize,
  });
  const substitutePost = new SubstitutePostService(substitutePostRepository, {
    defaultPageSize: config.defaultPageSize,
    maxPageSize: config.maxPageSize,
  });

  return { health, jobPost, substitutePost, scraperRun };
}
