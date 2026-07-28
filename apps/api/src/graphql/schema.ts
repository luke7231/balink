import { createSchema } from "graphql-yoga";
import { resolvers } from "./resolvers/index.js";
import { typeDefs } from "./type-defs.js";

export const schema = createSchema({
  typeDefs,
  resolvers,
});
