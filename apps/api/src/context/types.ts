import type { AppServices } from "../services/index.js";

export interface GraphQLContext {
  services: AppServices;
}

export function createGraphQLContext(services: AppServices): GraphQLContext {
  return { services };
}
