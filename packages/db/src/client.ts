import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Local/dev: load repo `.env`. On Vercel, platform env is already injected.
if (!process.env.VERCEL) {
  for (const envPath of [
    resolve(/*turbopackIgnore: true*/ process.cwd(), ".env"),
    resolve(/*turbopackIgnore: true*/ process.cwd(), "../../.env"),
  ]) {
    if (existsSync(envPath)) {
      loadEnv({ path: envPath });
      break;
    }
  }
}

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/balink";

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
