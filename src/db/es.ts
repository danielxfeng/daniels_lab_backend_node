/**
 * @summary es.ts
 * @description Singleton instance of Elasticsearch Client.
 */
import { Client } from "@elastic/elasticsearch";

// do this for avoid multiple instances caused by Hot Module Reloading (HMR).
const globalForES = globalThis as unknown as {
  elasticsearch: Client | undefined;
};

/**
 * @description A singleton instance of ElasticsearchClient.
 */
const es =
  globalForES.elasticsearch ??
  new Client({
    node: process.env.ELASTICSEARCH_NODE || "http://localhost:9200",
    auth: {
      username: process.env.ELASTICSEARCH_USERNAME || "elastic",
      password: process.env.ELASTICSEARCH_PASSWORD || "password",
    },
  });

/**
 * @summary Initialize Elasticsearch index.
 * @description Create an index if it doesn't exist.
 *
 * @remark
 * The `index` in ES likes a table in SQL.
 * The `mappings` in ES likes the schema in SQL.
 * The `properties` in ES likes the columns in SQL.
 */
const initEs = async () => {
  const index = "posts";

  const exists = await es.indices.exists({ index });
  if (!exists) {
    await es.indices.create({
      index,
      body: {
        mappings: {
          properties: {
            title: { type: "text" },
            markdown: { type: "text" },
            createdAt: { type: "date" },
            tag: {
              type: "keyword",
            },
          },
        },
      },
    });
    console.log("ES index created");
  } else {
    console.log("ES index already exists");
  }
};

/**
 * @summary Reset Elasticsearch index. WARNING: ALL DATA WILL BE LOST.
 * @description Delete the index and reinitialize it.
 */
const resetEs = async () => {
  const index = "posts";
  const exists = await es.indices.exists({ index });
  if (exists) {
    await es.indices.delete({ index });
    console.log("ES index deleted");
  } else {
    console.log("ES index does not exist");
  }

  initEs();
};

if (process.env.NODE_ENV !== "production") globalForES.elasticsearch = es;

export default es;
export { initEs, resetEs };
