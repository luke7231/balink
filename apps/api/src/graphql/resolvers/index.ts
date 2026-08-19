import { DateTimeResolver, JSONResolver } from "graphql-scalars";
import type { JobPostDetail } from "@balink/domain";
import {
  jobPostFilterSchema,
  jobPostSortSchema,
  paginationSchema,
  parseOrThrow,
  substitutePostFilterSchema,
  substitutePostSortSchema,
} from "@balink/validation";
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
      args: { filter?: unknown; pagination?: unknown; sort?: unknown },
      { services }: GraphQLContext,
    ) => {
      const filter = args.filter ? parseOrThrow(jobPostFilterSchema, args.filter, "Invalid job post filter") : null;
      const pagination = args.pagination
        ? parseOrThrow(paginationSchema, args.pagination, "Invalid pagination")
        : null;
      const sort = args.sort
        ? parseOrThrow(jobPostSortSchema, args.sort, "Invalid job post sort")
        : "LATEST";
      return services.jobPost.findMany(filter, pagination, sort);
    },

    jobRegions: (_: unknown, __: unknown, { services }: GraphQLContext) => {
      return services.jobPost.listRegions();
    },

    organization: (_: unknown, args: { id: string }, { services }: GraphQLContext) => {
      return services.organization.findById(args.id);
    },

    scraperRuns: (_: unknown, args: { limit?: number | null }, { services }: GraphQLContext) => {
      return services.scraperRun.listRecent(args.limit ?? 20);
    },

    substitutePost: (_: unknown, args: { id: string }, { services }: GraphQLContext) => {
      return services.substitutePost.findById(args.id);
    },

    substitutePosts: (
      _: unknown,
      args: { filter?: unknown; pagination?: unknown; sort?: unknown },
      { services }: GraphQLContext,
    ) => {
      const filter = args.filter
        ? parseOrThrow(substitutePostFilterSchema, args.filter, "Invalid substitute post filter")
        : null;
      const pagination = args.pagination
        ? parseOrThrow(paginationSchema, args.pagination, "Invalid pagination")
        : null;
      const sort = args.sort
        ? parseOrThrow(substitutePostSortSchema, args.sort, "Invalid substitute post sort")
        : "LATEST";
      return services.substitutePost.findMany(filter, pagination, sort);
    },
  },

  JobPost: {
    sources: (parent: JobPostDetail, _: unknown, { services }: GraphQLContext) => {
      return services.jobPost.findSources(parent.id);
    },
  },
};
