/**
 * @file schema_post.ts
 * @description The definition of post DTOs.
 * This file contains the schemas for the parameters and responses of the post routes.
 */

import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import {
  OffsetSchema,
  LimitSchema,
  DateTimeSchema,
  PostSlugSchema,
  UsernameSchema,
  UrlSchema,
  UUIDSchema,
  CreateAtSchema,
  UpdateAtSchema,
  TotalOutputSchema,
  OffsetOutputSchema,
  LimitOutputSchema,
  PostIdSchema,
} from "./schema_components";

import { tagsSchema } from "./schema_tag";

extendZodWithOpenApi(z);

//
// Schema Components
//

const titleSchema = z.string().trim().min(1).max(100).openapi({
  title: "Title",
  description: "The title of a post",
  example: "Hi there!",
});

const titleReturnSchema = z.string().trim().min(1).openapi({
  title: "Title",
  description: "The title of a post",
  example: "Hi there!",
});

const markdownSchema = z.string().trim().min(1).max(20000).openapi({
  title: "Content",
  description: "The content of the post in Markdown format",
  example: "### Hello World\n\nThis is a sample post.",
});

const excerptSchema = z.string().openapi({
  title: "Excerpt",
  description: "The excerpt of the post",
  example: "This is a sample post.",
});

//
// Request Schemas
//

const GetPostListQuerySchema = z.object({
  offset: OffsetSchema,
  limit: LimitSchema,
  tags: tagsSchema,
  from: DateTimeSchema.optional().openapi({
    title: "From",
    description: "Start date for filtering posts",
  }),
  to: DateTimeSchema.optional().openapi({
    title: "To",
    description: "End date for filtering posts",
  }),
});

const CreateOrUpdatePostBodySchema = z.object({
  title: titleSchema,
  markdown: markdownSchema,
  coverUrl: UrlSchema,
  tags: tagsSchema,
  createdAt: CreateAtSchema.optional(),
  updatedAt: UpdateAtSchema.optional(),
});

//
// Response Schemas
//

const PostResponseSchema = z.object({
  id: PostIdSchema,
  title: titleReturnSchema,
  slug: PostSlugSchema,
  excerpt: excerptSchema,
  cover: UrlSchema,
  markdown: markdownSchema.nullable(),
  tags: tagsSchema,
  authorId: UUIDSchema.openapi({
    title: "authorId",
    description: "ID of the author",
  }),
  authorName: UsernameSchema,
  authorAvatar: UrlSchema.nullable(),
  createdAt: CreateAtSchema,
  updatedAt: UpdateAtSchema,
});

const PostListResponseSchema = z.object({
  posts: z.array(PostResponseSchema),
  total: TotalOutputSchema,
  offset: OffsetOutputSchema,
  limit: LimitOutputSchema,
});

//
// For ElasticSearch
//

const KeywordSearchQuerySchema = z.object({
  keyword: z.string().min(1).max(100).openapi({
    title: "Keyword",
    description: "The keyword to search for",
    example: "Hello",
  }),
  offset: OffsetSchema,
  limit: LimitSchema,
});

export {
  GetPostListQuerySchema,
  CreateOrUpdatePostBodySchema,
  KeywordSearchQuerySchema,
  PostResponseSchema,
  PostListResponseSchema,
};

// Inferred the types

type GetPostListQuery = z.infer<typeof GetPostListQuerySchema>;

type CreateOrUpdatePostBody = z.infer<typeof CreateOrUpdatePostBodySchema>;

type PostResponse = z.infer<typeof PostResponseSchema>;

type PostListResponse = z.infer<typeof PostListResponseSchema>;

type KeywordSearchQuery = z.infer<typeof KeywordSearchQuerySchema>;

export type {
  GetPostListQuery,
  CreateOrUpdatePostBody,
  PostResponse,
  PostListResponse,
  KeywordSearchQuery,
};
