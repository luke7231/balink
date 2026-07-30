import { pathToFileURL } from "node:url";
import { runSubstituteScraper } from "./substitute-scraper.js";

async function main() {
  const result = await runSubstituteScraper();
  console.log(
    `[backfill-substitutes] complete: collected=${result.collected} imported=${result.imported} skipped=${result.skipped}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
