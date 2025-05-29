import { PostResponse } from "../../schema/schema_post";

/**
 * Search Hit interface defining the structure of a search result item.
 */
interface SearchHit {
  id: string;
  excerpt: string | null;
}

/**
 * Search Result interface defining the structure of a search result list.
 */
interface SearchResult {
  hits: SearchHit[];
  total: number;
}

/**
 * Search Engine interface defining a func of a search engine.
 * @description
 * - `initSearchEngine`: Initializes the search engine, setting up any necessary connections or configurations.
 * - `resetSearchEngine`: Resets the search engine, clearing any existing data or configurations.
 * - `insertPosts`: Inserts a list of posts into the search engine, optionally refreshing the index.
 * - `getTagSuggestions`: Retrieves tag suggestions based on a given prefix.
 * - `searchPosts`: Searches for posts based on a keyword, returning results with pagination.
 */
interface SearchEngine {
  initSearchEngine(): Promise<void>;
  resetSearchEngine(): Promise<void>;
  insertPosts(posts: PostResponse[], refresh : boolean): Promise<void>;
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
 * @description Through we support both Elasticsearch and Meilisearch,
 * here is a factory function that returns the appropriate search engine
 * based on the environment variable `SEARCH_ENGINE`.
 * @returns A search engine instance
 */
const searchFactory = async (): Promise<SearchEngine> => {
  if (searchEngine) {
    return searchEngine;
  }

  // Dynamically import the search engine module based on the environment variable
  searchEngine =
    process.env.SEARCH_ENGINE === "elasticsearch"
      ? await import("./service_search_es").then((module) => module.es_service)
      : await import("./service_search_ms").then((module) => module.ms_service);

  return searchEngine!;
};

export { SearchHit, SearchResult, SearchEngine, searchFactory };
