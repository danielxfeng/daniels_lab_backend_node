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
  AvatarUrlSchema,
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
import { SchemaMapToValidated } from "../types/validated_type";

extendZodWithOpenApi(z);

//
// Schema components
//

/**
 * @summary A legal comment should be:
 * - 1-500 characters long
 */
const commentContentSchema = z.string().trim().min(1).max(500).openapi({
  title: "Content",
  description: "Content of the comment, max 500 characters",
  example: "This is a comment",
});

const commentIdSchema = UUIDSchema.openapi({ title: "Comment id" });

//
// Request Schemas
//

/**
 * @summary Schema for the query parameters to get comments.
 */
const GetCommentsQuerySchema = z.object({
  postId: PostIdSchema,
  offset: OffsetSchema,
  limit: LimitSchema,
});

/**
 * @summary Schema for the request body to create/update a comment.
 */
const CreateOrUpdateCommentBodySchema = z.object({
  content: commentContentSchema,
});

/**
 * @summary Schema for the comment ID parameter.
 */
const CommentIdParamSchema = z.object({
  commentId: commentIdSchema,
});

//
// Response Schemas
//

/**
 * @summary Schema for the comment response.
 */
const CommentResponseSchema = z.object({
  id: commentIdSchema,
  postId: PostIdSchema,
  authorId: AuthorIdSchema,
  authorName: UsernameSchema,
  authorAvatar: AvatarUrlSchema.nullable(),
  content: commentContentSchema,
  createdAt: CreateAtSchema,
  updatedAt: UpdateAtSchema,
});

/**
 * @summary Schema for the list of comments response.
 */
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
  CreateOrUpdateCommentBodySchema,
  CommentIdParamSchema,
  CommentResponseSchema,
  CommentsListResponseSchema,
};

// Inferred Types

/**
 * @summary Schema Maps for comment requests
 */
export const CommentReqSchemaMaps = {
  getComments: { query: GetCommentsQuerySchema },
  createComment: {
    query: PostIdQuerySchema,
    body: CreateOrUpdateCommentBodySchema,
  },
  updateComment: { body: CreateOrUpdateCommentBodySchema },
  deleteComment: { params: CommentIdParamSchema },
} as const;

/**
 * @summary Type for the validated comment request
 */
type CommentValidatedReq = SchemaMapToValidated<typeof CommentReqSchemaMaps>;

/**
 * @summary Type for the comment response
 */
type CommentResponse = z.infer<typeof CommentResponseSchema>;

/**
 * @summary Type for the list of comments response
 */
type CommentsListResponse = z.infer<typeof CommentsListResponseSchema>;

export type { CommentValidatedReq, CommentResponse, CommentsListResponse };
