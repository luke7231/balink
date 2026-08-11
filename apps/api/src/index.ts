import "./config.js";
import { createServer } from "node:http";
import { prisma } from "@balink/db";
import { createYoga } from "graphql-yoga";
import { config } from "./config.js";
import { createGraphQLContext } from "./context/types.js";
import { schema } from "./graphql/schema.js";
import { createServices } from "./services/index.js";

const services = createServices();

const yoga = createYoga({
  schema,
  context: () => createGraphQLContext(services),
  graphqlEndpoint: "/graphql",
  landingPage: config.nodeEnv !== "production",
  cors: {
    origin: config.corsOrigin === "*" ? "*" : config.corsOrigin.split(",").map((value) => value.trim()),
    credentials: true,
  },
});

const server = createServer(yoga);

server.listen(config.port, () => {
  console.log(`balink GraphQL API listening on http://localhost:${config.port}/graphql`);
});

async function shutdown(): Promise<void> {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
