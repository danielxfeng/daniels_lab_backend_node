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
  AvatarUrlSchema,
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

const markdownSchema = z.string().trim().min(1).max(5000).openapi({
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

/**
 * @summary Query parameters for fetching a list of posts.
 */
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
  title: titleReturnSchema,
  slug: PostSlugSchema,
  excerpt: excerptSchema,
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

const PostSchemaEsQuerySchema = z.object({
  query: z.object({
    multi_match: z.object({
      query: z.string(),
      fields: z.tuple([
        z.literal("tag^3"),
        z.literal("title^2"),
        z.literal("markdown"),
      ]),
    }),
  }),
  highlight: z.object({
    pre_tags: z.array(z.literal("**")),
    post_tags: z.array(z.literal("**")),
    fields: z.object({
      title: z.object({
        number_of_fragments: z.literal(1),
        fragment_size: z.number(),
      }),
      markdown: z.object({
        number_of_fragments: z.literal(1),
        fragment_size: z.number().default(100),
      }),
    }),
  }),
  from: OffsetOutputSchema,
  size: LimitOutputSchema,
  sort: z.tuple([
    z.object({ _score: z.literal("desc") }),
    z.object({ createdAt: z.literal("desc") }),
  ]),
  _source: z.literal(false),
});

const PostHitResEsSchema = z.object({
  _id: PostIdSchema,
  _score: z.number(),
  highlight: z
    .object({
      title: titleReturnSchema.optional(),
      markdown: excerptSchema.optional(),
    })
    .optional(),
});

const PostHitsResEsSchema = z.object({
  hits: z.object({
    total: z.object({
      value: z.number(),
    }),
    hits: z.array(PostHitResEsSchema),
  }),
});

export {
  GetPostListQuerySchema,
  CreateOrUpdatePostBodySchema,
  KeywordSearchQuerySchema,
  PostSchemaEsQuerySchema,
  PostHitsResEsSchema,
  PostResponseSchema,
  PostListResponseSchema,
};

// Inferred the types

/**
 * @summary Schema for the query parameters of the post list
 */
type GetPostListQuery = z.infer<typeof GetPostListQuerySchema>;

/**
 * @summary Schema for the body parameters of creating or updating a post
 */
type CreateOrUpdatePostBody = z.infer<typeof CreateOrUpdatePostBodySchema>;

/**
 * @summary Schema for the validated post response
 */
type PostResponse = z.infer<typeof PostResponseSchema>;

/**
 * @summary Schema for the validated post list response
 */
type PostListResponse = z.infer<typeof PostListResponseSchema>;

/**
 * @summary Schema for the validated keyword search query
 */
type KeywordSearchQuery = z.infer<typeof KeywordSearchQuerySchema>;

/**
 * @summary Schema for the validated post search query
 */
type PostSchemaEsQuery= z.infer<typeof PostSchemaEsQuerySchema>;

/**
 * @summary Schema for the validated post search response
 */
type PostHitsResEs = z.infer<typeof PostHitsResEsSchema>;

export type {
  GetPostListQuery,
  CreateOrUpdatePostBody,
  PostResponse,
  PostListResponse,
  KeywordSearchQuery,
  PostSchemaEsQuery,
  PostHitsResEs,
};
