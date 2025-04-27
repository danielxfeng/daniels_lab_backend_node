/**
 * @file openapi_path_comment.ts
 * @description Path definitions for comment-related endpoints.
 */

import { registry } from "./openapi_registry";
import {
  GetCommentsQuerySchema,
  CreateCommentBodySchema,
  UpdateCommentBodySchema,
  CommentIdParamSchema,
  CommentResponseSchema,
  CommentsListResponseSchema,
} from "../../schema/schema_comment";

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
    500: { description: "Internal server error" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/blog/comments/{commentId}",
  summary: "Get a comment by ID",
  description: "Get a comment by its ID",
  tags: ["Comments"],
  request: {
    params: CommentIdParamSchema,
  },
  responses: {
    200: {
      description: "Comment found",
      content: {
        "application/json": {
          schema: CommentResponseSchema,
        },
      },
    },
    400: { description: "Invalid input" },
    404: { description: "Comment not found" },
    500: { description: "Internal server error" },
  },
});

// 3. POST /api/blog/comments — create comment
registry.registerPath({
  method: "post",
  path: "/api/blog/comments",
  summary: "Create a comment on a post",
  description: "Only for registered users",
  tags: ["Comments"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateCommentBodySchema,
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
    401: { description: "Unauthorized" },
    404: { description: "Post not found" },
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
    params: CommentIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateCommentBodySchema,
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
    404: { description: "Comment not found, or forbidden" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});

// 5. DELETE /api/blog/comments/{commentId} — delete comment
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
    404: { description: "Comment not found, or forbidden" },
    498: { description: "Access token expired" },
    500: { description: "Internal server error" },
  },
});
