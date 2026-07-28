import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

for (const envPath of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")]) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/black_swan";
const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
