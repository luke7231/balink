import {
  DatabaseHealthRepository,
  JobPostRepository,
  OrganizationRepository,
  ScraperRunRepository,
  SubstitutePostRepository,
} from "@balink/db";
import { config } from "../config.js";
import { HealthService } from "./health.service.js";
import { JobPostService } from "./job-post.service.js";
import { OrganizationService } from "./organization.service.js";
import { ScraperRunService } from "./scraper-run.service.js";
import { SubstitutePostService } from "./substitute-post.service.js";

export interface AppServices {
  health: HealthService;
  jobPost: JobPostService;
  organization: OrganizationService;
  substitutePost: SubstitutePostService;
  scraperRun: ScraperRunService;
}

export function createServices(): AppServices {
  const jobPostRepository = new JobPostRepository();
  const organizationRepository = new OrganizationRepository();
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
  const organization = new OrganizationService(organizationRepository);
  const substitutePost = new SubstitutePostService(substitutePostRepository, {
    defaultPageSize: config.defaultPageSize,
    maxPageSize: config.maxPageSize,
  });

  return { health, jobPost, organization, substitutePost, scraperRun };
}
