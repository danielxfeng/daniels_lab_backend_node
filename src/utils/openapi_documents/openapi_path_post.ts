/**
 * @file openapi_path_post.ts
 * @description The path definitions for post-related endpoints.
 */

import { registry } from "./openapi_registry";
import {
  GetPostListQuerySchema,
  CreateOrUpdatePostBodySchema,
  PostResponseSchema,
  PostListResponseSchema,
  KeywordSearchQuerySchema,
} from "../../schema/schema_post";
import {
  PostIdQuerySchema,
  PostSlugQuerySchema,
} from "../../schema/schema_components";

// GET /api/blog/posts - Get a list of blog posts
registry.registerPath({
  method: "get",
  path: "/api/blog/posts",
  summary: "Get a list of blog posts",
  description: "Supports pagination, tag filtering, and date range filtering.",
  tags: ["Posts"],
  request: {
    query: GetPostListQuerySchema,
  },
  responses: {
    200: {
      description: "List of posts",
      content: {
        "application/json": {
          schema: PostListResponseSchema,
        },
      },
    },
    400: { description: "Invalid input" },
    500: { description: "Internal server error" },
  },
});

// GET /api/blog/posts/{slug} - Get a single post
registry.registerPath({
  method: "get",
  path: "/api/blog/posts/{slug}",
  summary: "Get a single post including its comments",
  tags: ["Posts"],
  request: {
    params: PostSlugQuerySchema,
  },
  responses: {
    200: {
      description: "The post content",
      content: {
        "application/json": {
          schema: PostResponseSchema,
        },
      },
    },
    404: { description: "Post not found" },
    500: { description: "Internal server error" },
  },
});

// GET /api/blog/posts/search - Search posts by keyword
registry.registerPath({
  method: "get",
  path: "/api/blog/posts/search",
  summary: "Search posts by keyword",
  description: "Search posts by title, content or tag.",
  tags: ["Posts"],
  request: {
    query: KeywordSearchQuerySchema,
  },
  responses: {
    200: {
      description: "List of posts matching the keyword",
      content: {
        "application/json": {
          schema: PostListResponseSchema,
        },
      },
    },
    400: { description: "Invalid input" },
    500: { description: "Internal server error" },
  },
});

// POST /api/blog/posts - Create a new post
registry.registerPath({
  method: "post",
  path: "/api/blog/posts",
  summary: "Create a new blog post",
  description: "Only admin users can create a post.",
  tags: ["Posts"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateOrUpdatePostBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Post created",
      headers: {
        Location: {
          schema: { type: "string", example: "/posts/abc123" },
          description: "URL of the created post",
        },
      },
    },
    400: { description: "Invalid input" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Only admin can create post" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});

// PUT /api/blog/posts/{postId} - Update an existing post
registry.registerPath({
  method: "put",
  path: "/api/blog/posts/{postId}",
  summary: "Update a blog post",
  description: "Only the author can update a post.",
  tags: ["Posts"],
  security: [{ bearerAuth: [] }],
  request: {
    params: PostIdQuerySchema,
    body: {
      content: {
        "application/json": {
          schema: CreateOrUpdatePostBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Post updated",
      content: {
        "application/json": {
          schema: PostResponseSchema,
        },
      },
    },
    401: { description: "Unauthorized" },
    404: { description: "Post not found or forbidden" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});

// DELETE /api/blog/posts/{postId} - Delete a post
registry.registerPath({
  method: "delete",
  path: "/api/blog/posts/{postId}",
  summary: "Delete a blog post",
  description: "Only author or admin can delete a post.",
  tags: ["Posts"],
  security: [{ bearerAuth: [] }],
  request: {
    params: PostIdQuerySchema,
  },
  responses: {
    204: { description: "Post deleted" },
    401: { description: "Unauthorized" },
    404: { description: "Post not found, or forbidden" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});
