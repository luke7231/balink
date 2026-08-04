import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

for (const envPath of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")]) {
  if (existsSync(envPath)) {
    loadEnv({ path: envPath });
    break;
  }
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || process.env.API_PORT || 3000),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  defaultPageSize: parsePositiveNumber(process.env.API_DEFAULT_PAGE_SIZE, 20),
  maxPageSize: parsePositiveNumber(process.env.API_MAX_PAGE_SIZE, 100),
};

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
}
