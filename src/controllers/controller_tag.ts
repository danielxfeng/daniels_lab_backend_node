/**
 * @file controller_tag.ts
 * @description This file contains the controller functions for handling tag-related operations.
 */

import { Response } from "express";
import prisma from "../db/prisma";
import {
  TagQuery,
  TagsResponse,
  TagsResponseSchema,
} from "../schema/schema_tag";
import { AuthRequest } from "../types/type_auth";
import { validate_res } from "../utils/validate_res";

/**
 * @summary tagController
 * @description Handles the tag related operations:
 * - Get hot tags
 * - Search hot tags by given prefix
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

    // Validate the response
    const tagsResponse: TagsResponse = validate_res(TagsResponseSchema, {
      tags: hotTags.map((tag) => tag.name),
    });

    // Return the response
    return res.status(200).json(tagsResponse);
  },

  /**
   * @summary Get /api/blog/tags/search
   * @description Search for tags by given prefix
   */
  async searchTags(
    req: AuthRequest<unknown, unknown, TagQuery>,
    res: Response<TagsResponse>
  ) {
    //TODO use ElasticSearch
    res.setHeader("Cache-Control", "no-store").status(200).json({
      tags: [],
    });
  },
};

export default tagController;
