import {
  HealthDocument,
  JobPostDocument,
  JobPostsDocument,
  JobPostSort,
  JobRegionsDocument,
  OrganizationDocument,
  SubstitutePostDocument,
  SubstitutePostsDocument,
  SubstitutePostSort,
  type HealthQuery,
  type JobPostFilterInput,
  type JobPostQuery,
  type JobPostsQuery,
  type JobRegionsQuery,
  type OrganizationQuery,
  type SubstitutePostQuery,
  type SubstitutePostsQuery,
} from "@/generated/graphql";
import { graphqlRequest } from "./client";

export async function fetchJobPosts(
  page = 1,
  limit = 20,
  filter?: JobPostFilterInput | null,
  sort: JobPostSort = JobPostSort.Latest,
): Promise<JobPostsQuery["jobPosts"]> {
  const data = await graphqlRequest<JobPostsQuery>(
    JobPostsDocument,
    { pagination: { page, limit }, filter: filter ?? null, sort },
    { revalidate: 30 },
  );
  return data.jobPosts;
}

export async function fetchJobRegions(): Promise<JobRegionsQuery["jobRegions"]> {
  const data = await graphqlRequest<JobRegionsQuery>(JobRegionsDocument, undefined, { revalidate: 60 });
  return data.jobRegions;
}

export async function fetchJobPost(id: string): Promise<JobPostQuery["jobPost"]> {
  const data = await graphqlRequest<JobPostQuery>(JobPostDocument, { id }, { revalidate: 30 });
  return data.jobPost;
}

export async function fetchOrganization(id: string): Promise<OrganizationQuery["organization"]> {
  const data = await graphqlRequest<OrganizationQuery>(OrganizationDocument, { id }, { revalidate: 30 });
  return data.organization;
}

export async function fetchSubstitutePosts(
  page = 1,
  limit = 20,
  filter?: { status?: "OPEN" | "EXPIRED" | "DELETED" | null },
  sort: SubstitutePostSort = SubstitutePostSort.Latest,
): Promise<SubstitutePostsQuery["substitutePosts"]> {
  const data = await graphqlRequest<SubstitutePostsQuery>(
    SubstitutePostsDocument,
    {
      pagination: { page, limit },
      filter,
      sort,
    },
    { revalidate: 30 },
  );
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
