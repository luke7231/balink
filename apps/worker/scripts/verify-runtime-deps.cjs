#!/usr/bin/env node

const path = require("node:path");
const { createRequire } = require("node:module");

const scriptDir = __dirname;
const workerRoot = path.join(scriptDir, "..");
const workerRequire = createRequire(path.join(workerRoot, "package.json"));

const scriptDeps = ["cheerio", "dotenv", "iconv-lite", "openai", "undici"];
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

verifyWorkspaceDeps()
  .then(() => {
    if (failed) process.exit(1);
  })
  .catch((error) => {
    console.error(`[deps] verification failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
