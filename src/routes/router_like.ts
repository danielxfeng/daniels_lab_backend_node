/**
 * @file router_like.ts
 */

import { Router } from "express";
import validate from "../middleware/validate";
import { PostIdQuerySchema } from "../schema/schema_components";
import likeController from "../controllers/controller_like";
import { auth, optAuth } from "../middleware/auth";

const likeRouter = Router();

likeRouter.post("/",
  auth,
  validate({ body : PostIdQuerySchema }),
  likeController.likePost,
);

likeRouter.delete("/",
  auth,
  validate({ body : PostIdQuerySchema }),
  likeController.unlikePost,
);

likeRouter.get("/",
  optAuth,
  validate({ query: PostIdQuerySchema }),
  likeController.getLikeStatus,
);

export default likeRouter;
