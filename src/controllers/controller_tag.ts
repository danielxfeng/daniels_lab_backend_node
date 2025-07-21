import { Response } from "express";
import prisma from "../db/prisma";
import {
  TagQuery,
  TagsResponse,
  TagsResponseSchema,
} from "../schema/schema_tag";
import { AuthRequest } from "../types/type_auth";
import { validate_res } from "../utils/validate_res";
import { searchFactory } from "../service/search/service_search";

/**
 * @summary tagController
 * @description Handles the tag related operations:
 */
const tagController = {
  /**
   * @summary Get /api/blog/tags/hot
   */
  async getHotTags(req: AuthRequest, res: Response<TagsResponse>) {
    // Fetch the hot tags from the database
    const hotTags = await prisma.tag.findMany({
      orderBy: {
        posts: {
          _count: "desc",
        },
      },
      take: 10,
      select: {
        name: true,
      },
    });

    const tagsResponse: TagsResponse = validate_res(TagsResponseSchema, {
      tags: hotTags.map((tag) => tag.name),
    });

    res.status(200).json(tagsResponse);
  },

  /**
   * @summary Get /api/blog/tags/search
   * @description Search for tags by given prefix
   */
  async searchTags(
    req: AuthRequest<unknown, unknown, TagQuery>,
    res: Response<TagsResponse>
  ) {
    const { tag: prefix, ts } = req.locals!.query!;

    const searchEngine = await searchFactory();

    const tags = await searchEngine.getTagSuggestions(prefix);

    const tagsRes: TagsResponse = {
      tags: tags,
      ts,
    };

    res
      .setHeader("Cache-Control", "no-store")
      .status(200)
      .json(validate_res(TagsResponseSchema, tagsRes));
  },
};

export default tagController;
