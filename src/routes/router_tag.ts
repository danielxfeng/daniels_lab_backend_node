/**
 * @file route_tag.ts
 * @description The definition of tags routers.
 * There is 2 routes:
 * 1. Get the hot tags.
 * 2. Get the tags by search.
 */

import { Router } from "express";

const tagRouter = Router();

tagRouter.get("/hot", (req, res) => {
  res.status(200).send();
});

tagRouter.get("/:search", (req, res) => {
  res.status(200).send();
});

export default tagRouter;
