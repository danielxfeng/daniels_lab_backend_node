import e, { Response } from "express";
import { Post, Prisma } from "@prisma/client";
import prisma from "../db/prisma";
import {
  GetPostListQuery,
  CreateOrUpdatePostBody,
  PostResponse,
  PostListResponse,
  PostResponseSchema,
} from "../schema/schema_post";
import { PostIdQuery, PostSlugQuery } from "../schema/schema_components";
import { PostListResponseSchema } from "../schema/schema_post";
import { AuthRequest } from "../types/type_auth";
import { validate_res } from "../utils/validate_res";
import { terminateWithErr } from "../utils/terminate_with_err";
import { generateSlug } from "../utils/generate_slug";
import { extract_excerpt } from "../utils/extract_excerpt";

// The length of the excerpt
const excerptLength = parseInt(process.env.EXCERPT_LENGTH || "100");

/**
 * @summary Include tags and author in the Prisma query
 * @description helper for `GET /posts` and `GET /posts/:id`
 */
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
  const { title, markdown, tags, createdAt, updatedAt } = req.body;

  // Extract the user ID from the request
  // `req.user!` is used to assert that the user is not null
  const { id } = req.user!;

  const deleteManyClause = isUpdate ? { deleteMany: {} } : {};

  return {
    data: {
      title,
      markdown,
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
 * @returns the mapped PostResponse
 */
const mapPostListResponse = (post: PostWithAuthorTag): PostResponse => ({
  title: post.title,
  tags: post.PostTag.map((t) => t.tag.name),
  id: post.id,
  slug: post.slug,
  excerpt: extract_excerpt(post.markdown, excerptLength),
  markdown: post.markdown,

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
    const { offset, limit, tags, from, to } = req.query;

    // Initializes the `why` for `prisma`
    const where: any = {};

    // add `tags`, complicated because of the many-to-many relationship
    if (tags.length) where.PostTag = { some: { tag: { name: { in: tags } } } };

    // add `from` and `to`
    if (from || to) {
      where.createdAt = {};
      where.createdAt.gte = from ? from : new Date(0).toISOString();
      where.createdAt.lte = to ? to : new Date().toISOString();
    }

    // Assemble the posts query
    const postsQuery = () => {
      return prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        ...includeTags,
      });
    };

    // Assemble the posts count query
    const postsCount = () => {
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
      return mapPostListResponse(p);
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
    const { slug } = req.params;

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
      mapPostListResponse(post!) // null is checked above
    );

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

    // TODO: send to Kafka
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
    const { postId } = req.params;

    const data = createOrUpdateData(req, true);

    // Find the post by ID, do this for ABAC check
    const target = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    // If the post is not found, throw a 404 error
    // Cannot remove this line because `target!` is used further down
    if (!target) terminateWithErr(404, "Post not found");

    // Check if the user is the author of the post, "!" is used because null is checked above
    if (target!.authorId !== req.user!.id) terminateWithErr(403, "Not authorized");

    // Update the post, may throw 500 when the query is invalid
    // `updateMany` is used to avoid the `unique` constraint error
    const post: Prisma.BatchPayload = await prisma.post.updateMany({
      where: { id: postId },
      ...data,
    });

    // Not found
    if (post.count === 0) terminateWithErr(404, "Post not found");

    // Find the post by ID
    const newPost = await prisma.post.findUnique({
      where: { id: postId },
      ...includeTags,
    });

    // If the post is not found, throw a 500 error
    // Cannot remove this line because `newPost!` is used further down
    if (!newPost) terminateWithErr(500, "Post not found after update");

    // Map the post to the PostResponse schema, may throw 500 when the response is invalid
    const response = validate_res(
      PostResponseSchema,
      mapPostListResponse(newPost!) // null is checked above
    );

    res.status(200).json(response);

    // TODO: send to Kafka
  },

  /**
   * @summary DELETE /posts/:id
   * @description Delete a post
   */
  async deletePost(req: AuthRequest<PostIdQuery>, res: Response) {
    const { postId } = req.params;

    // Delete the post, may throw 500 when the query is invalid
    // `deleteMany` is used to avoid the `unique` constraint error
    const post: Prisma.BatchPayload = await prisma.post.deleteMany({
      where: { id: postId },
    });

    // Not found
    if (post.count === 0) terminateWithErr(404, "Post not found");

    res.status(204).send();
  },

  // TODO: add `POST /posts/search`
};

export default postController;

export type { PostWithAuthorTag };
