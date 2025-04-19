/**
 * @file routers_comment.ts
 * @description The definition of comment routers.
 * There are 4 main routes:
 * 1. Get a list of comments for a post with pagination.
 * 2. Create a comment on a post, only the registered user can create a comment.
 * 3. Delete a comment, only the author or admin can delete a comment.
 * 4. Update a comment, only the author can update a comment.
 */

import { Router } from "express";

const commentRouter = Router();

commentRouter.get("/", (req, res) => {
  res.status(200).json({ message: "Fetch comments to be implemented" });
});

commentRouter.post("/", (req, res) => {
  res.status(201).json({ message: "Post comment is to be implemented" });
});

commentRouter.delete("/:commentId", (req, res) => {
  res.status(204).send();
});

commentRouter.put("/:commentId", (req, res) => {
  res.status(200).json({ message: "Update comment is to be implemented" });
});

export default commentRouter;
