/**
 * @file router_tag.ts
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

tagRouter.get("/search", (req, res) => {
  const searchQuery = req.query.q || ""; // Assuming the search query is passed as a query parameter 'q'
  res.status(200).send({ search: searchQuery });
});

export default tagRouter;
