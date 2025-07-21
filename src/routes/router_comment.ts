/**
 * @file router_comment.ts
 */

import { Router } from "express";
import validate from "../middleware/validate";
import {
  CommentIdParamSchema,
  GetCommentsQuerySchema,
  CreateCommentBodySchema,
  UpdateCommentBodySchema,
} from "../schema/schema_comment";
import commentController from "../controllers/controller_comment";
import { auth } from "../middleware/auth";

const commentRouter = Router();

commentRouter.get(
  "/",
  validate({ query: GetCommentsQuerySchema }),
  commentController.getComments
);

commentRouter.get(
  "/:commentId",
  validate({ params: CommentIdParamSchema }),
  commentController.getCommentById
);

commentRouter.post(
  "/",
  auth,
  validate({ body: CreateCommentBodySchema }),
  commentController.createComment
);

commentRouter.put(
  "/:commentId",
  auth,
  validate({ params: CommentIdParamSchema, body: UpdateCommentBodySchema }),
  commentController.updateComment
);

commentRouter.delete(
  "/:commentId",
  auth,
  validate({ params: CommentIdParamSchema }),
  commentController.deleteComment
);

export default commentRouter;
