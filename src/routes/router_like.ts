/**
 * @file route_like.ts
 * @description The definition of like routers.
 * There are 3 main routes:
 * 1. Like a post, registered user only.
 * 2. Unlike a post, registered user only.
 * 3. Get total number of likes, and if current user liked the post (registered user only).
 */

import { Router } from "express";

const likeRouter = Router();

likeRouter.post("/:postId", (req, res) => {
  res.status(204).send();
});

likeRouter.delete("/:postId", (req, res) => {
  res.status(204).send();
});

likeRouter.get("/:postId", (req, res) => {
  res.status(200).send();
});

export default likeRouter;
