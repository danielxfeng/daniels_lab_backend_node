/**
 * @file router_tag.ts
 * @description The definition of tags routers.
 * There is 2 routes:
 * 1. Get the hot tags.
 * 2. Get the tags by search.
 */

import { Router } from "express";
import tagController from "../controllers/controller_tag";
import validate from "../middleware/validate";
import { TagQuerySchema } from "../schema/schema_tag";

const tagRouter = Router();

tagRouter.get("/hot", tagController.getHotTags);

tagRouter.get(
  "/search",
  validate({ query: TagQuerySchema }),
  tagController.searchTags
);

export default tagRouter;
