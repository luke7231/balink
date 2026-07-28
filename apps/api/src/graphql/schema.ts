import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSchema } from "graphql-yoga";
import { resolvers } from "./resolvers/index.js";

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), "schema.graphql");
const typeDefs = readFileSync(schemaPath, "utf8");

export const schema = createSchema({
  typeDefs,
  resolvers,
});
