/**
 * @file router_post.ts
 * @description Defines all routes for managing blog posts.
 * There are 5 main routes:
 * 1. Get a list of blog posts with pagination and filtering.
 * 2. Get a single post.
 * 3. Create a new blog post (markdown format), only admin user can create a post.
 * 4. Update a blog post (markdown format), only admin user can update a post.
 * 5. Delete a blog post, only admin user can delete a post.
 */

import { Router } from "express";

const postRouter = Router();

postRouter.get("/posts", (req, res) => {
  res.status(200).json({ message: "Fetch post list (to be implemented)" });
});

postRouter.get("/posts/:postId", (req, res) => {
  res.status(200).json({ message: "Fetch single post with comments" });
});

postRouter.post("/posts", (req, res) => {
  res
    .status(201)
    .json({ message: "Post creation (markdown) to be implemented" });
});

postRouter.put("/posts/:postId", (req, res) => {
  res.status(200).json({ message: "Post update to be implemented" });
});

postRouter.delete("/posts/:postId", (req, res) => {
  res.status(204).send();
});

export default postRouter;
