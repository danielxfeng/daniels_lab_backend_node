import request from "supertest";
import app from "../../src/app";
import { expect } from "chai";
import prisma from "../../src/db/prisma";

describe("Post E2E Tests", () => {
  let user: any = null;
  let admin: any = null;
  let admin2: any = null;
  process.env.ADMIN_REF_CODE = "9f9712b9-46db-4641-b1d5-80a9ab362ccd";

  before(async () => {
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tag.deleteMany({});
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
  });

  beforeEach(async () => {
    await prisma.post.deleteMany({});
  });

  afterEach(async () => {
    await prisma.post.deleteMany({});
  });

  describe("POST /blog/posts", () => {
    it("should create a new post", async () => {
      const res = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      expect(res.status).to.equal(201);
      expect(res.headers).to.have.property("location");
      expect(res.headers.location).to.be.a("string");
    });

    it("should create a new post with a tag", async () => {
      const res = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
          tags: "test",
        });
      expect(res.status).to.equal(201);
      expect(res.headers).to.have.property("location");
      expect(res.headers.location).to.be.a("string");
    });

    it("should create a new post with multiple tags", async () => {
      const res = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
          tags: ["test", "post"],
        });
      expect(res.status).to.equal(201);
      expect(res.headers).to.have.property("location");
      expect(res.headers.location).to.be.a("string");
    });

    it("should create 2 new posts with the same title", async () => {
      const res1 = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });
      expect(res1.status).to.equal(201);
      expect(res1.headers).to.have.property("location");
      expect(res1.headers.location).to.be.a("string");
      const res2 = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });
      expect(res2.status).to.equal(201);
      expect(res2.headers).to.have.property("location");
      expect(res2.headers.location).to.be.a("string");
      expect(res1.headers.location).to.not.equal(res2.headers.location);

      expect(res1.headers.location).to.not.equal(res2.headers.location);
    });

    it("should return 400 if required parameters are missing", async () => {
      const res = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({});
      expect(res.status).to.equal(400);

      const fields = ["title", "markdown"];
      fields.forEach((field) => {
        expect(res.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(res.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
        expect(res.body.errors.body[field]._errors).to.include("Required");
      });
    });

    it("should return 400 if the parameters are invalid", async () => {
      const res = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "",
          markdown: "",
          tags: 10,
        });
      expect(res.status).to.equal(400);

      const fields = ["title", "markdown", "tags"];
      fields.forEach((field) => {
        expect(res.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(res.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
      });
    });

    it("should return 401 if not authenticated", async () => {
      const res = await request(app)
        .post("/api/blog/posts")
        .send({
          title: "Test Post",
          content: "This is a test post.",
          tags: ["test", "post"],
        });
      expect(res.status).to.equal(401);
    });

    it("should return 403 if not an admin", async () => {
      const res = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          title: "Test Post",
          content: "This is a test post.",
          tags: ["test", "post"],
        });
      expect(res.status).to.equal(403);
    });
  });

  describe("GET /blog/posts/:slug", () => {
    it("should get a post by slug", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });
      const slug = postRes.headers.location.split("/").pop();

      const res = await request(app).get(`/api/blog/posts/${slug}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("title", "Test Post");
      expect(res.body).to.have.property("markdown", "This is a test post.");
      expect(res.body).to.have.property("tags").that.is.an("array");
      expect(res.body).to.have.property("tags").that.is.empty;
    });

    it("should return 200 if the post exists with a tag", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
          tags: "test",
        });
      const slug = postRes.headers.location.split("/").pop();
      const res = await request(app).get(`/api/blog/posts/${slug}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("title", "Test Post");
      expect(res.body).to.have.property("markdown", "This is a test post.");
      expect(res.body).to.have.property("tags").that.is.an("array");
      expect(res.body).to.have.property("tags").that.includes("test");
    });

    it("should return 200 if the post exists with multiple tags", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
          tags: ["test", "post"],
        });
      const slug = postRes.headers.location.split("/").pop();
      const res = await request(app).get(`/api/blog/posts/${slug}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("title", "Test Post");
      expect(res.body).to.have.property("markdown", "This is a test post.");
      expect(res.body).to.have.property("tags").that.is.an("array");
      expect(res.body).to.have.property("tags").that.includes("test");
      expect(res.body).to.have.property("tags").that.includes("post");
    });

    it("should return 200 if the timestamp are set", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
          tags: ["test", "post"],
          createdAt: new Date("2023-01-01"),
          updatedAt: new Date("2023-01-01"),
        });
      const slug = postRes.headers.location.split("/").pop();
      const res = await request(app).get(`/api/blog/posts/${slug}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("title", "Test Post");
      expect(res.body).to.have.property("markdown", "This is a test post.");
      expect(res.body).to.have.property("tags").that.is.an("array");
      expect(res.body).to.have.property("tags").that.includes("test");
      expect(res.body).to.have.property("tags").that.includes("post");
      expect(res.body).to.have.property("createdAt").that.is.a("string");
      expect(res.body).to.have.property("updatedAt").that.is.a("string");
      expect(res.body.createdAt).to.equal("2023-01-01T00:00:00.000Z");
      expect(res.body.updatedAt).to.equal("2023-01-01T00:00:00.000Z");
    });

    it("should return 2 posts with the same title", async () => {
      const postRes1 = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });
      const slug1 = postRes1.headers.location.split("/").pop();
      const postRes2 = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });
      const slug2 = postRes2.headers.location.split("/").pop();
      const res1 = await request(app).get(`/api/blog/posts/${slug1}`);
      const res2 = await request(app).get(`/api/blog/posts/${slug2}`);
      expect(res1.status).to.equal(200);
      expect(res1.body).to.have.property("title", "Test Post");
      expect(res1.body).to.have.property("markdown", "This is a test post.");
      expect(res1.body).to.have.property("tags").that.is.an("array");
      expect(res1.body).to.have.property("tags").that.is.empty;
      expect(res2.status).to.equal(200);
      expect(res2.body).to.have.property("title", "Test Post");
      expect(res2.body).to.have.property("markdown", "This is a test post.");
      expect(res2.body).to.have.property("tags").that.is.an("array");
      expect(res2.body).to.have.property("tags").that.is.empty;
      expect(slug1).to.not.equal(slug2);
    });

    it("should return 404 if the post does not exist", async () => {
      const res = await request(app).get("/api/blog/posts/non-existing-slug");
      expect(res.status).to.equal(404);
    });
  });

  describe("PUT /blog/posts/:postId", () => {
    it("should update a post", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const slug = postRes.headers.location.split("/").pop();
      const getRes = await request(app).get(`/api/blog/posts/${slug}`);
      expect(getRes.status).to.equal(200);

      const res = await request(app)
        .put(`/api/blog/posts/${getRes.body.id}`)
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Updated Test Post",
          markdown: "This is an updated test post.",
        });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("title", "Updated Test Post");
      expect(res.body).to.have.property(
        "markdown",
        "This is an updated test post."
      );
    });

    it("should update a post with timestamps", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
          tags: ["test", "post"],
        });

      const slug = postRes.headers.location.split("/").pop();
      const getRes = await request(app).get(`/api/blog/posts/${slug}`);
      expect(getRes.status).to.equal(200);

      const res = await request(app)
        .put(`/api/blog/posts/${getRes.body.id}`)
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Updated Test Post",
          markdown: "This is an updated test post.",
          tags: ["test", "post"],
          createdAt: new Date("2023-01-01"),
          updatedAt: new Date("2023-01-01"),
        });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("title", "Updated Test Post");
      expect(res.body).to.have.property(
        "markdown",
        "This is an updated test post."
      );
      expect(res.body).to.have.property("tags").that.is.an("array");
      expect(res.body).to.have.property("tags").that.includes("test");
      expect(res.body).to.have.property("tags").that.includes("post");
      expect(res.body).to.have.property("createdAt").that.is.a("string");
      expect(res.body).to.have.property("updatedAt").that.is.a("string");
      expect(res.body.createdAt).to.equal("2023-01-01T00:00:00.000Z");
      expect(res.body.updatedAt).to.equal("2023-01-01T00:00:00.000Z");
    });

    it("should update a post with a different title but same slug", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const slug = postRes.headers.location.split("/").pop();
      const getRes = await request(app).get(`/api/blog/posts/${slug}`);
      expect(getRes.status).to.equal(200);

      const res = await request(app)
        .put(`/api/blog/posts/${getRes.body.id}`)
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Updated Test Post",
          markdown: "This is an updated test post.",
          tags: ["test", "post"],
        });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("title", "Updated Test Post");
      expect(res.body).to.have.property(
        "markdown",
        "This is an updated test post."
      );
      expect(res.body).to.have.property("tags").that.is.an("array");
      expect(res.body).to.have.property("tags").that.includes("test");
      expect(res.body).to.have.property("tags").that.includes("post");
      expect(res.body).to.have.property("createdAt").that.is.a("string");
      expect(res.body).to.have.property("updatedAt").that.is.a("string");
    });

    it("should update a post as a normal user", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const slug = postRes.headers.location.split("/").pop();
      const getRes = await request(app).get(`/api/blog/posts/${slug}`);
      expect(getRes.status).to.equal(200);

      const changeAuthorRes = await prisma.post.update({
        where: { id: getRes.body.id },
        data: { authorId: user.id },
      });

      const res = await request(app)
        .put(`/api/blog/posts/${getRes.body.id}`)
        .set("Authorization", `Bearer ${user.accessToken}`)
        .send({
          title: "Updated Test Post",
          markdown: "This is an updated test post.",
        });
      expect(res.status).to.equal(200);
    });

    it("should update a post with a new tag and a different tag", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
          tags: ["test", "post"],
        });
      const slug = postRes.headers.location.split("/").pop();

      const getRes = await request(app).get(`/api/blog/posts/${slug}`);
      expect(getRes.status).to.equal(200);

      const anotherPostRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Another Test Post",
          markdown: "This is another test post.",
          tags: ["post2"],
        });
      expect(anotherPostRes.status).to.equal(201);

      const get2Res = await request(app).get(
        `/api/blog/posts/${anotherPostRes.headers.location.split("/").pop()}`
      );
      expect(get2Res.status).to.equal(200);

      const res = await request(app)
        .put(`/api/blog/posts/${getRes.body.id}`)
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Updated Test Post",
          markdown: "This is an updated test post.",
          tags: ["test", "post2", "new"],
        });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("title", "Updated Test Post");
      expect(res.body).to.have.property(
        "markdown",
        "This is an updated test post."
      );
      expect(res.body).to.have.property("tags").that.is.an("array");
      expect(res.body.tags).to.be.deep.equal(["test", "new", "post2"]);

      const tags = await prisma.tag.findMany();
      expect(tags).to.have.lengthOf(4);
      expect(tags[0].name).to.equal("test");
      expect(tags[1].name).to.equal("post");
      expect(tags[2].name).to.equal("post2");
      expect(tags[3].name).to.equal("new");
    });

    it("should return 401 if not authenticated", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const res = await request(app)
        .put(`/api/blog/posts/${postRes.body.id}`)
        .send({
          title: "Updated Test Post",
          markdown: "This is an updated test post.",
        });
      expect(res.status).to.equal(401);
    });

    it("should return 404 if not the author of the post", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const slug = postRes.headers.location.split("/").pop();
      const getRes = await request(app).get(`/api/blog/posts/${slug}`);
      expect(getRes.status).to.equal(200);

      const res = await request(app)
        .put(`/api/blog/posts/${getRes.body.id}`)
        .set("Authorization", `Bearer ${admin2.accessToken}`)
        .send({
          title: "Updated Test Post",
          markdown: "This is an updated test post.",
        });

      expect(res.status).to.equal(404);
    });

    it("should return 400 if required parameters are missing", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const slug = postRes.headers.location.split("/").pop();
      const getRes = await request(app).get(`/api/blog/posts/${slug}`);
      expect(getRes.status).to.equal(200);

      const res = await request(app)
        .put(`/api/blog/posts/${getRes.body.id}`)
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({});
      expect(res.status).to.equal(400);

      const fields = ["title", "markdown"];
      fields.forEach((field) => {
        expect(res.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(res.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
        expect(res.body.errors.body[field]._errors).to.include("Required");
      });
    });

    it("should return 400 if the parameters are invalid", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const slug = postRes.headers.location.split("/").pop();
      const getRes = await request(app).get(`/api/blog/posts/${slug}`);
      expect(getRes.status).to.equal(200);

      const res = await request(app)
        .put(`/api/blog/posts/${postRes.body.id}`)
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "",
          markdown: "",
          tags: 10,
          createdAt: "sdf",
          updatedAt: "ff",
        });
      expect(res.status).to.equal(400);
      const fields = ["title", "markdown", "tags", "createdAt", "updatedAt"];
      fields.forEach((field) => {
        expect(res.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(res.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
      });
    });
  });

  describe("DELETE /blog/posts/:postId", () => {
    it("should delete a post", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const slug = postRes.headers.location.split("/").pop();
      const getRes = await request(app).get(`/api/blog/posts/${slug}`);
      expect(getRes.status).to.equal(200);

      const res = await request(app)
        .delete(`/api/blog/posts/${getRes.body.id}`)
        .set("Authorization", `Bearer ${admin.accessToken}`);
      expect(res.status).to.equal(204);
    });

    it("should delete a post as an admin", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const slug = postRes.headers.location.split("/").pop();
      const getRes = await request(app).get(`/api/blog/posts/${slug}`);
      expect(getRes.status).to.equal(200);

      const res = await request(app)
        .delete(`/api/blog/posts/${getRes.body.id}`)
        .set("Authorization", `Bearer ${admin2.accessToken}`);
      expect(res.status).to.equal(204);
    });

    it("should delete a post as a normal user", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });
      const slug = postRes.headers.location.split("/").pop();
      const getRes = await request(app).get(`/api/blog/posts/${slug}`);
      expect(getRes.status).to.equal(200);

      const changeAuthorRes = await prisma.post.update({
        where: { id: getRes.body.id },
        data: { authorId: user.id },
      });

      const res = await request(app)
        .delete(`/api/blog/posts/${changeAuthorRes.id}`)
        .set("Authorization", `Bearer ${user.accessToken}`);
      expect(res.status).to.equal(204);
    });

    it("should return 401 if not authenticated", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const res = await request(app)
        .delete(`/api/blog/posts/${postRes.body.id}`)
        .send({});
      expect(res.status).to.equal(401);
    });

    it("should return 404 if a normal user tries to delete a post that is not theirs", async () => {
      const postRes = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
          markdown: "This is a test post.",
        });

      const slug = postRes.headers.location.split("/").pop();
      const getRes = await request(app).get(`/api/blog/posts/${slug}`);
      expect(getRes.status).to.equal(200);

      const res = await request(app)
        .delete(`/api/blog/posts/${getRes.body.id}`)
        .set("Authorization", `Bearer ${user.accessToken}`);
      expect(res.status).to.equal(404);
    });

    it("should return 404 if the post does not exist", async () => {
      const res = await request(app)
        .delete("/api/blog/posts/f69532f2-4981-4c93-8bf0-34ca8554d809")
        .set("Authorization", `Bearer ${admin.accessToken}`);
      expect(res.status).to.equal(404);
    });
  });

  describe("GET /blog/posts", () => {
    it("should get a list of posts", async function () {
      this.timeout(10000);
      const posts = Array.from({ length: 5 }, (_, i) => ({
        title: `Test Post - ${i}`,
        markdown: `This is a test post - ${i}`,
      }));

      for (const post of posts) {
        await request(app)
          .post("/api/blog/posts")
          .set("Authorization", `Bearer ${admin.accessToken}`)
          .send(post);
      }

      const res = await request(app).get("/api/blog/posts");

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("posts").that.is.an("array");
      expect(res.body.posts).to.have.lengthOf(5);
      expect(res.body.posts[0]).to.have.property("title", "Test Post - 4");
      expect(res.body.posts[1]).to.have.property("title", "Test Post - 3");
      expect(res.body.posts[2]).to.have.property("title", "Test Post - 2");
      expect(res.body.posts[3]).to.have.property("title", "Test Post - 1");
      expect(res.body.posts[4]).to.have.property("title", "Test Post - 0");
      expect(res.body.posts[0]).to.have.property(
        "markdown",
        "This is a test post - 4"
      );
      expect(res.body.posts[1]).to.have.property(
        "markdown",
        "This is a test post - 3"
      );
      expect(res.body.posts[2]).to.have.property(
        "markdown",
        "This is a test post - 2"
      );
      expect(res.body.posts[3]).to.have.property(
        "markdown",
        "This is a test post - 1"
      );
      expect(res.body.posts[4]).to.have.property(
        "markdown",
        "This is a test post - 0"
      );
    });

    it("should get a list of posts filtered by tags", async function () {
      this.timeout(10000);
      const posts = Array.from({ length: 5 }, (_, i) => ({
        title: `Test Post - ${i}`,
        markdown: `This is a test post - ${i}`,
      }));

      (posts[1] as any).tags = ["test"];
      (posts[2] as any).tags = ["test", "post"];
      (posts[3] as any).tags = ["post"];

      for (const post of posts) {
        await request(app)
          .post("/api/blog/posts")
          .set("Authorization", `Bearer ${admin.accessToken}`)
          .send(post);
      }

      const res = await request(app).get("/api/blog/posts?tags=test");

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("posts").that.is.an("array");
      expect(res.body.posts).to.have.lengthOf(2);
      expect(res.body.posts[0]).to.have.property("title", "Test Post - 2");
      expect(res.body.posts[1]).to.have.property("title", "Test Post - 1");
      expect(res.body.posts[0]).to.have.property(
        "markdown",
        "This is a test post - 2"
      );
      expect(res.body.posts[1]).to.have.property(
        "markdown",
        "This is a test post - 1"
      );

      const res2 = await request(app).get(
        "/api/blog/posts?tags=post&tags=test"
      );

      expect(res2.status).to.equal(200);
      expect(res2.body).to.have.property("posts").that.is.an("array");
      expect(res2.body.posts).to.have.lengthOf(3);
      expect(res2.body.posts[0]).to.have.property("title", "Test Post - 3");
      expect(res2.body.posts[1]).to.have.property("title", "Test Post - 2");
      expect(res2.body.posts[2]).to.have.property("title", "Test Post - 1");
      expect(res2.body.posts[0]).to.have.property(
        "markdown",
        "This is a test post - 3"
      );
      expect(res2.body.posts[1]).to.have.property(
        "markdown",
        "This is a test post - 2"
      );
      expect(res2.body.posts[2]).to.have.property(
        "markdown",
        "This is a test post - 1"
      );
    });

    it("should get a list of posts with pagination", async function () {
      this.timeout(10000);
      const posts = Array.from({ length: 5 }, (_, i) => ({
        title: `Test Post - ${i}`,
        markdown: `This is a test post - ${i}`,
      }));

      for (const post of posts) {
        await request(app)
          .post("/api/blog/posts")
          .set("Authorization", `Bearer ${admin.accessToken}`)
          .send(post);
      }

      const res = await request(app).get("/api/blog/posts?limit=2");

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("posts").that.is.an("array");
      expect(res.body.posts).to.have.lengthOf(2);
      expect(res.body.posts[0]).to.have.property("title", "Test Post - 4");
      expect(res.body.posts[1]).to.have.property("title", "Test Post - 3");

      const res2 = await request(app).get("/api/blog/posts?offset=2");
      expect(res2.status).to.equal(200);
      expect(res2.body).to.have.property("posts").that.is.an("array");
      expect(res2.body.posts).to.have.lengthOf(3);
      expect(res2.body.posts[0]).to.have.property("title", "Test Post - 2");
      expect(res2.body.posts[1]).to.have.property("title", "Test Post - 1");
      expect(res2.body.posts[2]).to.have.property("title", "Test Post - 0");
      expect(res2.body.posts[0]).to.have.property(
        "markdown",
        "This is a test post - 2"
      );
      expect(res2.body.posts[1]).to.have.property(
        "markdown",
        "This is a test post - 1"
      );
      expect(res2.body.posts[2]).to.have.property(
        "markdown",
        "This is a test post - 0"
      );

      const res3 = await request(app).get("/api/blog/posts?limit=2&offset=2");
      expect(res3.status).to.equal(200);
      expect(res3.body).to.have.property("posts").that.is.an("array");
      expect(res3.body.posts).to.have.lengthOf(2);
      expect(res3.body.posts[0]).to.have.property("title", "Test Post - 2");
      expect(res3.body.posts[1]).to.have.property("title", "Test Post - 1");
      expect(res3.body.posts[0]).to.have.property(
        "markdown",
        "This is a test post - 2"
      );
      expect(res3.body.posts[1]).to.have.property(
        "markdown",
        "This is a test post - 1"
      );
      expect(res3.body.posts[0]).to.have.property("tags").that.is.an("array");
    });

    it("should get a list of posts with time range", async function () {
      this.timeout(10000);
      const posts = Array.from({ length: 5 }, (_, i) => ({
        title: `Test Post - ${i}`,
        markdown: `This is a test post - ${i}`,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 day apart
      }));

      posts[2].createdAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      posts[3].createdAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

      for (const post of posts) {
        await request(app)
          .post("/api/blog/posts")
          .set("Authorization", `Bearer ${admin.accessToken}`)
          .send(post);
      }

      const res = await request(app).get(
        `/api/blog/posts?from=${new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString()}`
      );

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("posts").that.is.an("array");
      expect(res.body.posts).to.have.lengthOf(1);
      expect(res.body.posts[0]).to.have.property("title", "Test Post - 3");

      const res2 = await request(app).get(
        `/api/blog/posts?to=${new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString()}`
      );
      expect(res2.status).to.equal(200);
      expect(res2.body).to.have.property("posts").that.is.an("array");
      expect(res2.body.posts).to.have.lengthOf(4);
      expect(res2.body.posts[0]).to.have.property("title", "Test Post - 2");
      expect(res2.body.posts[1]).to.have.property("title", "Test Post - 0");
      expect(res2.body.posts[2]).to.have.property("title", "Test Post - 1");
      expect(res2.body.posts[3]).to.have.property("title", "Test Post - 4");

      const res3 = await request(app).get(
        `/api/blog/posts?from=${new Date(
          Date.now() - 4 * 24 * 60 * 60 * 1000
        ).toISOString()}&to=${new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000
        ).toISOString()}`
      );
      expect(res3.status).to.equal(200);
      expect(res3.body).to.have.property("posts").that.is.an("array");
      expect(res3.body.posts).to.have.lengthOf(2);
      expect(res3.body.posts[0]).to.have.property("title", "Test Post - 3");
      expect(res3.body.posts[1]).to.have.property("title", "Test Post - 2");
    });

    it("should get a list of posts with multiple filters", async function () {
      this.timeout(10000);
      const posts = Array.from({ length: 5 }, (_, i) => ({
        title: `Test Post - ${i}`,
        markdown: `This is a test post - ${i}`,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 day apart
      }));

      posts[2].createdAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      posts[3].createdAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      (posts[3] as any).tags = ["test"];

      for (const post of posts) {
        await request(app)
          .post("/api/blog/posts")
          .set("Authorization", `Bearer ${admin.accessToken}`)
          .send(post);
      }

      const res = await request(app).get(
        `/api/blog/posts?tags=test&from=${new Date(
          Date.now() - 4 * 24 * 60 * 60 * 1000
        ).toISOString()}`
      );

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("posts").that.is.an("array");
      expect(res.body.posts).to.have.lengthOf(1);
      expect(res.body.posts[0]).to.have.property("title", "Test Post - 3");
    });

    it("should return empty posts if no posts exist", async () => {
      const res = await request(app).get("/api/blog/posts");
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("posts").that.is.an("array");
      expect(res.body.posts).to.have.lengthOf(0);
    });
    it("should return 400 if the parameters are invalid", async () => {
      const res = await request(app).get(
        "/api/blog/posts?limit=df&offset=ff&tags=@@@&from=v&to=s"
      );
      expect(res.status).to.equal(400);
      const fields = ["limit", "offset", "tags", "from", "to"];
      fields.forEach((field) => {
        expect(res.body.errors.query)
          .to.have.property(field)
          .that.is.an("object");
        expect(res.body.errors.query[field])
          .to.have.property("_errors")
          .that.is.an("array");
      });
    });
  });
});
