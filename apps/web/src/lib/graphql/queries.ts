import {
  HealthDocument,
  JobPostDocument,
  JobPostsDocument,
  type HealthQuery,
  type JobPostQuery,
  type JobPostsQuery,
} from "@/generated/graphql";
import { graphqlRequest } from "./client";

export async function fetchJobPosts(page = 1, limit = 20): Promise<JobPostsQuery["jobPosts"]> {
  const data = await graphqlRequest<JobPostsQuery>(JobPostsDocument, {
    pagination: { page, limit },
  });
  return data.jobPosts;
}

export async function fetchJobPost(id: string): Promise<JobPostQuery["jobPost"]> {
  const data = await graphqlRequest<JobPostQuery>(JobPostDocument, { id }, { revalidate: 30 });
  return data.jobPost;
}

export async function fetchHealth(): Promise<HealthQuery["health"]> {
  const data = await graphqlRequest<HealthQuery>(HealthDocument, undefined, { revalidate: 30 });
  return data.health;
}
