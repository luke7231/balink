#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const {
  classifySubstitute,
  computeExpiresAt,
  fetchEucKrHtml,
  getTodayKstDate,
  loginBalletmania,
  parseWorkingDetail,
} = require("./lib/balletmania-working.cjs");

dotenv.config();

const args = parseArgs(process.argv.slice(2));
const inputPath = args.input || path.join("data", `balletmania-working-${getTodayKstDate()}.json`);
const outputPath = args.output || inputPath.replace(/\.json$/, "-classified.json");
const llmMode = args.llm || "fallback";
const llmModel = process.env.OPENAI_MODEL || "gpt-5.4";

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  validateLlmMode(llmMode);

  const listPayload = JSON.parse(await fs.readFile(inputPath, "utf8"));
  const cookie = await loginBalletmania();
  const openai = createOpenAiClient(llmMode);
  const results = [];

  for (const listing of listPayload.listings) {
    const html = await fetchEucKrHtml(listing.url, cookie);
    const detail = parseWorkingDetail(html);

    if (detail.state === "deleted" || detail.state === "missing") {
      results.push({
        source: "balletmania",
        sourcePostId: listing.no,
        url: listing.url,
        collectedAt: new Date().toISOString(),
        state: detail.state,
        raw: null,
        classification: null,
      });
      continue;
    }

    if (detail.state === "login_required" || !detail.detailText) {
      console.warn(`[skip] ${listing.url}\tlogin required or empty detail`);
      results.push({
        source: "balletmania",
        sourcePostId: listing.no,
        url: listing.url,
        collectedAt: new Date().toISOString(),
        state: detail.state === "login_required" ? "login_required" : "empty",
        raw: null,
        classification: null,
      });
      continue;
    }

    const raw = {
      boardId: "working",
      title: detail.title || listing.title,
      author: listing.author,
      authorMemberNo: listing.authorMemberNo,
      postedDate: listing.postedAtIso,
      detailText: detail.detailText,
      recommendCount: listing.recommendCount,
      viewCount: detail.viewCount || listing.viewCount,
      applicantCount: detail.applicantCount,
      contactPhones: detail.contactPhones,
      contactEmails: detail.contactEmails,
    };

    let classification = classifySubstitute(raw);

    if (shouldUseLlm(llmMode)) {
      try {
        classification = await enrichWithLlm(openai, raw, classification);
      } catch (error) {
        classification.llm = {
          used: true,
          model: llmModel,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    results.push({
      source: "balletmania",
      sourcePostId: listing.no,
      url: listing.url,
      collectedAt: new Date().toISOString(),
      state: "ok",
      raw,
      classification,
      lifecycle: {
        expiresAt: computeExpiresAt(classification.schedule.lessonDates, raw.postedDate),
      },
    });

    await sleep(250);
  }

  const payload = {
    source: "balletmania",
    boardId: "working",
    input: inputPath,
    total: results.length,
    generatedAt: new Date().toISOString(),
    listings: results,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`Saved ${results.length} classified working listings to ${outputPath}`);
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input") parsed.input = argv[++index];
    else if (arg === "--output") parsed.output = argv[++index];
    else if (arg === "--llm") parsed.llm = argv[++index];
  }
  return parsed;
}

function validateLlmMode(mode) {
  if (!["off", "fallback", "all"].includes(mode)) {
    throw new Error(`Invalid --llm mode: ${mode}. Expected off, fallback, or all.`);
  }
}

function createOpenAiClient(mode) {
  if (mode === "off") return null;
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required when --llm is fallback or all.");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function shouldUseLlm(mode) {
  return mode === "fallback" || mode === "all";
}

async function enrichWithLlm(openai, raw, classification) {
  const response = await openai.responses.create({
    model: llmModel,
    input: [
      {
        role: "system",
        content:
          "You normalize Korean ballet substitute teacher board posts. Return strict JSON with keys: sido, sigungu, dongOrStation, locationText, lessonDates (YYYY-MM-DD[]), times ({start,end,raw}[]), payText, urgency (same_day|next_day|normal), audiences (string[]), subjects (string[]). Use only evidence from the post.",
      },
      {
        role: "user",
        content: JSON.stringify({
          title: raw.title,
          detailText: raw.detailText,
          postedDate: raw.postedDate,
        }),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "substitute_post",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            sido: { type: ["string", "null"] },
            sigungu: { type: ["string", "null"] },
            dongOrStation: { type: ["string", "null"] },
            locationText: { type: ["string", "null"] },
            lessonDates: { type: "array", items: { type: "string" } },
            times: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  start: { type: ["string", "null"] },
                  end: { type: ["string", "null"] },
                  raw: { type: ["string", "null"] },
                },
                required: ["start", "end", "raw"],
              },
            },
            payText: { type: ["string", "null"] },
            urgency: { type: "string", enum: ["same_day", "next_day", "normal"] },
            audiences: { type: "array", items: { type: "string" } },
            subjects: { type: "array", items: { type: "string" } },
          },
          required: [
            "sido",
            "sigungu",
            "dongOrStation",
            "locationText",
            "lessonDates",
            "times",
            "payText",
            "urgency",
            "audiences",
            "subjects",
          ],
        },
      },
    },
  });

  const parsed = JSON.parse(response.output_text);
  const primaryLocation = parsed.locationText || [parsed.sido, parsed.sigungu, parsed.dongOrStation].filter(Boolean).join(" ");

  return {
    ...classification,
    audiences: parsed.audiences?.length ? parsed.audiences : classification.audiences,
    subjects: parsed.subjects?.length ? parsed.subjects : classification.subjects,
    schedule: {
      ...classification.schedule,
      lessonDates: parsed.lessonDates?.length ? parsed.lessonDates : classification.schedule.lessonDates,
      times: parsed.times?.length ? parsed.times : classification.schedule.times,
    },
    locations: primaryLocation
      ? [{ raw: primaryLocation, sido: parsed.sido, sigungu: parsed.sigungu, dongOrStation: parsed.dongOrStation, confidence: "llm" }]
      : classification.locations,
    pay: parsed.payText ? { ...classification.pay, amountText: parsed.payText } : classification.pay,
    urgency: parsed.urgency || classification.urgency,
    llm: { used: true, model: llmModel },
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
