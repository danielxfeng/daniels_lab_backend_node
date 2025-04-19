/**
 * @file openapi_path_comment.ts
 * @description Path definitions for comment-related endpoints.
 */

import { registry } from "./openapi_registry";
import {
  GetCommentsQuerySchema,
  CreateOrUpdateCommentBodySchema,
  CommentIdParamSchema,
  CommentResponseSchema,
  CommentsListResponseSchema,
} from "../../schema/schema_comment";
import { PostIdQuerySchema } from "../../schema/schema_components";

// 1. GET /api/blog/comments — get comment list
registry.registerPath({
  method: "get",
  path: "/api/blog/comments",
  summary: "Get comments for a post",
  description: "Paginated list of comments",
  tags: ["Comments"],
  request: {
    query: GetCommentsQuerySchema,
  },
  responses: {
    200: {
      description: "List of comments",
      content: {
        "application/json": {
          schema: CommentsListResponseSchema,
        },
      },
    },
    400: { description: "Invalid input" },
    404: { description: "Post not found" },
    500: { description: "Internal server error" },
  },
});

// 2. POST /api/blog/comments — create comment
registry.registerPath({
  method: "post",
  path: "/api/blog/comments",
  summary: "Create a comment on a post",
  description: "Only for registered users",
  tags: ["Comments"],
  security: [{ bearerAuth: [] }],
  request: {
    query: PostIdQuerySchema,
    body: {
      content: {
        "application/json": {
          schema: CreateOrUpdateCommentBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Comment created",
      headers: {
        Location: {
          schema: { type: "string", example: "/comments/aaabbb" },
          description: "URL of the created comment",
        },
      },
    },
    400: { description: "Invalid input" },
    401: { description: "Unauthorized"},
    404: { description: "Post not found"},
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});

// 3. DELETE /api/blog/comments/{commentId} — delete comment
registry.registerPath({
  method: "delete",
  path: "/api/blog/comments/{commentId}",
  summary: "Delete a comment",
  description: "Only the author or admin can delete a comment",
  tags: ["Comments"],
  security: [{ bearerAuth: [] }],
  request: {
    params: CommentIdParamSchema,
  },
  responses: {
    204: { description: "Comment deleted" },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Only the author or admin can delete" },
    404: { description: "Comment not found" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});

// 4. PUT /api/blog/comments/{commentId} — update comment
registry.registerPath({
  method: "put",
  path: "/api/blog/comments/{commentId}",
  summary: "Update a comment",
  description: "Only the author can update a comment",
  tags: ["Comments"],
  security: [{ bearerAuth: [] }],
  request: {
    query: CommentIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: CreateOrUpdateCommentBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Comment updated",
      content: {
        "application/json": {
          schema: CommentResponseSchema,
        },
      },
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Only the author can update" },
    404: { description: "Comment not found" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});
