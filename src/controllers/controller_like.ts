

import { Response } from "express";
import { Prisma } from "@prisma/client";
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
   * GET /api/blog/like/:postId
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
    return res.status(200).json(likeStatus);
  },
};

export default likeController;
