#!/usr/bin/env node

const { createHash } = require("node:crypto");
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const workerRoot = path.resolve(__dirname, "..");
const args = parseArgs(process.argv.slice(2));
const sources = args.source ? [args.source] : ["balletmania", "esangdance"];

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

async function main() {
  validateSources(sources);

  const { prisma } = await import("@balink/db");
  const rows = await prisma.sourcePost.findMany({
    where: { source: { in: sources } },
    orderBy: [{ source: "asc" }, { postedAt: "asc" }],
    include: {
      jobPostSources: {
        select: {
          jobPost: {
            select: {
              id: true,
              normalizedJson: true,
            },
          },
        },
      },
    },
  });

  if (args.limit) rows.splice(Number(args.limit));

  const totals = Object.fromEntries(sources.map((source) => [source, rows.filter((row) => row.source === source).length]));
  console.log(`[backfill] stored posts: ${JSON.stringify(totals)}`);

  if (args.dryRun) {
    console.log("[backfill] dry run complete; no external requests or database updates were made.");
    await prisma.$disconnect();
    return;
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "balink-description-backfill-"));
  const summary = { updated: 0, skipped: 0 };

  try {
    for (const source of sources) {
      const sourceRows = rows.filter((row) => row.source === source);
      if (!sourceRows.length) continue;

      const classifiedItems = await classifyExistingSourcePosts(source, sourceRows, tempDir);
      const rowsBySourcePostId = new Map(sourceRows.map((row) => [row.sourcePostId, row]));

      for (const item of classifiedItems) {
        const sourcePost = rowsBySourcePostId.get(item.sourcePostId);
        const description = stringValue(item.raw?.detailText);

        if (!sourcePost || !description) {
          summary.skipped += 1;
          continue;
        }

        const rawJson = {
          ...asRecord(sourcePost.rawJson),
          ...asRecord(item.raw),
        };
        const contentHash = hashContent(
          [source, stringValue(item.raw?.title) || sourcePost.title, description, stringValue(item.raw?.postedDate)].join("\n"),
        );

        await prisma.$transaction(async (tx) => {
          await tx.sourcePost.update({
            where: { id: sourcePost.id },
            data: {
              rawJson,
              contentHash,
              fetchedAt: new Date(),
            },
          });

          for (const link of sourcePost.jobPostSources) {
            const normalizedJson = {
              ...asRecord(link.jobPost.normalizedJson),
              description,
              raw: rawJson,
            };

            await tx.jobPost.update({
              where: { id: link.jobPost.id },
              data: {
                description,
                contentHash,
                normalizedJson,
              },
            });
          }
        });

        summary.updated += 1;
      }
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
    await prisma.$disconnect();
  }

  console.log(`[backfill] complete: updated=${summary.updated} skipped=${summary.skipped}`);
}

async function classifyExistingSourcePosts(source, rows, tempDir) {
  const inputPath = path.join(tempDir, `${source}.json`);
  const outputPath = path.join(tempDir, `${source}-classified.json`);
  const payload = {
    source,
    listings: rows.map((row) => toListing(source, row)),
  };

  await fs.writeFile(inputPath, JSON.stringify(payload), "utf8");
  await run(process.execPath, [
    `scripts/classify-${source}-employ-details.cjs`,
    "--input",
    inputPath,
    "--output",
    outputPath,
    "--llm",
    "off",
  ]);

  const result = JSON.parse(await fs.readFile(outputPath, "utf8"));
  return Array.isArray(result.listings) ? result.listings : [];
}

function toListing(source, row) {
  const raw = asRecord(row.rawJson);

  if (source === "balletmania") {
    return {
      no: row.sourcePostId,
      url: row.sourceUrl,
      title: raw.title || row.title,
      company: raw.company || null,
      companyType: raw.companyType || null,
      postedDateIso: raw.postedDate || null,
      closingDate: raw.closingDateText || null,
      major: raw.summaryMajorText || null,
    };
  }

  return {
    postId: row.sourcePostId,
    url: row.sourceUrl,
    title: raw.title || row.title,
    writer: raw.writer || raw.company || null,
    postedDate: raw.postedDate || null,
    category: raw.category || null,
    status: raw.status || null,
    viewCount: raw.viewCount || null,
    listPage: raw.listPage || null,
  };
}

function run(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: workerRoot,
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed (${code}): ${command} ${commandArgs.join(" ")}`));
    });
  });
}

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--source") parsed.source = argv[++index];
    else if (arg === "--limit") parsed.limit = argv[++index];
    else if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--help" || arg === "-h") {
      console.log([
        "Usage: pnpm --filter @balink/worker backfill:existing-descriptions",
        "",
        "Options:",
        "  --source balletmania|esangdance  Backfill one source only",
        "  --limit NUMBER                   Process at most NUMBER stored posts",
        "  --dry-run                        Show the target count without updating data",
      ].join("\n"));
      process.exit(0);
    }
  }

  return parsed;
}

function validateSources(values) {
  if (!values.every((source) => source === "balletmania" || source === "esangdance")) {
    throw new Error("Invalid --source. Expected balletmania or esangdance.");
  }
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function stringValue(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function hashContent(value) {
  return createHash("sha256").update(value).digest("hex");
}
