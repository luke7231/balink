import { z } from "zod";
import type { LlmMode, SourceName } from "@balink/domain";

export const sourceNameSchema = z.enum(["balletmania", "esangdance"]);
export const scraperRunStatusSchema = z.enum(["running", "success", "failed"]);
export const llmModeSchema = z.enum(["off", "fallback", "all"]);

export const substitutePostStatusSchema = z.enum(["OPEN", "EXPIRED", "DELETED"]);

export const substitutePostFilterSchema = z.object({
  status: substitutePostStatusSchema.optional().nullable(),
  sido: z.string().trim().min(1).optional().nullable(),
  sigungu: z.string().trim().min(1).optional().nullable(),
  source: sourceNameSchema.optional().nullable(),
});

export const jobPostFilterSchema = z.object({
  sido: z.string().trim().min(1).optional().nullable(),
  sigungu: z.string().trim().min(1).optional().nullable(),
  jobType: z.string().trim().min(1).optional().nullable(),
  source: sourceNameSchema.optional().nullable(),
});

export const paginationSchema = z.object({
  page: z.number().int().min(1).optional().nullable(),
  limit: z.number().int().min(1).max(100).optional().nullable(),
});

export const workerRunRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  source: sourceNameSchema.optional(),
  llmMode: llmModeSchema.optional(),
});

export const classifiedItemSchema = z.object({
  source: sourceNameSchema,
  sourcePostId: z.string().min(1),
  url: z.string().url(),
  collectedAt: z.string().min(1),
  raw: z.record(z.unknown()),
  classification: z.record(z.unknown()),
  enrichment: z.record(z.unknown()).optional(),
});

export const classifiedPayloadSchema = z.object({
  source: sourceNameSchema,
  total: z.number().int().nonnegative(),
  listings: z.array(classifiedItemSchema),
});

export type JobPostFilterInput = z.infer<typeof jobPostFilterSchema>;
export type SubstitutePostFilterInput = z.infer<typeof substitutePostFilterSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type WorkerRunRequestInput = z.infer<typeof workerRunRequestSchema>;
export type ClassifiedPayloadInput = z.infer<typeof classifiedPayloadSchema>;

export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown, message: string): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`${message}: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function parseSourceName(value: unknown): SourceName | undefined {
  const parsed = sourceNameSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export function parseLlmMode(value: unknown): LlmMode | undefined {
  const parsed = llmModeSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
