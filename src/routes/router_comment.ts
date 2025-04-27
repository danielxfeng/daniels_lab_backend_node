/**
 * @file router_comment.ts
 * @description The definition of comment routers.
 * There are 4 main routes:
 * 1. Get a list of comments for a post with pagination.
 * 2. Get a comment by ID.
 * 3. Create a comment on a post, only the registered user can create a comment.
 * 4. Delete a comment, only the author or admin can delete a comment.
 * 5. Update a comment, only the author can update a comment.
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
