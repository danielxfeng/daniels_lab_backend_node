/**
 * @file router_tag.ts
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
