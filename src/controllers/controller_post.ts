import { Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../db/prisma";
import {
  GetPostListQuery,
  CreateOrUpdatePostBody,
  PostResponse,
  PostListResponse,
  PostResponseSchema,
  KeywordSearchQuery,
} from "../schema/schema_post";
import { PostIdQuery, PostSlugQuery } from "../schema/schema_components";
import { PostListResponseSchema } from "../schema/schema_post";
import { AuthRequest } from "../types/type_auth";
import { validate_res } from "../utils/validate_res";
import { terminateWithErr } from "../utils/terminate_with_err";
import { generateSlug } from "../utils/generate_slug";
import { extract_excerpt } from "../utils/extract_excerpt";
import { searchFactory } from "../service/search/service_search";

// The length of the excerpt
const excerptLength = parseInt(process.env.EXCERPT_LENGTH || "300");

const includeTags = {
  include: {
    author: {
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        deletedAt: true,
      },
    },
    PostTag: { include: { tag: true } },
  },
};

type TypeIncludeTagsType = typeof includeTags;

/**
 * @summary Type retrieved from Prisma for the Post model with author and tags.
 */
type PostWithAuthorTag = Prisma.PostGetPayload<TypeIncludeTagsType>;

/**
 * @summary Generate Prisma `data` to create or update a post with tags
 *
 * helper for `POST /posts` and `PUT /posts/:id`"
 * @param req the request object
 * @returns the Prisma `data` to create or update a post.
 * NOTE: `slug` is not generated here, so you need to add it in `POST`.
 */
const createOrUpdateData = (
  req: AuthRequest<unknown, CreateOrUpdatePostBody>,
  isUpdate: boolean
): { data: Prisma.PostUpdateInput } => {
  // Extract the request body
  const { title, markdown, tags, coverUrl, createdAt, updatedAt } =
    req.locals!.body!;

  // Extract the user ID from the request
  // `req.locals!.user!!` is used to assert that the user is not null
  const { id } = req.locals!.user!!;

  const deleteManyClause = isUpdate ? { deleteMany: {} } : {};

  return {
    data: {
      title,
      markdown,
      cover: coverUrl,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
      author: {
        connect: { id },
      },
      PostTag: {
        ...deleteManyClause,
        create: tags.map((tagName) => ({
          tag: {
            connectOrCreate: {
              where: { name: tagName },
              create: { name: tagName },
            },
          },
        })),
      },
    },
  };
};

/**
 * @summary Maps the Prisma post response to the PostResponse schema.
 * @param post the Prisma post response
 * @param isList whether the response is for a list of posts
 * @returns the mapped PostResponse
 */
const mapPostListResponse = (
  post: PostWithAuthorTag,
  isList: boolean
): PostResponse => ({
  title: post.title,
  tags: post.PostTag.map((t) => t.tag.name),
  id: post.id,
  cover: post.cover,
  slug: post.slug,
  // For excerpt, we use the `post.excerpt` if it exists, fallback to the extracted excerpt from markdown
  excerpt: post.excerpt
    ? post.excerpt
    : extract_excerpt(post.markdown, excerptLength),

  markdown: isList ? null : post.markdown, // only return markdown when return a single post

  authorId: post.author.id,
  authorName: post.author.deletedAt ? "DeletedUser" : post.author.username,
  authorAvatar: post.author.deletedAt ? null : post.author.avatarUrl,
  createdAt: post.createdAt.toISOString(),
  updatedAt: post.updatedAt.toISOString(),
});

/**
 * @summary The post controller for handling post-related requests.
 * @description This controller handles the following requests:
 * - GET /posts: Get a list of posts with optional filters
 * - GET /posts/:id: Get a single post by ID
 * - GET /posts/search: Search for posts
 * - POST /posts: Create a new post
 * - PUT /posts/:id: Update an existing post
 * - DELETE /posts/:id: Delete a post
 */
const postController = {
  /**
   * @summary GET /posts
   * @description Get a list of posts with optional filters
   * if one of `from`, `to` is not provided, it will be set to the `0` or `now`.
   */
  async getPostList(
    req: AuthRequest<unknown, unknown, GetPostListQuery>,
    res: Response<PostListResponse>
  ) {
    // Extract query parameters from the request
    const { offset, limit, tags, from, to } = req.locals!.query!;

    // Initializes the `why` for `prisma`
    const where: any = {};

    // add `tags`, complicated because of the many-to-many relationship
    if (tags.length) where.PostTag = { some: { tag: { name: { in: tags } } } };

    // add `from` and `to`
    if (from || to) {
      where.createdAt = {};
      where.createdAt.gte = from ? new Date(from) : new Date(0);
      where.createdAt.lte = to ? new Date(to) : new Date();
    }

    // Assemble the posts query
    const postsQuery = async () => {
      return prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        ...includeTags,
      });
    };

    // Assemble the posts count query
    const postsCount = async () => {
      return prisma.post.count({
        where,
      });
    };

    // Execute the queries in parallel, may throw 500 when the query is invalid
    const [postsFromDb, total] = await Promise.all([
      postsQuery(),
      postsCount(),
    ]);

    // Map the posts to the PostResponse schema
    const posts = postsFromDb.map((p) => {
      return mapPostListResponse(p, true);
    });

    // Validate the response, may throw 500 when the response is invalid
    const response = validate_res(PostListResponseSchema, {
      posts,
      total,
      offset,
      limit,
    });

    // Send the response
    res.status(200).json(response);
  },

  /**
   * @summary GET /posts/:slug
   * @description Get a single post by ID
   */
  async getPostBySlug(
    req: AuthRequest<PostSlugQuery, unknown, unknown>,
    res: Response<PostResponse>
  ) {
    const { slug } = req.locals!.params!;

    // Find the post by Slug, may throw 500 when the query is invalid
    const post: PostWithAuthorTag | null = await prisma.post.findUnique({
      where: { slug },
      ...includeTags,
    });

    // If the post is not found, throw a 404 error
    // Cannot remove this line because `post!` is used further down
    if (!post) terminateWithErr(404, "Post not found");

    // Map the post to the PostResponse schema, may throw 500 when the response is invalid
    const response = validate_res(
      PostResponseSchema,
      mapPostListResponse(post!, false) // null is checked above
    );

    // Send the response
    res.status(200).json(response);
  },

  /**
   * @summary GET /posts/search
   * @description Search for posts
   * The pipeline is:
   * 1. Query From Search Engine (ES or Meilisearch) to get the post IDs and highlights
   * 2. Query from Prisma to get the post data
   * 3. Map the returned data to the Post Schema
   * 4. Validate the response, may throw 500 when the response is invalid
   * 5. Send the response
   */
  async searchPosts(
    req: AuthRequest<unknown, unknown, KeywordSearchQuery>,
    res: Response<PostListResponse>
  ) {
    const { keyword, offset, limit } = req.locals!.query!;

    // A singleton instance of the search engine
    const SearchEngine = await searchFactory();

    // Query Search engine for posts
    const { hits, total } = await SearchEngine.searchPosts( keyword, offset, limit );

    // If there is no content can be returned from ES, return empty.
    if (total === 0) {
      res.status(200).json({
        posts: [],
        total: 0,
        offset,
        limit,
      });
      return;
    }

    // Then query from Prisma to get the post data
    const sqlRes = await prisma.post.findMany({
      where: {
        id: { in: hits.map((h) => h.id!) }, // We checked "!" above
      },
      ...includeTags,
    });

    // Map the returned data to the Post Schema
    const posts = sqlRes.map((item) => mapPostListResponse(item, true));

    const postsWithHighlights = posts.map((post) => {
      const hl = hits.find((h) => h.id === post.id);
      if (!hl) return post;
      // We replace the excerpt with the highlight excerpt if it exists
      if (hl.excerpt) post.excerpt = hl.excerpt;
      return post;
    });

    // Validate the response, may throw 500 when the response is invalid
    const response = validate_res(PostListResponseSchema, {
      posts: postsWithHighlights,
      total: total,
      offset,
      limit,
    });

    // Send the response
    res.status(200).json(response);
  },

  /**
   * @summary POST /posts
   * @description Create a new post
   * The slug is generated from the title.
   * Will retry 3 times if the generated slug is not unique,
   * if it fails, it will throw a 500 error.
   */
  async createPost(
    req: AuthRequest<unknown, CreateOrUpdatePostBody>,
    res: Response
  ) {
    const data: { data: Prisma.PostUpdateInput } = createOrUpdateData(
      req,
      false
    );

    // Prepare the data except the slug
    let post: Prisma.PostGetPayload<null> | null = null;

    // Try to create the post, retry if the slug is not unique
    let retry: number = 3;
    // Generate a slug
    let slug: string = generateSlug(data.data.title as string);
    while (retry > 0) {
      try {
        post = await prisma.post.create({
          data: {
            // We cast here because `slug`'s type is different.
            ...(data.data as Prisma.PostCreateInput),
            slug,
          },
        });
        break;
      } catch (e: any) {
        // Unique constraint failed, retry with a new slug
        if (e.code === "P2002" && e.meta?.target?.includes("slug")) {
          slug = generateSlug(slug, true);
          retry--;
        } else {
          throw e;
        }
      }
    }

    // It would be very wired if we are here, maybe the retry is not enough?
    if (!post) terminateWithErr(500, "Post not created");

    // Send the response
    res
      .setHeader("Location", `/posts/${slug}`)
      .status(201)
      .json({ message: "Post created" });
  },

  /**
   * @summary PUT /posts/:id
   * @description Update an existing post
   * There is an ABAC check to ensure that the user is the author of the post.
   * The admin can only delete the post, but not update it.
   * and the slug is not updated.
   */
  async updatePost(
    req: AuthRequest<PostIdQuery, CreateOrUpdatePostBody>,
    res: Response<PostResponse>
  ) {
    const { postId } = req.locals!.params!;

    const data = createOrUpdateData(req, true);

    // Update the post
    let post = null;

    try {
      post = await prisma.post.update({
        where: { id: postId, authorId: req.locals!.user!!.id },
        ...data,
        ...includeTags,
      });
    } catch (error: any) {
      // If the post is not found, throw a 404 error
      if (error.code === "P2025")
        return terminateWithErr(404, "Post not found, or permission denied");
      throw error;
    }

    // Map the post to the PostResponse schema, may throw 500 when the response is invalid
    const response = validate_res(
      PostResponseSchema,
      mapPostListResponse(post, false)
    );

    res.status(200).json(response);
  },

  /**
   * @summary DELETE /posts/:id
   * @description Delete a post
   */
  async deletePost(req: AuthRequest<PostIdQuery>, res: Response) {
    const { postId } = req.locals!.params!;

    // ABAC control
    const authCondition = req.locals!.user!!.isAdmin
      ? undefined
      : { authorId: req.locals!.user!!.id };

    // Delete the post
    try {
      await prisma.post.delete({
        where: { id: postId, ...authCondition },
      });
    } catch (error: any) {
      // If the post is not found, throw a 404 error
      if (error.code === "P2025")
        return terminateWithErr(404, "Post not found, or permission denied");
      throw error;
    }

    res.status(204).send();
  },
};

export default postController;

export type { PostWithAuthorTag };
