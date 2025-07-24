/**
 * @summary meilisearch.ts
 * @description Singleton instance of Meilisearch Client.
 */

import { MeiliSearch } from "meilisearch";

// do this to avoid multiple instances caused by Hot Module Reloading (HMR).
const globalForMeili = globalThis as unknown as {
  meilisearch: MeiliSearch | undefined;
};

/**
 * @description A singleton instance of Meilisearch client.
 */
const meili =
  globalForMeili.meilisearch ??
  new MeiliSearch({
    host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
    apiKey: process.env.MEILISEARCH_API_KEY || undefined,
  });

/**
 * @summary Initialize Meilisearch index.
 * @description Create an index and configure searchable/sortable attributes.
 *
 * @remark
 * In Meilisearch, the `index` is like a table.
 * Field configuration is done via settings rather than mappings.
 */
const initMeili = async () => {
  const indexUid = process.env.MEILISEARCH_INDEX || "blog_posts";
  const index = meili.index(indexUid);

  try {
    // create index if it doesn't exist
    await meili.createIndex(indexUid, { primaryKey: "id" });
    console.log("Meili index created");
  } catch (err: any) {
    if (err.code === "index_already_exists") {
      console.log("Meili index already exists");
    } else {
      throw err;
    }
  }

  // configure searchable/sortable/filterable attributes
  await index.updateSettings({
    searchableAttributes: ["title", "markdown", "excerpt", "tag"],
    sortableAttributes: ["createdAt", "updatedAt"],
    filterableAttributes: ["tag"],
  });
};

/**
 * @summary Reset Meilisearch index. WARNING: ALL DATA WILL BE LOST.
 * @description Delete the index and reinitialize it.
 */
const resetMeili = async () => {
  const indexUid = process.env.MEILISEARCH_INDEX || "blog_posts";
  try {
    await meili.index(indexUid).delete();
    console.log("Meili index deleted");
  } catch (err: any) {
    if (err.code === "index_not_found") {
      console.log("Meili index does not exist");
    } else {
      throw err;
    }
  }

  // Reinitialize the index
  await initMeili();
};

if (process.env.NODE_ENV !== "production") globalForMeili.meilisearch = meili;

export default meili;
export { initMeili, resetMeili };
