import { print, type DocumentNode } from "graphql";

const DEFAULT_API_URL = "http://localhost:3000/graphql";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function graphqlRequest<TData>(
  document: DocumentNode,
  variables?: Record<string, unknown>,
  options?: { revalidate?: number },
): Promise<TData> {
  const endpoint = process.env.API_URL || DEFAULT_API_URL;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: print(document),
      variables,
    }),
    next: { revalidate: options?.revalidate ?? 60 },
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "));
  }

  if (!payload.data) {
    throw new Error("GraphQL response missing data");
  }

  return payload.data;
}
