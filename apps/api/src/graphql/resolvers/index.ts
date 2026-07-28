import { DateTimeResolver, JSONResolver } from "graphql-scalars";
import type { JobPostDetail } from "@black-swan/domain";
import { jobPostFilterSchema, paginationSchema, parseOrThrow } from "@black-swan/validation";
import type { GraphQLContext } from "../../context/types.js";

export const resolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,

  Query: {
    health: (_: unknown, __: unknown, { services }: GraphQLContext) => {
      return services.health.getStatus("black-swan-api");
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
  },

  JobPost: {
    sources: (parent: JobPostDetail, _: unknown, { services }: GraphQLContext) => {
      return services.jobPost.findSources(parent.id);
    },
  },
};
