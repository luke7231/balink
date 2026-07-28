import http from "node:http";
import { URL } from "node:url";
import { DatabaseHealthRepository, ScraperRunRepository, prisma } from "@black-swan/db";
import { parseLlmMode, parseOrThrow, parseSourceName, workerRunRequestSchema } from "@black-swan/validation";
import { config } from "./config.js";
import { startScheduler } from "./scheduler.js";
import { runScraper } from "./scraper.js";

const databaseHealthRepository = new DatabaseHealthRepository();
const scraperRunRepository = new ScraperRunRepository();

const server = http.createServer(async (req, res) => {
  try {
    await route(req, res);
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

startScheduler();

server.listen(config.port, () => {
  console.log(`Scraper worker listening on http://localhost:${config.port}`);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function route(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const method = req.method || "GET";
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (method === "GET" && url.pathname === "/health") {
    await databaseHealthRepository.ping();
    sendJson(res, 200, {
      ok: true,
      scheduleEnabled: config.scheduleEnabled,
      scheduleIntervalMinutes: config.scheduleIntervalMinutes,
      scheduleSources: config.scheduleSources,
      defaultLlmMode: config.defaultLlmMode,
      scraperWorkDir: config.scraperWorkDir,
    });
    return;
  }

  if (method === "GET" && url.pathname === "/runs") {
    const runs = await scraperRunRepository.listRecent(Number(url.searchParams.get("limit") || 20));
    sendJson(res, 200, { runs });
    return;
  }

  if (method === "POST" && url.pathname === "/runs") {
    const body = await readJson(req);
    const parsed = parseOrThrow(workerRunRequestSchema, body, "Invalid worker run request");
    const date = parsed.date || todayKst();
    const source = parsed.source ?? parseSourceName(body.source);
    const llmMode = parsed.llmMode ?? parseLlmMode(body.llmMode) ?? config.defaultLlmMode;
    const result = await runScraper({ date, source, llmMode });
    sendJson(res, 201, result);
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

function sendJson(res: http.ServerResponse, statusCode: number, body: unknown): void {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  res.end(`${JSON.stringify(body, null, 2)}\n`);
}

async function readJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

function todayKst(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function shutdown(): Promise<void> {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
