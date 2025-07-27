import { PostResponse } from "../../schema/schema_post";

interface SearchHit {
  id: string;
  excerpt: string | null;
}
interface SearchResult {
  hits: SearchHit[];
  total: number;
}

/**
 * Search Engine interface defining a func of a search engine.
 */
interface SearchEngine {
  initSearchEngine(): Promise<void>;
  resetSearchEngine(): Promise<void>;
  insertPosts(posts: PostResponse[], refresh: boolean): Promise<void>;
  deletePosts(postIds: string[], refresh: boolean): Promise<void>;
  getTagSuggestions(prefix: string): Promise<string[]>;
  searchPosts(
    keyword: string,
    offset: number,
    limit: number
  ): Promise<SearchResult>;
}

// Ensure the single skeleton.
let searchEngine: SearchEngine | null = null;

/**
 * @summary Factory function to create a search engine instance.
 */
const searchFactory = async (): Promise<SearchEngine> => {
  if (searchEngine) {
    return searchEngine;
  }

  searchEngine =
    process.env.SEARCH_ENGINE === "elasticsearch"
      ? await import("./service_search_es").then((module) => module.es_service)
      : await import("./service_search_ms").then((module) => module.ms_service);

  return searchEngine!;
};

export { SearchHit, SearchResult, SearchEngine, searchFactory };
