/**
 * @file controller_tag.ts
 * @description This file contains the controller functions for handling tag-related operations.
 */

import { Response } from "express";
import prisma from "../db/prisma";
import es from "../db/es";
import { estypes } from "@elastic/elasticsearch";
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
    const { tag: prefix } = req.query;

    // Query Elasticsearch for tag suggestions
    const esRes = await es.search<estypes.SearchResponse<unknown>>({
      index: "posts",
      body: {
        size: 0,
        query: { prefix: { "tag.keyword": prefix } },
        aggs: {
          tag_suggestions: {
            terms: {
              field: "tag.keyword",
              size: 10,
              order: { _count: "desc" },
            },
          },
        },
      },
    });

    // Extract the tag suggestions from the Elasticsearch response
    // Cast as any since it has the buckets property.
    const tags: TagsResponse = {
      tags:
        (esRes.aggregations?.tag_suggestions as any)?.buckets.map(
          (bucket: any) => bucket.key
        ) ?? [],
    };

    res
      .setHeader("Cache-Control", "no-store")
      .status(200)
      .json(validate_res(TagsResponseSchema, tags));
  },
};

export default tagController;
