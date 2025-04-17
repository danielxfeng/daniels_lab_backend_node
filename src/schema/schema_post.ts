/**
 * @file schema_post.ts
 * @description The definition of post DTOs.
 * This file contains the schemas for the parameters and responses of the post routes.
 */

import { z } from "zod";
import {
  OffsetSchema,
  LimitSchema,
  DateTimeSchema,
  PostIdSchema,
  UsernameSchema,
  AvatarUrlSchema,
  UUIDSchema,
  CreateAtSchema,
  UpdateAtSchema,
} from "./schema_components";

//
// Schema Components
//

/**
 * @summary Schema for tags.
 * Can be a string, oran array of strings, or undefined.
 * Tags can only contain letters, numbers, dots, hyphens, or underscores.
 * The length of each tag must be between 1 and 20 characters.
 * The maximum number of tags is 10.
 */
const tagsSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((val) => {
    if (!val) return [];
    const arr = Array.isArray(val) ? val : [val];
    return arr.map((tag) => tag.trim());
  })
  .default([])
  .refine((arr) => arr.length <= 10, { message: "Maximum 10 tags allowed" })
  .refine((arr) => arr.every((tag) => /^[a-zA-Z0-9._-]{1,20}$/.test(tag)), {
    message:
      "Tags must be 1-20 characters long, and only contain letters, numbers, dots, hyphens, or underscores",
  })
  .openapi({
    title: "tags",
    description:
      "Tags for filtering posts. Accepts `?tags=tag1&tags=tag2` or `?tags=tag1`",
    example: ["tag1", "tag2"],
  });

const titleSchema = z.string().trim().min(1).max(100).openapi({
  title: "Title",
  description: "The title of a post",
  example: "Hi there!",
});

const markdownSchema = z.string().trim().min(1).max(5000).openapi({
  title: "Content",
  description: "The content of the post in Markdown format",
  example: "### Hello World\n\nThis is a sample post.",
});

//
// Request Schemas
//

/**
 * @summary Query parameters for fetching a list of posts.
 */
const GetPostListQuerySchema = z.object({
  offset: OffsetSchema,
  limit: LimitSchema,
  tags: tagsSchema,
  from: DateTimeSchema.optional().openapi({
    title: "from",
    description: "Start date for filtering posts",
  }),
  to: DateTimeSchema.optional().openapi({
    title: "to",
    description: "End date for filtering posts",
  }),
});

/**
 * @summary Request body for creating or updating a post.
 */
const CreateOrUpdatePostBodySchema = z.object({
  title: titleSchema,
  markdown: markdownSchema,
  tags: tagsSchema,
  createdAt: CreateAtSchema.optional(),
  updatedAt: UpdateAtSchema.optional(),
});

//
// Response Schemas
//

/**
 * @summary Schema for a single post response.
 */
const PostResponseSchema = z.object({
  id: PostIdSchema,
  title: titleSchema,
  markdown: markdownSchema,
  tags: tagsSchema,
  authorId: UUIDSchema.openapi({
    title: "authorId",
    description: "ID of the author",
  }),
  authorName: UsernameSchema,
  authorAvatar: AvatarUrlSchema.nullable(),
  createdAt: CreateAtSchema,
  updatedAt: UpdateAtSchema,
});

/**
 * @summary Schema for a list of posts.
 */
const PostListResponseSchema = z.object({
  posts: z.array(PostResponseSchema), // List of posts
  total: z
    .number()
    .int()
    .nonnegative()
    .openapi({ title: "Total", description: "The number of posts" }), // Total number of posts
  offset: OffsetSchema,
  limit: LimitSchema,
});

export {
  GetPostListQuerySchema,
  CreateOrUpdatePostBodySchema,
  PostResponseSchema,
  PostListResponseSchema,
};

type GetPostListQuery = z.infer<typeof GetPostListQuerySchema>;
type CreateOrUpdatePostBody = z.infer<typeof CreateOrUpdatePostBodySchema>;
type PostResponse = z.infer<typeof PostResponseSchema>;
type PostListResponse = z.infer<typeof PostListResponseSchema>;

export type {
  GetPostListQuery,
  CreateOrUpdatePostBody,
  PostResponse,
  PostListResponse,
};
