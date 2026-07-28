import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "apps/api/src/graphql/schema.graphql",
  documents: ["apps/web/src/graphql/**/*.graphql"],
  generates: {
    "apps/api/src/graphql/generated/resolvers-types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        contextType: "../../context/types.js#GraphQLContext",
        scalars: {
          DateTime: "Date",
          JSON: "unknown",
        },
      },
    },
    "apps/web/src/generated/graphql.ts": {
      plugins: ["typescript", "typescript-operations", "typed-document-node"],
      config: {
        scalars: {
          DateTime: "string",
          JSON: "unknown",
        },
        useTypeImports: true,
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
