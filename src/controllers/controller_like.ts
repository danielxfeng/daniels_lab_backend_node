import { Response } from "express";
import prisma from "../db/prisma";
import { LikeStatusResponse } from "../schema/schema_like";
import { LikeStatusResponseSchema } from "../schema/schema_like";
import { PostIdQuery } from "../schema/schema_components";
import { AuthRequest } from "../types/type_auth";
import { validate_res } from "../utils/validate_res";

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
    const { postId } = req.locals!.params!;
    const userId = req.locals!.user!?.id;

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
    const { postId } = req.locals!.query!;
    const { id: userId } = req.locals!.user!!;

    try {
      await prisma.like.create({ data: { postId, userId } });
    } catch (err: any) {
      // If the error is a unique constraint violation, it means the like already exists
      // But it's a idempotent operation, so we can ignore it.
      if (err.code !== "P2002") throw err;
    }
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
    const { postId } = req.locals!.query!;
    const { id: userId } = req.locals!.user!!;

    try {
      await prisma.like.delete({
        where: { userId_postId: { postId, userId } },
      });
    } catch (err: any) {
      // If record not found, it means the like already exists
      // But it's a idempotent operation, so we can ignore it.
      if (err.code !== "P2025") throw err;
    }

    // Return the response
    res.status(204).send();
  },
};

export default likeController;
