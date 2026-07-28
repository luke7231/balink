import { graphqlRequest } from "./client";
import type { HealthStatus, JobPostConnection, JobPostDetail } from "@/types/job-post";

const JOB_POST_SUMMARY_FIELDS = `
  id
  title
  sourcePrimary
  jobType
  postedAt
  locationText
  sido
  sigungu
  dongOrStation
  audienceTypes
  subjectTypes
  days
  timeSlots
  times
  payText
  payMinManwon
  payMaxManwon
  payNegotiable
  createdAt
  updatedAt
`;

export async function fetchJobPosts(page = 1, limit = 20): Promise<JobPostConnection> {
  const data = await graphqlRequest<{ jobPosts: JobPostConnection }>(
    `
      query JobPosts($pagination: PaginationInput) {
        jobPosts(pagination: $pagination) {
          items { ${JOB_POST_SUMMARY_FIELDS} }
          pageInfo { page limit total totalPages }
        }
      }
    `,
    { pagination: { page, limit } },
  );

  return data.jobPosts;
}

export async function fetchJobPost(id: string): Promise<JobPostDetail | null> {
  const data = await graphqlRequest<{ jobPost: JobPostDetail | null }>(
    `
      query JobPost($id: ID!) {
        jobPost(id: $id) {
          ${JOB_POST_SUMMARY_FIELDS}
          description
          status
          isBallet
          balletConfidence
          classCount
          durationMinutes
          payType
          contactMethods
          contactEmails
          contactPhones
          requirements
          confidence
          sources {
            id
            source
            sourceUrl
            confidence
            sourcePost {
              id
              sourcePostId
              title
              sourceUrl
              postedAt
            }
          }
        }
      }
    `,
    { id },
    { revalidate: 30 },
  );

  return data.jobPost;
}

export async function fetchHealth(): Promise<HealthStatus> {
  const data = await graphqlRequest<{ health: HealthStatus }>(
    `
      query Health {
        health {
          ok
          service
          jobCount
        }
      }
    `,
    undefined,
    { revalidate: 30 },
  );

  return data.health;
}
