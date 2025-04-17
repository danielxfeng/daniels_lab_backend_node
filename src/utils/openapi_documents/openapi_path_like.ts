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
    204: {
      description: "Post liked successfully",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Post not found",
    },
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
    204: {
      description: "Post un-liked successfully",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Post not found",
    },
  },
});

// GET /api/blog/likes/ - Get like status of a post
registry.registerPath({
  method: "get",
  path: "/api/blog/likes/",
  summary: "Get like status of a post",
  description:
    "Get total number of likes. And whether the current user has liked the post, false for anonymous users",
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
    404: {
      description: "Post not found",
    },
  },
});
