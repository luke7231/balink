#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const dotenv = require("dotenv");
const {
  buildWorkingListUrl,
  dedupeByNo,
  fetchEucKrHtml,
  getTodayKstDate,
  parseWorkingListings,
} = require("./lib/balletmania-working.cjs");

dotenv.config();

const args = parseArgs(process.argv.slice(2));
const limit = Number(args.limit || 15);
const outputPath = args.output || path.join("data", `balletmania-working-${getTodayKstDate()}.json`);

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const todayKstDate = getTodayKstDate();
  const html = await fetchEucKrHtml(buildWorkingListUrl(1));
  const listings = dedupeByNo(parseWorkingListings(html, { todayKstDate })).slice(0, limit);

  const payload = {
    source: "balletmania",
    boardId: "working",
    sourceUrl: buildWorkingListUrl(1),
    fetchedAt: new Date().toISOString(),
    total: listings.length,
    listings,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`Saved ${listings.length} working listings to ${outputPath}`);
  for (const listing of listings) {
    console.log(`${listing.no}\t${listing.postedAtRaw}\t${listing.author}\t${listing.title}`);
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output") parsed.output = argv[++index];
    else if (arg === "--limit") parsed.limit = argv[++index];
    else if (arg === "--help" || arg === "-h") {
      console.log([
        "Usage: pnpm run collect:balletmania-working -- --limit 15",
        "",
        "Options:",
        "  --limit NUMBER   수집할 최신 일반글 수 (default: 15)",
        "  --output PATH    JSON 저장 경로",
      ].join("\n"));
      process.exit(0);
    }
  }
  return parsed;
}
