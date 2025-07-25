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

type PostWithAuthorTag = Prisma.PostGetPayload<typeof includeTags>;

/**
 * @summary Generate Prisma `data` to create or update a post with tags
 * helper for `POST /posts` and `PUT /posts/:id`"
 */
const createOrUpdateData = (
  req: AuthRequest<unknown, CreateOrUpdatePostBody>,
  isUpdate: boolean
): Prisma.PostCreateArgs["data"] | Prisma.PostUpdateArgs["data"] => {
  const { title, markdown, tags, coverUrl, createdAt, updatedAt } =
    req.locals!.body!;

  const { id } = req.locals!.user!!;

  const deleteManyClause = isUpdate ? { deleteMany: {} } : {};

  return {
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
  };
};

/**
 * @summary Maps the Prisma post response to the PostResponse schema.
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
    const { offset, limit, tags, from, to } = req.locals!.query!;

    const where: any = {};

    if (tags.length) where.PostTag = { some: { tag: { name: { in: tags } } } };

    if (from || to) {
      where.createdAt = {};
      where.createdAt.gte = from ? new Date(from) : new Date(0);
      where.createdAt.lte = to ? new Date(to) : new Date();
    }

    const postsQuery = async () => {
      return prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        ...includeTags,
      });
    };

    const postsCount = async () => {
      return prisma.post.count({
        where,
      });
    };

    const [postsFromDb, total] = await Promise.all([
      postsQuery(),
      postsCount(),
    ]);

    const posts = postsFromDb.map((p) => {
      return mapPostListResponse(p, true);
    });

    const response = validate_res(PostListResponseSchema, {
      posts,
      total,
      offset,
      limit,
    });

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

    const post: PostWithAuthorTag | null = await prisma.post.findUnique({
      where: { slug },
      ...includeTags,
    });

    if (!post) terminateWithErr(404, "Post not found");

    const response = validate_res(
      PostResponseSchema,
      mapPostListResponse(post!, false) // null is checked above
    );

    res.status(200).json(response);
  },

  /**
   * @summary GET /posts/search
   */
  async searchPosts(
    req: AuthRequest<unknown, unknown, KeywordSearchQuery>,
    res: Response<PostListResponse>
  ) {
    const { keyword, offset, limit } = req.locals!.query!;

    const SearchEngine = await searchFactory();

    const { hits, total } = await SearchEngine.searchPosts(
      keyword,
      offset,
      limit
    );

    if (total === 0) {
      res.status(200).json({
        posts: [],
        total: 0,
        offset,
        limit,
      });
      return;
    }

    const sqlRes = await prisma.post.findMany({
      where: {
        id: { in: hits.map((h) => h.id!) }, // We checked "!" above
      },
      ...includeTags,
    });

    const posts = sqlRes.map((item) => mapPostListResponse(item, true));

    const postsWithHighlights = posts.map((post) => {
      const hl = hits.find((h) => h.id === post.id);
      if (!hl) return post;
      // We replace the excerpt with the highlight excerpt if it exists
      if (hl.excerpt) post.excerpt = hl.excerpt;
      return post;
    });

    const response = validate_res(PostListResponseSchema, {
      posts: postsWithHighlights,
      total: total,
      offset,
      limit,
    });

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
    const data = createOrUpdateData(
      req,
      false
    ) as Prisma.PostCreateArgs["data"];

    let post: Prisma.PostGetPayload<{ include: {} }> | null = null;

    // Try to create the post, retry if the slug is not unique
    let retry: number = 3;

    let slug: string = generateSlug(data.title as string);
    while (retry > 0) {
      try {
        post = await prisma.post.create({
          data: {
            ...(data as Prisma.PostCreateInput),
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

    // It would be very wired if we are here
    if (!post) terminateWithErr(500, "Post not created");

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

    const data = createOrUpdateData(req, true) as Prisma.PostUpdateArgs["data"];

    let post = null;

    try {
      post = await prisma.post.update({
        where: { id: postId, authorId: req.locals!.user!!.id },
        data,
        ...includeTags,
      });
    } catch (error: any) {
      if (error.code === "P2025")
        return terminateWithErr(404, "Post not found, or permission denied");
      throw error;
    }

    const response = validate_res(
      PostResponseSchema,
      mapPostListResponse(post, false)
    );

    res.status(200).json(response);
  },

  /**
   * @summary DELETE /posts/:id
   */
  async deletePost(req: AuthRequest<PostIdQuery>, res: Response) {
    const { postId } = req.locals!.params!;

    // ABAC control
    const authCondition = req.locals!.user!!.isAdmin
      ? undefined
      : { authorId: req.locals!.user!!.id };

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
