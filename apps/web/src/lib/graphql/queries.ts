import {
  HealthDocument,
  JobPostDocument,
  JobPostsDocument,
  SubstitutePostDocument,
  SubstitutePostsDocument,
  type HealthQuery,
  type JobPostQuery,
  type JobPostsQuery,
  type SubstitutePostQuery,
  type SubstitutePostsQuery,
} from "@/generated/graphql";
import { graphqlRequest } from "./client";

export async function fetchJobPosts(page = 1, limit = 20): Promise<JobPostsQuery["jobPosts"]> {
  const data = await graphqlRequest<JobPostsQuery>(
    JobPostsDocument,
    { pagination: { page, limit } },
    { revalidate: 0 },
  );
  return data.jobPosts;
}

export async function fetchJobPost(id: string): Promise<JobPostQuery["jobPost"]> {
  const data = await graphqlRequest<JobPostQuery>(JobPostDocument, { id }, { revalidate: 30 });
  return data.jobPost;
}

export async function fetchSubstitutePosts(
  page = 1,
  limit = 20,
  filter?: { status?: "OPEN" | "EXPIRED" | "DELETED" | null },
): Promise<SubstitutePostsQuery["substitutePosts"]> {
  const data = await graphqlRequest<SubstitutePostsQuery>(SubstitutePostsDocument, {
    pagination: { page, limit },
    filter,
  });
  return data.substitutePosts;
}

export async function fetchSubstitutePost(id: string): Promise<SubstitutePostQuery["substitutePost"]> {
  const data = await graphqlRequest<SubstitutePostQuery>(SubstitutePostDocument, { id }, { revalidate: 30 });
  return data.substitutePost;
}

export async function fetchHealth(): Promise<HealthQuery["health"]> {
  const data = await graphqlRequest<HealthQuery>(HealthDocument, undefined, { revalidate: 30 });
  return data.health;
}
