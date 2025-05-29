import es, { initEs, resetEs } from "../../db/es";
import { extract_excerpt_highlight } from "../../utils/extract_excerpt";
import { SearchEngine, SearchHit, SearchResult } from "./service_search";
import { estypes } from "@elastic/elasticsearch";

const excerptLength = parseInt(process.env.EXCERPT_LENGTH || "300");
const index = process.env.ELASTICSEARCH_INDEX || "blog_posts";

/**
 * Elasticsearch search implementation for blog posts.
 */
const es_service: SearchEngine = {
  async searchPosts(keyword, offset, limit): Promise<SearchResult> {
    // Query Elasticsearch for posts
    const esRes = await es.search<estypes.SearchResponse<unknown>>({
      index: index,
      body: {
        from: offset,
        size: limit,
        query: {
          multi_match: {
            query: keyword,
            fields: ["tag^2", "title^2", "excerpt", "markdown"],
            fuzziness: "AUTO",
          },
        },
        highlight: {
          pre_tags: ["@@HL_START@@"],
          post_tags: ["@@HL_END@@"],
          fields: {
            excerpt: {
              number_of_fragments: 0,
              fragment_size: excerptLength,
            },
            markdown: {
              number_of_fragments: 3,
              fragment_size: excerptLength,
            },
          },
        },
        sort: [{ _score: { order: "desc" } }, { createdAt: "desc" }],
        _source: false,
      },
    });

    // Assemble the highlights from the Elasticsearch response
    const hits: SearchHit[] = esRes.hits.hits.map((hit) => {
      return {
        id: hit._id!,
        // For search results, we use the excerpt field to show the matched content
        excerpt: extract_excerpt_highlight(
          hit.highlight?.excerpt?.[0] || hit.highlight?.markdown?.[0] || null,
          excerptLength
        ),
      };
    });

    const total =
      typeof esRes.hits.total === "number"
        ? esRes.hits.total
        : esRes.hits.total!.value;

    return { hits, total };
  },

  insertPosts: async (posts, refresh = false) => {
    const ops = posts.flatMap((post) => [
      {
        index: {
          _index: index,
          _id: post.id,
        },
      },
      {
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt ?? "",
        markdown: post.markdown ?? "",
        coverUrl: post.cover,
        tag: post.tags,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    ]);

    const res = await es.bulk({ refresh: refresh, body: ops });

    if (res.errors) {
      console.error("Some Elasticsearch inserts failed:", res.items);
      throw new Error("Elasticsearch bulk insert failed");
    }
  },

  getTagSuggestions: async (prefix: string): Promise<string[]> => {
    // Query Elasticsearch for tag suggestions
    const esRes = await es.search<estypes.SearchResponse<unknown>>({
      index: index,
      body: {
        size: 0,
        aggs: {
          tag_suggestions: {
            terms: {
              field: "tag", // Because tag is an array.
              size: 10,
              order: { _count: "desc" },
              include: `${prefix}.*`,
            },
          },
        },
      },
    });

    // Extract the tag suggestions from the Elasticsearch response
    // Cast as any since it has the buckets property.
    const tags: string[] =
      (esRes.aggregations?.tag_suggestions as any)?.buckets.map(
        (bucket: any) => bucket.key
      ) ?? [];

    return tags;
  },

  initSearchEngine: async () => {
    initEs();
  },

  resetSearchEngine: async () => {
    resetEs();
  },
};

export { es_service };
