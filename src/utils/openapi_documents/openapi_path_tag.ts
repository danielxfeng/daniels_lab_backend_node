/**
 * @file openapi_path_tag.ts
 * @description The path definitions for tag-related endpoints.
 */

import { registry } from "./openapi_registry";
import { TagQuerySchema, TagsResponseSchema } from "../../schema/schema_tag";

// GET /api/blog/tags/hot - Get hot tags
registry.registerPath({
  method: "get",
  path: "/api/blog/tags/hot",
  summary: "Get the hot tags",
  description: "Returns the most frequently used tags.",
  tags: ["Tags"],
  responses: {
    200: {
      description: "List of most frequently used tags",
      content: {
        "application/json": {
          schema: TagsResponseSchema,
        },
      },
    },
    500: { description: "Internal server error" },
  },
});

// GET /api/blog/tags/search - Get matched tags
registry.registerPath({
  method: "get",
  path: "/api/blog/tags/search",
  summary: "Search tags by prefix",
  description: "Returns a list of tags that match the given prefix.",
  tags: ["Tags"],
  request: {
    query: TagQuerySchema,
  },
  responses: {
    200: {
      description: "Matched tags",
      content: {
        "application/json": {
          schema: TagsResponseSchema,
        },
      },
    },
    500: { description: "Internal server error" },
  },
});
