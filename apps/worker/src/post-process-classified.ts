import fs from "node:fs/promises";
import type { ListingEnrichment } from "@balink/domain";
import { enrichListing } from "./llm-formatter.js";

export interface ClassifiedListing {
  sourcePostId: string;
  raw: Record<string, unknown>;
  classification: Record<string, unknown>;
  enrichment?: ListingEnrichment;
}

export interface ClassifiedPayload {
  source: string;
  listings: ClassifiedListing[];
}

export async function postProcessClassifiedFile(filePath: string): Promise<number> {
  const payload = JSON.parse(await fs.readFile(filePath, "utf8")) as ClassifiedPayload;
  let processed = 0;

  for (const listing of payload.listings) {
    listing.enrichment = await enrichListing({
      raw: listing.raw,
    });
    processed += 1;
    await sleep(200);
  }

  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return processed;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
