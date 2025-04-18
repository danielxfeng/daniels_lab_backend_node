/**
 * @file openapi_path_like.ts
 * @description The path definitions for like-related endpoints.
 */

import { registry } from "./openapi_registry";
import { PostIdQuerySchema } from "../../schema/schema_components";
import { LikeStatusResponseSchema } from "../../schema/schema_like";

// POST /api/blog/likes/ - Like a post
registry.registerPath({
  method: "post",
  path: "/api/blog/likes/",
  summary: "Like a post",
  description: "Like a post, registered user only",
  tags: ["Likes"],
  security: [{ bearerAuth: [] }],
  request: {
    query: PostIdQuerySchema,
  },
  responses: {
    204: { description: "Post liked successfully" },
    401: { description: "Unauthorized" },
    404: { description: "Post not found" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});

// DELETE /api/blog/likes/ - Unlike a post
registry.registerPath({
  method: "delete",
  path: "/api/blog/likes/",
  summary: "Unlike a post",
  description: "Unlike a post, registered user only",
  tags: ["Likes"],
  security: [{ bearerAuth: [] }],
  request: {
    query: PostIdQuerySchema,
  },
  responses: {
    204: { description: "Post un-liked successfully" },
    401: { description: "Unauthorized" },
    404: { description: "Post not found" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});

// GET /api/blog/likes/ - Get like status of a post
registry.registerPath({
  method: "get",
  path: "/api/blog/likes/",
  summary: "Get like status of a post",
  description:
    "Access token is optional. The count of likes is always returned. The like status is only returned if the access token is valid.",
  tags: ["Likes"],
  security: [{ bearerAuth: [] }],
  request: {
    query: PostIdQuerySchema,
  },
  responses: {
    200: {
      description: "Like status",
      content: {
        "application/json": {
          schema: LikeStatusResponseSchema,
        },
      },
    },
    404: { description: "Post not found" },
    500: { description: "Internal server error" },
  },
});
