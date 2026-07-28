import { DateTimeResolver, JSONResolver } from "graphql-scalars";
import type { GraphQLContext } from "../../context/types.js";
import type { JobPostDetail } from "../../types/domain/job-post.js";

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
      args: {
        filter?: Parameters<GraphQLContext["services"]["jobPost"]["findMany"]>[0];
        pagination?: Parameters<GraphQLContext["services"]["jobPost"]["findMany"]>[1];
      },
      { services }: GraphQLContext,
    ) => {
      return services.jobPost.findMany(args.filter, args.pagination);
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
