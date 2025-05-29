import meili, { initMeili, resetMeili } from "../../db/meilisearch";
import { SearchEngine, SearchHit, SearchResult } from "./service_search";
import { extract_excerpt_highlight } from "../../utils/extract_excerpt";

const excerptLength = parseInt(process.env.EXCERPT_LENGTH || "300");

// Return type
type IndexedPost = {
  id: string;
  excerpt?: string;
  markdown?: string;
  _formatted?: {
    excerpt?: string;
    markdown?: string;
  };
};

type TagSuggestion = {
  value: string;
  count: number;
};

const index = meili.index(process.env.MEILISEARCH_INDEX || "blog_posts");

/**
 * Meilisearch search implementation for blog posts.
 */
const ms_service: SearchEngine = {
  async searchPosts(keyword, offset, limit): Promise<SearchResult> {
    // Get the index settings
    const res = await index.search<IndexedPost>(keyword, {
      offset,
      limit,
      attributesToHighlight: ["excerpt", "markdown"],
      attributesToCrop: ["markdown"],
      cropLength: Math.floor(excerptLength / 6),
      cropMarker: "...",
      highlightPreTag: "@@HL_START@@",
      highlightPostTag: "@@HL_END@@",
    });

    // Assemble the highlights from the Meilisearch response
    const hits: SearchHit[] = res.hits.map((doc) => ({
      id: doc.id,
      excerpt: extract_excerpt_highlight(
        doc._formatted?.excerpt || doc._formatted?.markdown || null,
        excerptLength
      ),
    }));

    const total = res.estimatedTotalHits ?? hits.length;

    return { hits, total };
  },

  insertPosts: async (posts, refresh = false) => {
    const documents = posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt ?? "",
      markdown: post.markdown ?? "",
      coverUrl: post.cover,
      tag: post.tags,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    const task = await index.addDocuments(documents);

    // Bc Meilisearch is asynchronous, but tests expect synchronous behavior,
    // So refresh is used to wait for the task to complete.
    if (refresh) {
      while (true) {
        const updatedTask = await meili.tasks.getTask(task.taskUid);
        if (updatedTask.status === "succeeded") break;
        if (updatedTask.status === "failed") {
          throw new Error(`Failed to insert posts: ${updatedTask.error}`);
        }
        // Wait a bit before checking again
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  },

  getTagSuggestions: async (prefix) => {
    // Search for tags with the given prefix
    const res = await index.searchForFacetValues({
      facetQuery: prefix,
      facetName: "tag",
    });

    const suggestions: TagSuggestion[] = res.facetHits;

    return suggestions
      .sort((a, b) => b.count - a.count) // Meilisearch does not sort by count.
      .slice(0, 10)
      .map((s) => s.value);
  },

  initSearchEngine: async () => {
    initMeili();
  },
  resetSearchEngine: async () => {
    resetMeili();
  },
};

export { ms_service };
