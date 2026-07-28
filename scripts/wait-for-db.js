#!/usr/bin/env node

const net = require("node:net");

const timeoutMs = Number(process.env.DB_WAIT_TIMEOUT_MS || 60_000);
const intervalMs = Number(process.env.DB_WAIT_INTERVAL_MS || 2_000);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const { host, port } = parsePostgresUrl(databaseUrl);
  const startedAt = Date.now();
  let attempt = 0;
  let lastError = null;

  while (Date.now() - startedAt <= timeoutMs) {
    attempt += 1;

    try {
      await tryConnect(host, port);
      console.log(`[db] connected after ${attempt} attempt(s)`);
      return;
    } catch (error) {
      lastError = error;
      console.log(`[db] waiting for database (${attempt}): ${error.message}`);
      await sleep(intervalMs);
    }
  }

  throw new Error(
    `Database was not reachable within ${timeoutMs}ms: ${lastError ? lastError.message : "unknown error"}`,
  );
}

function parsePostgresUrl(connectionString) {
  const url = new URL(connectionString.replace(/^postgres(ql)?:/, "http:"));
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
  };
}

function tryConnect(host, port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.end();
      resolve();
    });

    socket.setTimeout(5_000);
    socket.on("error", reject);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("connection timeout"));
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
