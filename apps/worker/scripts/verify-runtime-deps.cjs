#!/usr/bin/env node

const path = require("node:path");
const { createRequire } = require("node:module");
const { Agent, fetch } = require("undici");

const scriptDir = __dirname;
const workerRoot = path.join(scriptDir, "..");
const workerRequire = createRequire(path.join(workerRoot, "package.json"));

const scriptDeps = ["cheerio", "dotenv", "expo-server-sdk", "iconv-lite", "openai", "undici"];
const workspaceDeps = ["@black-swan/db", "@black-swan/domain", "@black-swan/validation"];

process.chdir(scriptDir);

let failed = false;

for (const dep of scriptDeps) {
  try {
    workerRequire.resolve(dep);
    console.log(`[deps] ok ${dep}`);
  } catch {
    console.error(`[deps] missing ${dep}`);
    failed = true;
  }
}

async function verifyWorkspaceDeps() {
  for (const dep of workspaceDeps) {
    try {
      await import(dep);
      console.log(`[deps] ok ${dep}`);
    } catch (error) {
      console.error(`[deps] missing ${dep}: ${error instanceof Error ? error.message : String(error)}`);
      failed = true;
    }
  }
}

async function verifyUndiciDispatcher() {
  const dispatcher = new Agent({ connect: { timeout: 1_000 } });

  try {
    const response = await fetch("data:text/plain,ok", { dispatcher });
    if ((await response.text()) !== "ok") throw new Error("unexpected response");
    console.log("[deps] ok undici fetch dispatcher");
  } finally {
    await dispatcher.close();
  }
}

Promise.all([verifyWorkspaceDeps(), verifyUndiciDispatcher()])
  .then(() => {
    if (failed) process.exit(1);
  })
  .catch((error) => {
    console.error(`[deps] verification failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
