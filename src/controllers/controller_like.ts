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
 */
const likeController = {
  /**
   * GET /api/blog/likes/
   */
  async getLikeStatus(
    req: AuthRequest<unknown, unknown, PostIdQuery>,
    res: Response<LikeStatusResponse>
  ) {
    const { postId } = req.locals!.query!;
    const userId = req.locals!.user!?.id;
    const count = await prisma.like.count({
      where: { postId: postId },
    });

    const liked: boolean = userId
      ? (await prisma.like.findFirst({
          where: {
            postId: postId,
            userId: userId,
          },
        })) !== null
      : false;

    const likeStatus: LikeStatusResponse = validate_res(
      LikeStatusResponseSchema,
      { count, liked }
    );

    res.status(200).json(likeStatus);
  },

  /**
   * POST /api/blog/likes/
   * @description It's an idempotent operation, so if the user already liked the post,
   * it will not create a new like.
   */
  async likePost(
    req: AuthRequest<unknown, PostIdQuery>,
    res: Response
  ) {
    const { postId } = req.locals!.body!;
    const { id: userId } = req.locals!.user!!;

    try {
      await prisma.like.create({ data: { postId, userId } });
    } catch (err: any) {
      if (err.code === "P2003") return terminateWithErr(404, "Post not found");
      if (err.code === "P2002") return terminateWithErr(409, "Like already exists");
      throw err;
    }
    res.status(204).send();
  },

  /**
   * DELETE /api/blog/likes/
   * @description Unlike a post.
   * It's an idempotent operation, so if the user already un-liked the post,
   * it just return 204.
   */
  async unlikePost(
    req: AuthRequest<unknown, PostIdQuery>,
    res: Response
  ) {
    const { postId } = req.locals!.body!;
    const { id: userId } = req.locals!.user!!;

    try {
      await prisma.like.delete({
        where: { userId_postId: { postId, userId } },
      });
    } catch (err: any) {
      if (err.code === "P2025") return terminateWithErr(404, "Like not found");
      throw err;
    }

    res.status(204).send();
  },
};

export default likeController;
