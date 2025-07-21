/**
 * @file schema_comment.ts
 * @description The definition of comment DTOs.
 * This file contains the schemas for the parameters and responses of the comment routes.
 */
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import {
  UUIDSchema,
  PostIdSchema,
  UsernameSchema,
  UrlSchema,
  OffsetSchema,
  LimitSchema,
  OffsetOutputSchema,
  LimitOutputSchema,
  CreateAtSchema,
  UpdateAtSchema,
  TotalOutputSchema,
  AuthorIdSchema,
  PostIdQuerySchema,
} from "./schema_components";

extendZodWithOpenApi(z);

//
// Schema components
//

const commentContentSchema = z.string().trim().min(1).max(500).openapi({
  title: "Content",
  description: "Content of the comment, max 500 characters",
  example: "This is a comment",
});

const commentIdSchema = UUIDSchema.openapi({ title: "Comment id" });

//
// Request Schemas
//

const GetCommentsQuerySchema = z.object({
  postId: PostIdSchema,
  offset: OffsetSchema,
  limit: LimitSchema,
});

const CreateCommentBodySchema = z.object({
  postId: PostIdSchema,
  content: commentContentSchema,
});

const UpdateCommentBodySchema = z.object({
  content: commentContentSchema,
});

const CommentIdParamSchema = z.object({
  commentId: commentIdSchema,
});

//
// Response Schemas
//

const CommentResponseSchema = z.object({
  id: commentIdSchema,
  postId: PostIdSchema,
  authorId: AuthorIdSchema,
  authorName: UsernameSchema,
  authorAvatar: UrlSchema.nullable(),
  content: commentContentSchema,
  createdAt: CreateAtSchema,
  updatedAt: UpdateAtSchema,
});

const CommentsListResponseSchema = z.object({
  comments: z
    .array(CommentResponseSchema)
    .openapi({ title: "The array of comments." }),
  total: TotalOutputSchema,
  offset: OffsetOutputSchema,
  limit: LimitOutputSchema,
});

export {
  GetCommentsQuerySchema,
  CreateCommentBodySchema,
  UpdateCommentBodySchema,
  CommentIdParamSchema,
  CommentResponseSchema,
  CommentsListResponseSchema,
};

// Inferred Types

type GetCommentsQuery = z.infer<typeof GetCommentsQuerySchema>;

type CreateCommentBody = z.infer<typeof CreateCommentBodySchema>;

type UpdateCommentBody = z.infer<typeof UpdateCommentBodySchema>;

type CommentIdParam = z.infer<typeof CommentIdParamSchema>;

type CommentResponse = z.infer<typeof CommentResponseSchema>;

type CommentsListResponse = z.infer<typeof CommentsListResponseSchema>;

export type {
  GetCommentsQuery,
  CreateCommentBody,
  UpdateCommentBody,
  CommentIdParam,
  CommentResponse,
  CommentsListResponse,
};
