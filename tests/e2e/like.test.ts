import request from "supertest";
import app from "../../src/app";
import { expect } from "chai";
import prisma from "../../src/db/prisma";
import { markAsUncloneable } from "worker_threads";

describe("Tag E2E Tests", () => {
  let user: any = null;
  let admin: any = null;
  let admin2: any = null;
  process.env.ADMIN_REF_CODE = "9f9712b9-46db-4641-b1d5-80a9ab362ccd";

  before(async () => {
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.like.deleteMany({});
    const userRes = await request(app).post("/api/auth/register").send({
      username: "testuser",
      password: "PASSword%123",
      confirmPassword: "PASSword%123",
      consentAt: new Date(),
      deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
    });
    const adminRes = await request(app).post("/api/auth/register").send({
      username: "adminuser",
      password: "PASSword%123",
      confirmPassword: "PASSword%123",
      consentAt: new Date(),
      deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
    });
    const adminRes2 = await request(app)
      .put("/api/auth/join-admin")
      .set("Authorization", `Bearer ${adminRes.body.accessToken}`)
      .send({
        referenceCode: "9f9712b9-46db-4641-b1d5-80a9ab362ccd",
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });
    user = userRes.body;
    admin = adminRes2.body;

    const adminRes3 = await request(app).post("/api/auth/register").send({
      username: "adminuser2",
      password: "PASSword%123",
      confirmPassword: "PASSword%123",
      consentAt: new Date(),
      deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
    });
    const adminRes4 = await request(app)
      .put("/api/auth/join-admin")
      .set("Authorization", `Bearer ${adminRes3.body.accessToken}`)
      .send({
        referenceCode: "9f9712b9-46db-4641-b1d5-80a9ab362ccd",
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });
    admin2 = adminRes4.body;
  });
  after(async () => {
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.like.deleteMany({});
  });

  beforeEach(async () => {
    await prisma.post.deleteMany({});
    await prisma.like.deleteMany({});
  });

  afterEach(async () => {
    await prisma.post.deleteMany({});
    await prisma.like.deleteMany({});
  });

  describe("POST /api/blog/likes/", () => {
    it("should like a post", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const slug = postRes.headers.location.split("/").pop();
      const postRes2 = await request(app).get(`/api/blog/posts/${slug}`);
      expect(postRes2.status).to.equal(200);

      const likeRes = await request(app)
        .post("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: postRes2.body.id,
        });

      expect(likeRes.status).to.equal(204);
    });

    it("should return 409 when liking a post that is already liked", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const slug = postRes.headers.location.split("/").pop();
      const postRes2 = await request(app).get(`/api/blog/posts/${slug}`);
      expect(postRes2.status).to.equal(200);

      const likeRes = await request(app)
        .post("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: postRes2.body.id,
        });

      expect(likeRes.status).to.equal(204);

      const likeRes2 = await request(app)
        .post("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: postRes2.body.id,
        });

      console.log("likeRes2.body", JSON.stringify(likeRes2.body));
      expect(likeRes2.status).to.equal(409);
    });

    it("should return 401 when not authenticated", async () => {
      const postRes = await request(app).post("/api/blog/posts/").send({
        title: "Test Post",
        markdown: "This is a test post.",
      });

      const likeRes = await request(app).post("/api/blog/likes/").send({
        postId: postRes.body.id,
      });

      expect(likeRes.status).to.equal(401);
    });

    it("should return 404 when post does not exist", async () => {
      const likeRes = await request(app)
        .post("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: "afd9ca5a-57e7-4616-8f45-29d45e440773",
        });

      expect(likeRes.status).to.equal(404);
    });

    it("should return 400 when postId is not provided", async () => {
      const likeRes = await request(app)
        .post("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({});

      expect(likeRes.status).to.equal(400);
    });

    it("should return 400 when postId is invalid", async () => {
      const likeRes = await request(app)
        .post("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: "invalid-post-id",
        });

      expect(likeRes.status).to.equal(400);
    });
  });

  describe("DELETE /api/blog/likes/", () => {
    it("should unlike a post", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const slug = postRes.headers.location.split("/").pop();
      const postRes2 = await request(app).get(`/api/blog/posts/${slug}`);
      expect(postRes2.status).to.equal(200);

      const likeRes = await request(app)
        .post("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: postRes2.body.id,
        });

      expect(likeRes.status).to.equal(204);

      const unlikeRes = await request(app)
        .delete("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: postRes2.body.id,
        });

      expect(unlikeRes.status).to.equal(204);
    });

    it("should return 404 when the user has not liked the post", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });
      const slug = postRes.headers.location.split("/").pop();
      const postRes2 = await request(app).get(`/api/blog/posts/${slug}`);
      expect(postRes2.status).to.equal(200);
      const unlikeRes = await request(app)
        .delete("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: postRes2.body.id,
        });
      expect(unlikeRes.status).to.equal(404);
    });

    it("should return 404 when unliking a post that is already unliked", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const slug = postRes.headers.location.split("/").pop();
      const postRes2 = await request(app).get(`/api/blog/posts/${slug}`);
      expect(postRes2.status).to.equal(200);

      const unlikeRes = await request(app)
        .delete("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: postRes2.body.id,
        });

      expect(unlikeRes.status).to.equal(404);
    });
    it("should return 401 when not authenticated", async () => {
      const postRes = await request(app).post("/api/blog/posts/").send({
        title: "Test Post",
        markdown: "This is a test post.",
      });

      const unlikeRes = await request(app).delete("/api/blog/likes/").send({
        postId: postRes.body.id,
      });

      expect(unlikeRes.status).to.equal(401);
    });
    it("should return 404 when post does not exist", async () => {
      const unlikeRes = await request(app)
        .delete("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: "afd9ca5a-57e7-4616-8f45-29d45e440773",
        });

      expect(unlikeRes.status).to.equal(404);
    });
    it("should return 400 when postId is not provided", async () => {
      const unlikeRes = await request(app)
        .delete("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({});

      expect(unlikeRes.status).to.equal(400);
    });
    it("should return 400 when postId is invalid", async () => {
      const unlikeRes = await request(app)
        .delete("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: "invalid-post-id",
        });

      expect(unlikeRes.status).to.equal(400);
    });
  });

  describe("GET /api/blog/likes/", () => {
    it("should get like status of a post", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const slug = postRes.headers.location.split("/").pop();
      const postRes2 = await request(app).get(`/api/blog/posts/${slug}`);
      expect(postRes2.status).to.equal(200);

      const likeRes = await request(app)
        .post("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: postRes2.body.id,
        });

      expect(likeRes.status).to.equal(204);

      const likeStatusRes = await request(app)
        .get("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .query({ postId: postRes2.body.id });

      expect(likeStatusRes.status).to.equal(200);
      expect(likeStatusRes.body.count).to.equal(1);
      expect(likeStatusRes.body.liked).to.equal(true);
    });

    it("should get like count of a post without authentication", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const slug = postRes.headers.location.split("/").pop();
      const postRes2 = await request(app).get(`/api/blog/posts/${slug}`);
      expect(postRes2.status).to.equal(200);

      const likeRes = await request(app)
        .post("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: postRes2.body.id,
        });

      expect(likeRes.status).to.equal(204);

      const likeStatusRes = await request(app)
        .get("/api/blog/likes/")
        .query({ postId: postRes2.body.id });
      expect(likeStatusRes.status).to.equal(200);
      expect(likeStatusRes.body.count).to.equal(1);
      expect(likeStatusRes.body.liked).to.equal(false);
    });

    it("should get like status of a post which was un-liked by the user", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });
      const slug = postRes.headers.location.split("/").pop();
      const postRes2 = await request(app).get(`/api/blog/posts/${slug}`);
      expect(postRes2.status).to.equal(200);
      const likeRes = await request(app)
        .post("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: postRes2.body.id,
        });
      expect(likeRes.status).to.equal(204);
      const unlikeRes = await request(app)
        .delete("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: postRes2.body.id,
        });
      expect(unlikeRes.status).to.equal(204);
      const likeStatusRes = await request(app)
        .get("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .query({ postId: postRes2.body.id });
      expect(likeStatusRes.status).to.equal(200);
      expect(likeStatusRes.body.count).to.equal(0);
      expect(likeStatusRes.body.liked).to.equal(false);
    });

    it("should return 200 when post does not exist", async () => {
      const likeStatusRes = await request(app)
        .get("/api/blog/likes/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .query({ postId: "afd9ca5a-57e7-4616-8f45-29d45e440773" });

      expect(likeStatusRes.status).to.equal(200);
      expect(likeStatusRes.body.count).to.equal(0);
      expect(likeStatusRes.body.liked).to.equal(false);
    });
  });
});
