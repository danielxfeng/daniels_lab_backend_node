import request from "supertest";
import app from "../../src/app";
import { expect } from "chai";
import prisma from "../../src/db/prisma";
import { off } from "process";

describe("Comment E2E Tests", () => {
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

  describe("POST /api/blog/comments/", () => {
    it("should create a comment", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post",
        });

      expect(postRes.status).to.equal(201);

      const getPostRes = await request(app).get(
        `/api/blog/posts/${postRes.headers.location.split("/").pop()}`
      );

      const postId = getPostRes.body.id;
      const commentRes = await request(app)
        .post("/api/blog/comments/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId,
          content: "This is a test comment",
        });
      expect(commentRes.status).to.equal(201);

      const commentId = commentRes.headers.location.split("/").pop();
      const getCommentRes = await request(app).get(
        `/api/blog/comments/${commentId}`
      );
      expect(getCommentRes.status).to.equal(200);
      expect(getCommentRes.body).to.have.property("id");
      expect(getCommentRes.body).to.have.property("content");
      expect(getCommentRes.body.content).to.equal("This is a test comment");
    });

    it("should return 401 if not authenticated", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post",
          tags: ["test"],
        });

      const getPostRes = await request(app).get(
        `/api/blog/posts/${postRes.headers.location.split("/").pop()}`
      );

      const postId = getPostRes.body.id;
      const commentRes = await request(app).post("/api/blog/comments/").send({
        postId,
        content: "This is a test comment",
      });
      expect(commentRes.status).to.equal(401);
    });

    it("should return 400 if parameters are not provided", async () => {
      const commentRes = await request(app)
        .post("/api/blog/comments/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({});
      expect(commentRes.status).to.equal(400);

      const fields = ["postId", "content"];
      fields.forEach((field) => {
        expect(commentRes.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(commentRes.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
      });
    });

    it("should return 400 if parameters are invalid", async () => {
      const commentRes = await request(app)
        .post("/api/blog/comments/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: "invalid-post-id",
          content: "",
        });
      expect(commentRes.status).to.equal(400);
      const fields = ["postId", "content"];
      fields.forEach((field) => {
        expect(commentRes.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(commentRes.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
      });
    });

    it("should return 404 if post does not exist", async () => {
      const commentRes = await request(app)
        .post("/api/blog/comments/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId: "afd9ca5a-57e7-4616-8f45-29d45e440773",
          content: "This is a test comment",
        });
      expect(commentRes.status).to.equal(404);
    });
  });

  describe("PUT /api/blog/comments/:commentId", () => {
    it("should update a comment", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post",
        });

      expect(postRes.status).to.equal(201);

      const getPostRes = await request(app).get(
        `/api/blog/posts/${postRes.headers.location.split("/").pop()}`
      );

      const postId = getPostRes.body.id;
      const commentRes = await request(app)
        .post("/api/blog/comments/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId,
          content: "This is a test comment",
        });
      expect(commentRes.status).to.equal(201);

      const commentId = commentRes.headers.location.split("/").pop();
      const updateCommentRes = await request(app)
        .put(`/api/blog/comments/${commentId}`)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          content: "This is an updated test comment",
        });
      expect(updateCommentRes.status).to.equal(200);
      expect(updateCommentRes.body).to.have.property("id");
      expect(updateCommentRes.body).to.have.property("content");
      expect(updateCommentRes.body.content).to.equal(
        "This is an updated test comment"
      );
    });

    it("should return 401 if not authenticated", async () => {
      const commentRes = await request(app)
        .put("/api/blog/comments/invalid-comment-id")
        .send({
          content: "This is an updated test comment",
        });
      expect(commentRes.status).to.equal(401);
    });

    it("should return 400 if parameters are not provided", async () => {
      const commentRes = await request(app)
        .put("/api/blog/comments/invalid-comment-id")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({});
      expect(commentRes.status).to.equal(400);

      const fields = ["content"];
      fields.forEach((field) => {
        expect(commentRes.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(commentRes.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
      });
    });

    it("should return 400 if parameters are invalid", async () => {
      const commentRes = await request(app)
        .put("/api/blog/comments/invalid-comment-id")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          content: "",
        });
      expect(commentRes.status).to.equal(400);
      const fields = ["content"];
      fields.forEach((field) => {
        expect(commentRes.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(commentRes.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
      });
    });

    it("should return 404 if user is not the author", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post",
        });

      expect(postRes.status).to.equal(201);

      const getPostRes = await request(app).get(
        `/api/blog/posts/${postRes.headers.location.split("/").pop()}`
      );

      const postId = getPostRes.body.id;
      const commentRes = await request(app)
        .post("/api/blog/comments/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId,
          content: "This is a test comment",
        });
      expect(commentRes.status).to.equal(201);

      const commentId = commentRes.headers.location.split("/").pop();
      const updateCommentRes = await request(app)
        .put(`/api/blog/comments/${commentId}`)
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          content: "This is an updated test comment",
        });
      expect(updateCommentRes.status).to.equal(404);
    });
  });

  describe("DELETE /api/blog/comments/:commentId", () => {
    it("should delete a comment", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post",
        });

      expect(postRes.status).to.equal(201);

      const getPostRes = await request(app).get(
        `/api/blog/posts/${postRes.headers.location.split("/").pop()}`
      );

      const postId = getPostRes.body.id;
      const commentRes = await request(app)
        .post("/api/blog/comments/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId,
          content: "This is a test comment",
        });
      expect(commentRes.status).to.equal(201);

      const commentId = commentRes.headers.location.split("/").pop();
      const deleteCommentRes = await request(app)
        .delete(`/api/blog/comments/${commentId}`)
        .set("Authorization", `Bearer ${user.accessToken}`);
      expect(deleteCommentRes.status).to.equal(204);
    });

    it("should return 204 if the user is an admin", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post",
        });
      expect(postRes.status).to.equal(201);
      const getPostRes = await request(app).get(
        `/api/blog/posts/${postRes.headers.location.split("/").pop()}`
      );
      const postId = getPostRes.body.id;
      const commentRes = await request(app)
        .post("/api/blog/comments/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          postId,
          content: "This is a test comment",
        });
      expect(commentRes.status).to.equal(201);
      const commentId = commentRes.headers.location.split("/").pop();
      const deleteCommentRes = await request(app)
        .delete(`/api/blog/comments/${commentId}`)
        .set("Authorization", `Bearer ${admin2.accessToken}`);
      expect(deleteCommentRes.status).to.equal(204);
    });

    it("should return 401 if not authenticated", async () => {
      const deleteCommentRes = await request(app).delete(
        "/api/blog/comments/invalid-comment-id"
      );
      expect(deleteCommentRes.status).to.equal(401);
    });

    it("should return 400 if parameters are not provided", async () => {
      const deleteCommentRes = await request(app)
        .delete("/api/blog/comments/invalid-comment-id")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({});
      expect(deleteCommentRes.status).to.equal(400);
    });

    it("should return 404 if comment does not exist", async () => {
      const deleteCommentRes = await request(app)
        .delete("/api/blog/comments/afd9ca5a-57e7-4616-8f45-29d45e440773")
        .set("Authorization", `Bearer ${user.accessToken}`);
      expect(deleteCommentRes.status).to.equal(404);
    });

    it("should return 404 if the comment is not the author or admin", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post",
        });

      expect(postRes.status).to.equal(201);

      const getPostRes = await request(app).get(
        `/api/blog/posts/${postRes.headers.location.split("/").pop()}`
      );

      const postId = getPostRes.body.id;
      const commentRes = await request(app)
        .post("/api/blog/comments/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          postId,
          content: "This is a test comment",
        });
      expect(commentRes.status).to.equal(201);

      const commentId = commentRes.headers.location.split("/").pop();
      const deleteCommentRes = await request(app)
        .delete(`/api/blog/comments/${commentId}`)
        .set("Authorization", `Bearer ${user.accessToken}`);
      expect(deleteCommentRes.status).to.equal(404);
    });
  });

  describe("GET /api/blog/comments/:commentId", () => {
    it("should get a comment", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post",
        });

      expect(postRes.status).to.equal(201);

      const getPostRes = await request(app).get(
        `/api/blog/posts/${postRes.headers.location.split("/").pop()}`
      );

      const postId = getPostRes.body.id;
      const commentRes = await request(app)
        .post("/api/blog/comments/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId,
          content: "This is a test comment",
        });
      expect(commentRes.status).to.equal(201);

      const commentId = commentRes.headers.location.split("/").pop();
      const getCommentRes = await request(app).get(
        `/api/blog/comments/${commentId}`
      );
      expect(getCommentRes.status).to.equal(200);
      expect(getCommentRes.body).to.have.property("id");
      expect(getCommentRes.body).to.have.property("content");
    });

    it("should return 400 if parameters are invalid", async () => {
      const getCommentRes = await request(app)
        .get("/api/blog/comments/invalid-comment-id")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({});
      expect(getCommentRes.status).to.equal(400);
    });

    it("should return 404 if comment does not exist", async () => {
      const getCommentRes = await request(app)
        .get("/api/blog/comments/afd9ca5a-57e7-4616-8f45-29d45e440773")
        .set("Authorization", `Bearer ${user.accessToken}`);
      expect(getCommentRes.status).to.equal(404);
    });
  });

  describe("GET /api/blog/comments/", () => {
    it("should get all comments", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post",
        });

      expect(postRes.status).to.equal(201);

      const getPostRes = await request(app).get(
        `/api/blog/posts/${postRes.headers.location.split("/").pop()}`
      );

      const postId = getPostRes.body.id;
      const commentRes = await request(app)
        .post("/api/blog/comments/")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          postId,
          content: "This is a test comment",
        });
      expect(commentRes.status).to.equal(201);

      const commentRes2 = await request(app)
        .post("/api/blog/comments/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          postId,
          content: "This is a test comment 2",
        });
      expect(commentRes2.status).to.equal(201);

      const getCommentsRes = await request(app)
        .get(`/api/blog/comments/`)
        .query({
          postId: postId,
        });
      expect(getCommentsRes.status).to.equal(200);
      expect(getCommentsRes.body).to.have.property("total");
      expect(getCommentsRes.body.total).to.equal(2);
      expect(getCommentsRes.body).to.have.property("comments");
      expect(getCommentsRes.body.comments).to.be.an("array");
      expect(getCommentsRes.body.comments.length).to.equal(2);
      expect(getCommentsRes.body.comments[0]).to.have.property("id");
      expect(getCommentsRes.body.comments[0]).to.have.property("content");
      expect(getCommentsRes.body.comments[0].content).to.equal(
        "This is a test comment 2"
      );
      expect(getCommentsRes.body.comments[1]).to.have.property("id");
      expect(getCommentsRes.body.comments[1]).to.have.property("content");
      expect(getCommentsRes.body.comments[1].content).to.equal(
        "This is a test comment"
      );
    });

    it("should get an empty list of comments if no comments exist", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post",
        });

      expect(postRes.status).to.equal(201);

      const getPostRes = await request(app).get(
        `/api/blog/posts/${postRes.headers.location.split("/").pop()}`
      );

      const postId = getPostRes.body.id;
      const getCommentsRes = await request(app)
        .get(`/api/blog/comments/`)
        .query({
          postId: postId,
        });
      expect(getCommentsRes.status).to.equal(200);
      expect(getCommentsRes.body).to.have.property("total");
      expect(getCommentsRes.body.total).to.equal(0);
      expect(getCommentsRes.body).to.have.property("comments");
      expect(getCommentsRes.body.comments).to.be.an("array");
      expect(getCommentsRes.body.comments.length).to.equal(0);
    });

    it("should return a list of comments with pagination", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts/")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post",
        });
      expect(postRes.status).to.equal(201);
      const getPostRes = await request(app).get(
        `/api/blog/posts/${postRes.headers.location.split("/").pop()}`
      );
      const postId = getPostRes.body.id;

      const comments = Array.from({ length: 5 }).map((_, i) => ({
        postId,
        content: `This is a test comment - ${i}`,
      }));

      for (const comment of comments) {
        const commentRes = await request(app)
          .post("/api/blog/comments/")
          .set("Authorization", `Bearer ${user.accessToken}`)
          .send(comment);
        expect(commentRes.status).to.equal(201);
      }

      const getCommentsRes = await request(app)
        .get(`/api/blog/comments/`)
        .query({
          postId: postId,
          limit: 2,
          offset: 0,
        });

      expect(getCommentsRes.status).to.equal(200);
      expect(getCommentsRes.body).to.have.property("total");
      expect(getCommentsRes.body.total).to.equal(5);
      expect(getCommentsRes.body).to.have.property("comments");
      expect(getCommentsRes.body.comments).to.be.an("array");
      expect(getCommentsRes.body.comments.length).to.equal(2);
      expect(getCommentsRes.body.comments[0]).to.have.property("id");
      expect(getCommentsRes.body.comments[0]).to.have.property("content");
      expect(getCommentsRes.body.comments[0].content).to.equal(
        "This is a test comment - 4"
      );
      expect(getCommentsRes.body.comments[1]).to.have.property("id");
      expect(getCommentsRes.body.comments[1]).to.have.property("content");
      expect(getCommentsRes.body.comments[1].content).to.equal(
        "This is a test comment - 3"
      );

      const getCommentsRes2 = await request(app)
        .get(`/api/blog/comments/`)
        .query({
          postId: postId,
          limit: 2,
          offset: 2,
        });
      expect(getCommentsRes2.status).to.equal(200);
      expect(getCommentsRes2.body).to.have.property("total");
      expect(getCommentsRes2.body.total).to.equal(5);
      expect(getCommentsRes2.body).to.have.property("comments");
      expect(getCommentsRes2.body.comments).to.be.an("array");
      expect(getCommentsRes2.body.comments.length).to.equal(2);
      expect(getCommentsRes2.body.comments[0]).to.have.property("id");
      expect(getCommentsRes2.body.comments[0]).to.have.property("content");
      expect(getCommentsRes2.body.comments[0].content).to.equal(
        "This is a test comment - 2"
      );
      expect(getCommentsRes2.body.comments[1]).to.have.property("id");
      expect(getCommentsRes2.body.comments[1]).to.have.property("content");
      expect(getCommentsRes2.body.comments[1].content).to.equal(
        "This is a test comment - 1"
      );

      const getCommentsRes3 = await request(app)
        .get(`/api/blog/comments/`)
        .query({
          postId: postId,
          offset: 4,
        });
      expect(getCommentsRes3.status).to.equal(200);
      expect(getCommentsRes3.body).to.have.property("total");
      expect(getCommentsRes3.body.total).to.equal(5);
      expect(getCommentsRes3.body).to.have.property("comments");
      expect(getCommentsRes3.body.comments).to.be.an("array");
      expect(getCommentsRes3.body.comments.length).to.equal(1);
      expect(getCommentsRes3.body.comments[0]).to.have.property("id");
      expect(getCommentsRes3.body.comments[0]).to.have.property("content");
      expect(getCommentsRes3.body.comments[0].content).to.equal(
        "This is a test comment - 0"
      );
    });

    it("should return 400 if parameters are invalid", async () => {
      const getCommentsRes = await request(app)
        .get("/api/blog/comments/")
        .query({});
      expect(getCommentsRes.status).to.equal(400);

      const fields = ["postId"];
      fields.forEach((field) => {
        expect(getCommentsRes.body.errors.query)
          .to.have.property(field)
          .that.is.an("object");
        expect(getCommentsRes.body.errors.query[field])
          .to.have.property("_errors")
          .that.is.an("array");
      });
    });

    it("should return empty list if post does not exist", async () => {
      const getCommentsRes = await request(app)
        .get("/api/blog/comments/")
        .query({
          postId: "afd9ca5a-57e7-4616-8f45-29d45e440773",
        });
      expect(getCommentsRes.status).to.equal(200);
      expect(getCommentsRes.body).to.have.property("total");
      expect(getCommentsRes.body.total).to.equal(0);
      expect(getCommentsRes.body).to.have.property("comments");
      expect(getCommentsRes.body.comments).to.be.an("array");
      expect(getCommentsRes.body.comments).to.be.empty;
    });

    it("should return 400 if parameters are invalid", async () => {
      const getCommentsRes = await request(app)
        .get("/api/blog/comments/")
        .query({
          postId: "invalid-post-id",
        });
      expect(getCommentsRes.status).to.equal(400);
      const fields = ["postId"];
      fields.forEach((field) => {
        expect(getCommentsRes.body.errors.query)
          .to.have.property(field)
          .that.is.an("object");
        expect(getCommentsRes.body.errors.query[field])
          .to.have.property("_errors")
          .that.is.an("array");
      });
    });
  });
});
