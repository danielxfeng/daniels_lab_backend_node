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
  DateTimeSchema,
  OffsetSchema,
  LimitSchema,
} from "./schema_components";

extendZodWithOpenApi(z);

//
// Schema components
//

/**
 * @summary A legal comment should be:
 * - 1-500 characters long
 */
const commentContentSchema = z.string().min(1).max(500).openapi({
  title: "Content",
  description: "Content of the comment, max 500 characters",
  example: "This is a comment",
});

//
// Request Schemas
//

/**
 * @summary Schema for the query parameters to get comments.
 */
const GetCommentsQuerySchema = PostIdSchema.merge(
  z.object({
    offset: OffsetSchema,
    limit: LimitSchema,
  })
);

/**
 * @summary Schema for the request body to create a comment.
 */
const CreateCommentBodySchema = PostIdSchema.merge(
  z.object({
    content: commentContentSchema,
  })
);

/**
 * @summary Schema for the request body to update a comment.
 */
const UpdateCommentBodySchema = z.object({
  content: commentContentSchema,
});

/**
 * @summary Schema for the comment ID parameter.
 */
const CommentIdParamSchema = z.object({
  commentId: UUIDSchema.openapi({
    title: "Comment id",
    description: "Comment ID",
  }),
});

//
// Response Schemas
//

/**
 * @summary Schema for the comment response.
 */
const CommentResponseSchema = PostIdSchema.merge(
  z.object({
    id: UUIDSchema.openapi({
      title: "Comment ID",
      description: "The ID of a comment",
    }),
    authorId: UUIDSchema.openapi({
      title: "Author ID",
      description: "ID of the author",
    }),
    authorName: UsernameSchema,
    authorAvatar: AvatarUrlSchema.nullable(),
    content: commentContentSchema,
    createdAt: DateTimeSchema.openapi({
      title: "Created At",
      description: "When the comment was created",
    }),
    updatedAt: DateTimeSchema.openapi({
      title: "Updated At",
      description: "When the comment was last updated",
    }),
  })
);

/**
 * @summary Schema for the list of comments response.
 */
const CommentsListResponseSchema = z.object({
  comments: z
    .array(CommentResponseSchema)
    .openapi({ title: "The array of comments." }),
  total: z
    .number()
    .int()
    .nonnegative()
    .openapi({ title: "The total number of comments" }),
  offset: OffsetSchema,
  limit: LimitSchema,
});

export {
  GetCommentsQuerySchema,
  CreateCommentBodySchema,
  UpdateCommentBodySchema,
  CommentIdParamSchema,
  CommentResponseSchema,
  CommentsListResponseSchema,
};

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
