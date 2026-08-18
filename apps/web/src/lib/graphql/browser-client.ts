import { print, type DocumentNode } from "graphql";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/** Browser-side GraphQL via same-origin Next proxy (works in native WebView). */
export async function browserGraphqlRequest<TData>(
  document: DocumentNode,
  variables?: Record<string, unknown>,
): Promise<TData> {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: print(document),
      variables,
    }),
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
