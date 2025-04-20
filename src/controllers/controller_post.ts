import { Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../db/prisma";
import {
  GetPostListQuery,
  CreateOrUpdatePostBody,
  PostResponse,
  PostListResponse,
} from "../schema/schema_post";
import { PostListResponseSchema } from "../schema/schema_post";
import { AuthRequest } from "../types/type_auth";
import { validate_res } from "../utils/validate_res";
import { auth } from "../middleware/auth";

/**
 * @summary Type retrieved from Prisma for the Post model with author and tags.
 */
type PostWithAuthorTag = Prisma.PostGetPayload<{
  include: {
    author: {
      select: { id: true; username: true; avatarUrl: true; deletedAt: true };
    };
    PostTag: { include: { tag: true } };
  };
}>;

/**
 * @summary Maps the Prisma post response to the PostResponse schema.
 * @param post the Prisma post response
 * @returns the mapped PostResponse
 */
const mapPostListResponse = (post: PostWithAuthorTag): PostResponse => ({
  title: post.title,
  tags: post.PostTag.map((t) => t.tag.name),
  id: post.id,
  markdown: post.markdown,
  authorId: post.author.id,
  authorName: post.author.deletedAt ? "Deleted User" : post.author.username,
  authorAvatar: post.author.deletedAt ? null : post.author.avatarUrl,
  createdAt: post.createdAt.toISOString(),
  updatedAt: post.updatedAt.toISOString(),
});

/**
 * @summary The post controller for handling post-related requests.
 * @description This controller handles the following requests:
 * - GET /posts: Get a list of posts with optional filters
 * - POST /posts: Create a new post
 * - PUT /posts/:id: Update an existing post
 * - DELETE /posts/:id: Delete a post
 * - GET /posts/:id: Get a post by ID
 */
const postController = {
  /**
   * @summary GET /posts
   * @description Get a list of posts with optional filters
   */
  async getPostList(
    req: AuthRequest<unknown, unknown, GetPostListQuery>,
    res: Response
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
};

export default postController;

export type { PostWithAuthorTag };
