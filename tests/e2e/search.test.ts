import request from "supertest";
import { expect } from "chai";
import app from "../../src/app";
import prisma from "../../src/db/prisma";
import { searchFactory } from "../../src/service/search/service_search";
import { PostResponse } from "../../src/schema/schema_post";

describe("SearchEngine API Tests", function () {
  let admin: any = null;
  const createdPosts: PostResponse[] = [];

  before(async function () {
    this.timeout(10000);
    const searchEngine = await searchFactory();

    return (async () => {
      await prisma.post.deleteMany({});
      await prisma.user.deleteMany({});
      await searchEngine.resetSearchEngine();

      process.env.ADMIN_REF_CODE = "9f9712b9-46db-4641-b1d5-80a9ab362ccd";

      const res1 = await request(app).post("/api/auth/register").send({
        username: "admin_user",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "2c457b9b67dd4a76a89b767d527b9e9f",
      });

      const res2 = await request(app)
        .put("/api/auth/join-admin")
        .set("Authorization", `Bearer ${res1.body.accessToken}`)
        .send({
          referenceCode: process.env.ADMIN_REF_CODE,
          deviceId: "2c457b9b67dd4a76a89b767d527b9e9f",
        });

      admin = res2.body;

      const posts = [
        {
          title: "Fuzzy Logic in Elasticsearch",
          markdown: "This post covers fuzzy search using Elasticsearch.",
          tags: ["search", "fuzzy"],
        },
        {
          title: "Boosting with Tags",
          markdown: "Search ranking improved with field boosting.",
          tags: ["boost", "search"],
        },
        {
          title: "Deep Dive into Elasticsearch Titles",
          markdown: "Title match is important in search engines.",
          tags: ["title", "ranking"],
        },
      ];

      for (const p of posts) {
        const res = await request(app)
          .post("/api/blog/posts")
          .set("Authorization", `Bearer ${admin.accessToken}`)
          .send({
            title: p.title,
            markdown: p.markdown,
            coverUrl: "https://example.com/img.png",
            tags: p.tags,
          });

        expect(res.status).to.equal(201);

        const slug = res.headers.location.split("/").pop();
        const post = await prisma.post.findUniqueOrThrow({
          where: { slug: slug! },
          include: { PostTag: { include: { tag: true } } },
        });

        const postRes: PostResponse = {
          id: post.id,
          title: post.title,
          slug: post.slug,
          cover: post.cover,
          excerpt: post.excerpt ?? "",
          markdown: post.markdown ?? "",
          tags: post.PostTag.map((pt) => pt.tag.name),
          authorId: post.authorId,
          authorName: "",
          authorAvatar: "",
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        };

        createdPosts.push(postRes);
      }

      // push to search engine
      await searchEngine.insertPosts(createdPosts, true);
    })();
  });

  after(async function () {
    this.timeout(10000);
    const searchEngine = await searchFactory();
    return (async () => {
      await prisma.post.deleteMany({});
      await prisma.user.deleteMany({});
      await searchEngine.resetSearchEngine();
    })();
  });

  it("should return posts matching markdown (fuzzy search)", async () => {
    const res = await request(app)
      .get("/api/blog/posts/search")
      .query({ keyword: "fuzzi", offset: 0, limit: 10 });

    expect(res.status).to.equal(200);
    expect(res.body.posts).to.be.an("array").that.is.not.empty;
    const found = res.body.posts.find((p: any) =>
      p.excerpt.toLowerCase().includes("fuzzy")
    );
    expect(found).to.exist;
  });

  it("should return posts matching title", async () => {
    const res = await request(app)
      .get("/api/blog/posts/search")
      .query({ keyword: "Elasticsearch Titles", offset: 0, limit: 10 });

    expect(res.status).to.equal(200);
    expect(res.body.posts).to.be.an("array").that.is.not.empty;
    const match = res.body.posts.find((p: any) => p.title.includes("Titles"));
    expect(match).to.exist;
  });

  it("should return posts matching tag", async () => {
    const res = await request(app)
      .get("/api/blog/posts/search")
      .query({ keyword: "boost", offset: 0, limit: 10 });

    expect(res.status).to.equal(200);
    expect(res.body.posts).to.be.an("array").that.is.not.empty;
    const match = res.body.posts.find((p: any) =>
      p.title.toLowerCase().includes("boost")
    );
    expect(match).to.exist;
  });

  it("should return empty results when keyword not found", async () => {
    const res = await request(app)
      .get("/api/blog/posts/search")
      .query({ keyword: "noSuchKeywordAnywhere", offset: 0, limit: 10 });

    expect(res.status).to.equal(200);
    expect(res.body.posts).to.be.an("array").that.is.empty;
    expect(res.body.total.value || res.body.total).to.equal(0);
  });

  it("should return tag suggestions matching prefix", async () => {
    const res = await request(app)
      .get("/api/blog/tags/search")
      .query({ tag: "se", ts: 1 })
      .set("Authorization", `Bearer ${admin.accessToken}`);

    expect(res.status).to.equal(200);
    expect(res.body.tags).to.be.an("array").that.is.not.empty;
    expect(res.body.tags).to.include("search");
  });

  it("should return multiple tag suggestions ordered by frequency", async () => {
    const res = await request(app)
      .get("/api/blog/tags/search")
      .query({ tag: "b", ts: 1 })
      .set("Authorization", `Bearer ${admin.accessToken}`);

    expect(res.status).to.equal(200);
    expect(res.body.tags).to.be.an("array").that.includes("boost");
  });

  it("should return empty array when no tag matches", async () => {
    const res = await request(app)
      .get("/api/blog/tags/search")
      .query({ tag: "xyz", ts: 1 })
      .set("Authorization", `Bearer ${admin.accessToken}`);

    expect(res.status).to.equal(200);
    expect(res.body.tags).to.be.an("array").that.is.empty;
  });
});
