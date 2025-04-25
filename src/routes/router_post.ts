/**
 * @file router_post.ts
 * @description Defines all routes for managing blog posts.
 * There are 5 main routes:
 * 1. Get a list of blog posts with pagination and filtering.
 * 2. Get a single post.
 * 3. Search posts by keyword.
 * 4. Create a new blog post (markdown format), only admin user can create a post.
 * 5. Update a blog post (markdown format), only admin user can update a post.
 * 6. Delete a blog post, only admin user can delete a post.
 */

import { Router } from "express";

const postRouter = Router();

postRouter.get("/", (req, res) => {
  res.status(200).json({ message: "Fetch post list (to be implemented)" });
});

postRouter.get("/:postId", (req, res) => {
  res.status(200).json({ message: "Fetch single post with comments" });
});

postRouter.get("/search", (req, res) => {
  res.status(200).json({ message: "Search posts by keyword" });
});

postRouter.post("/", (req, res) => {
  res
    .status(201)
    .json({ message: "Post creation (markdown) to be implemented" });
});

postRouter.put("/:postId", (req, res) => {
  res.status(200).json({ message: "Post update to be implemented" });
});

postRouter.delete("/:postId", (req, res) => {
  res.status(204).send();
});

export default postRouter;
