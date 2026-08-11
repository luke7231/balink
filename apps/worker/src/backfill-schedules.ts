import { pathToFileURL } from "node:url";
import OpenAI from "openai";
import { prisma, type Prisma } from "@balink/db";
import { SCHEDULE_LLM_RULES, sanitizeSchedule, type JobSchedule } from "@balink/domain";

const llmModel = process.env.OPENAI_MODEL || "gpt-5.4";

export interface BackfillSchedulesOptions {
  dryRun?: boolean;
  limit?: number;
  offset?: number;
  ids?: string[];
}

export interface BackfillSchedulesSummary {
  model: string;
  targeted: number;
  updated: number;
  skipped: number;
  failed: number;
  failures: string[];
}

export async function backfillSchedules(
  options: BackfillSchedulesOptions = {},
): Promise<BackfillSchedulesSummary> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for schedule backfill");
  }

  const summary: BackfillSchedulesSummary = {
    model: llmModel,
    targeted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    failures: [],
  };

  const posts = await prisma.jobPost.findMany({
    where: options.ids?.length ? { id: { in: options.ids } } : undefined,
    orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
    skip: options.offset ?? 0,
    ...(options.limit ? { take: options.limit } : {}),
    select: {
      id: true,
      title: true,
      description: true,
      days: true,
      dayGroups: true,
      timeSlots: true,
      times: true,
    },
  });

  summary.targeted = posts.length;
  console.log(`[backfill-schedules] model=${llmModel} targets=${posts.length} dryRun=${Boolean(options.dryRun)}`);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  for (const [index, post] of posts.entries()) {
    const label = `${index + 1}/${posts.length} ${post.id}`;
    if (!post.description?.trim() && !post.title.trim()) {
      summary.skipped += 1;
      console.log(`[backfill-schedules] skipped ${label}: empty text`);
      continue;
    }

    try {
      const llmSchedule = await extractScheduleWithLlm(openai, post.title, post.description ?? "");
      const schedule = sanitizeSchedule(llmSchedule, {
        title: post.title,
        detailText: post.description,
      });

      if (options.dryRun) {
        summary.updated += 1;
        console.log(
          `[backfill-schedules] dry-run ${label}: groups=${JSON.stringify(schedule.dayGroups)} slots=${schedule.timeSlots.join(",")}`,
        );
        continue;
      }

      await prisma.jobPost.update({
        where: { id: post.id },
        data: {
          days: schedule.days,
          dayGroups: schedule.dayGroups as unknown as Prisma.InputJsonValue,
          timeSlots: schedule.timeSlots.filter((slot) => slot !== "negotiable" && slot !== "unknown"),
          times: schedule.times as unknown as Prisma.InputJsonValue,
        },
      });

      summary.updated += 1;
      console.log(
        `[backfill-schedules] updated ${label}: ${schedule.dayGroups.map((g) => g.join("·")).join(" / ") || "-"} | ${schedule.timeSlots.join(",")}`,
      );
      await sleep(150);
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      summary.failures.push(`${post.id}: ${message}`);
      console.error(`[backfill-schedules] failed ${label}: ${message}`);
    }
  }

  return summary;
}

async function extractScheduleWithLlm(
  openai: OpenAI,
  title: string,
  detailText: string,
): Promise<Partial<JobSchedule>> {
  const response = await openai.responses.create({
    model: llmModel,
    input: [
      {
        role: "system",
        content: [
          "너는 발레 강사 채용공고의 요일·시간 스케줄만 구조화하는 분류기다.",
          "원문에 없는 정보는 확정하지 말고 null/빈 배열로 둔다.",
          "반드시 제공된 enum 값만 사용한다.",
          SCHEDULE_LLM_RULES,
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify({ title, detailText }, null, 2),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "job_schedule_backfill",
        strict: true,
        schema: scheduleSchema(),
      },
    },
  });

  const outputText = response.output_text || extractResponseText(response);
  if (!outputText) throw new Error("OpenAI response did not include output text.");
  return JSON.parse(outputText) as Partial<JobSchedule>;
}

function scheduleSchema() {
  const dayEnum = ["월", "화", "수", "목", "금", "토", "일"];
  const timeSlotEnum = ["morning", "afternoon", "evening", "negotiable", "unknown"];
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "days",
      "dayGroups",
      "dayRaw",
      "timeSlots",
      "times",
      "classCount",
      "durationMinutes",
      "startDate",
      "evidence",
    ],
    properties: {
      days: { type: "array", items: { type: "string", enum: dayEnum } },
      dayGroups: {
        type: "array",
        items: { type: "array", items: { type: "string", enum: dayEnum } },
      },
      dayRaw: { type: ["string", "null"] },
      timeSlots: { type: "array", items: { type: "string", enum: timeSlotEnum } },
      times: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["start", "end", "raw"],
          properties: {
            start: { type: ["string", "null"] },
            end: { type: ["string", "null"] },
            raw: { type: "string" },
          },
        },
      },
      classCount: { type: ["number", "null"] },
      durationMinutes: { type: ["number", "null"] },
      startDate: { type: ["string", "null"] },
      evidence: { type: ["string", "null"] },
    },
  };
}

function extractResponseText(response: OpenAI.Responses.Response): string {
  const chunks: string[] = [];
  for (const item of response.output || []) {
    if (item.type !== "message") continue;
    for (const content of item.content || []) {
      if (content.type === "output_text" && "text" in content && content.text) {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const summary = await backfillSchedules({
    dryRun: Boolean(args.dryRun),
    limit: args.limit ? Number(args.limit) : undefined,
    offset: args.offset ? Number(args.offset) : undefined,
    ids: args.ids,
  });
  console.log(`[backfill-schedules] complete: ${JSON.stringify(summary)}`);
  if (summary.failures.length) {
    console.log(`[backfill-schedules] failures:\n${summary.failures.join("\n")}`);
  }
  await prisma.$disconnect();
  if (summary.failed > 0) process.exitCode = 1;
}

function parseArgs(argv: string[]) {
  const parsed: { dryRun?: boolean; limit?: string; offset?: string; ids?: string[] } = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--limit") parsed.limit = argv[++index];
    else if (arg === "--offset") parsed.offset = argv[++index];
    else if (arg === "--ids") {
      parsed.ids = (argv[++index] || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    }
  }
  return parsed;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
}
