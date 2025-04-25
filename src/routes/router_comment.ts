/**
 * @file router_comment.ts
 * @description The definition of comment routers.
 * There are 4 main routes:
 * 1. Get a list of comments for a post with pagination.
 * 2. Create a comment on a post, only the registered user can create a comment.
 * 3. Delete a comment, only the author or admin can delete a comment.
 * 4. Update a comment, only the author can update a comment.
 * 
 * 
 */

import { RequestHandler, Router } from "express";
import validate from "../middleware/validate";
import { CommentIdParamSchema, GetCommentsQuerySchema, CreateOrUpdateCommentBodySchema } from "../schema/schema_comment";
import commentController from "../controllers/controller_comment";
import { PostIdQuerySchema } from "../schema/schema_components";
import { auth, authAdmin } from "../middleware/auth";

const commentRouter = Router();

// The type of Req in controller is AuthRequest
// So we need to cast the controller to RequestHandler

commentRouter.get("/",
  validate({ query: GetCommentsQuerySchema }),
  commentController.getComments as unknown as RequestHandler,
);

commentRouter.get("/:commentId",
  validate({ params: CommentIdParamSchema }),
  commentController.getCommentById,
);

commentRouter.post("/",
  auth,
  validate({ body: CreateOrUpdateCommentBodySchema, query: PostIdQuerySchema }),
  commentController.createComment,
);

commentRouter.put("/:commentId",
  auth,
  validate({ params: CommentIdParamSchema, body: CreateOrUpdateCommentBodySchema }),
  commentController.updateComment,
);

commentRouter.delete("/:commentId",
  auth,
  validate({ params: CommentIdParamSchema }),
  commentController.deleteComment,
);

export default commentRouter;
