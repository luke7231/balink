import { DateTimeResolver, JSONResolver } from "graphql-scalars";
import type { JobPostDetail } from "@balink/domain";
import { jobPostFilterSchema, paginationSchema, parseOrThrow, substitutePostFilterSchema } from "@balink/validation";
import type { GraphQLContext } from "../../context/types.js";

export const resolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,

  Query: {
    health: (_: unknown, __: unknown, { services }: GraphQLContext) => {
      return services.health.getStatus("balink-api");
    },

    jobPost: (_: unknown, args: { id: string }, { services }: GraphQLContext) => {
      return services.jobPost.findById(args.id);
    },

    jobPosts: (
      _: unknown,
      args: { filter?: unknown; pagination?: unknown },
      { services }: GraphQLContext,
    ) => {
      const filter = args.filter ? parseOrThrow(jobPostFilterSchema, args.filter, "Invalid job post filter") : null;
      const pagination = args.pagination
        ? parseOrThrow(paginationSchema, args.pagination, "Invalid pagination")
        : null;
      return services.jobPost.findMany(filter, pagination);
    },

    jobRegions: (_: unknown, __: unknown, { services }: GraphQLContext) => {
      return services.jobPost.listRegions();
    },

    scraperRuns: (_: unknown, args: { limit?: number | null }, { services }: GraphQLContext) => {
      return services.scraperRun.listRecent(args.limit ?? 20);
    },

    substitutePost: (_: unknown, args: { id: string }, { services }: GraphQLContext) => {
      return services.substitutePost.findById(args.id);
    },

    substitutePosts: (
      _: unknown,
      args: { filter?: unknown; pagination?: unknown },
      { services }: GraphQLContext,
    ) => {
      const filter = args.filter
        ? parseOrThrow(substitutePostFilterSchema, args.filter, "Invalid substitute post filter")
        : null;
      const pagination = args.pagination
        ? parseOrThrow(paginationSchema, args.pagination, "Invalid pagination")
        : null;
      return services.substitutePost.findMany(filter, pagination);
    },
  },

  JobPost: {
    sources: (parent: JobPostDetail, _: unknown, { services }: GraphQLContext) => {
      return services.jobPost.findSources(parent.id);
    },
  },
};
