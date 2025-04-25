/**
 * @file router_like.ts
 * @description The definition of like routers.
 * There are 3 main routes:
 * 1. Like a post, registered user only.
 * 2. Unlike a post, registered user only.
 * 3. Get total number of likes, and if current user liked the post (registered user only).
 */

import { Router } from "express";
import validate from "../middleware/validate";
import { PostIdQuerySchema } from "../schema/schema_components";
import likeController from "../controllers/controller_like";
import { auth, optAuth } from "../middleware/auth";

const likeRouter = Router();

likeRouter.post("/:postId",
  auth,
  validate({ query: PostIdQuerySchema }),
  likeController.likePost,
);

likeRouter.delete("/:postId",
  auth,
  validate({ query: PostIdQuerySchema }),
  likeController.unlikePost,
);

likeRouter.get("/",
  optAuth,
  validate({ query: PostIdQuerySchema }),
  likeController.getLikeStatus,
);

export default likeRouter;
