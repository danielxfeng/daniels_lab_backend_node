/**
 * @file openapi.ts
 * @description To generate OpenAPI schema for the APIs.
 */

import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./openapi_registry";

import "./openapi_path_auth"; // import as side effect

const generator = new OpenApiGeneratorV3(registry.definitions);

const openApiDocument = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Fancy Blog API",
    version: "1.0.0",
    description: "OpenAPI schema for Fancy Blog backend",
  },
  servers: [
    {
      url: process.env.SERVER_URL || "http://localhost:3000",
      description: "Development server",
    },
  ],
});

export { registry, openApiDocument };
