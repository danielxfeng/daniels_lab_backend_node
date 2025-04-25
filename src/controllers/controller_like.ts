import { Response } from "express";
import prisma from "../db/prisma";
import { LikeStatusResponse } from "../schema/schema_like";
import { LikeStatusResponseSchema } from "../schema/schema_like";
import { PostIdQuery } from "../schema/schema_components";
import { AuthRequest } from "../types/type_auth";
import { validate_res } from "../utils/validate_res";
import { terminateWithErr } from "../utils/terminate_with_err";

/**
 * @summary likeController
 * @description Handles the like related operations:
 * - Get like status
 * - Like a post
 * - Unlike a post
 */
const likeController = {
  /**
   * GET /api/blog/likes/:postId
   */
  async getLikeStatus(
    req: AuthRequest<PostIdQuery>,
    res: Response<LikeStatusResponse>
  ) {
    // fetch the param from the request
    const { postId } = req.params;
    const userId = req.user?.id;

    // Get the count of likes for the post
    const count = await prisma.like.count({
      where: { postId: postId },
    });

    // Get the like status, set to false if userId is not present
    const liked: boolean = userId
      ? (await prisma.like.findFirst({
          where: {
            postId: postId,
            userId: userId,
          },
        })) !== null
      : false;

    // Validate the response
    const likeStatus: LikeStatusResponse = validate_res(
      LikeStatusResponseSchema,
      { count, liked }
    );

    // Return the response
    res.status(200).json(likeStatus);
  },

  /**
   * POST /api/blog/likes/
   * @description It's an idempotent operation, so if the user already liked the post,
   * it will not create a new like.
   */
  async likePost(
    req: AuthRequest<unknown, unknown, PostIdQuery>,
    res: Response
  ) {
    const { postId } = req.query;
    const { id: userId } = req.user!;

    // Pre-check if the postId is valid.
    // Pre-check if the postId is valid.
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    // Check if the post exists.
    if (!post) terminateWithErr(404, "Post not found.");

    // Create a new user.
    await prisma.like.create({ data: { postId: postId, userId: userId } });

    // Return the response
    res.status(204).send();
  },

  /**
   * DELETE /api/blog/likes/
   * @description Unlike a post.
   * It's an idempotent operation, so if the user already un-liked the post,
   * it just return 204.
   */
  async unlikePost(
    req: AuthRequest<unknown, unknown, PostIdQuery>,
    res: Response
  ) {
    const { postId } = req.query;
    const { id: userId } = req.user!;

    // Pre-check if the postId is valid.
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    // Check if the post exists.
    if (!post) return terminateWithErr(404, "Post not found.");

    // Delete the like, it's an idempotent operation.
    await prisma.like.deleteMany({
      where: { postId: postId, userId: userId },
    });

    // Return the response
    res.status(204).send();
  },
};

export default likeController;
