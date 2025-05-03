import request from "supertest";
import app from "../../src/app";
import { expect } from "chai";
import prisma from "../../src/db/prisma";

describe("Tag E2E Tests", () => {
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

  describe("POST /api/blog/tags/hot", () => {
    it("should return 200 and a empty list of hot tags", async () => {
      const res = await request(app)
        .get("/api/blog/tags/hot")
        .set("Authorization", `Bearer ${user.accessToken}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("tags");
      expect(res.body.tags).to.be.an("array");
      expect(res.body.tags).to.be.empty;
    });

    it("should return 200 and a list of hot tags", async function () {
      this.timeout(10000);
      const res = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin.accessToken}`)
        .send({
          title: "Test Post",
markdown: "This is a test post",
coverUrl: "https://aaaaaaaaa.png",
          tags: ["tag1", "tag2"],
        });
      expect(res.status).to.equal(201);

      const res2 = await request(app)
        .post("/api/blog/posts")
        .set("Authorization", `Bearer ${admin2.accessToken}`)
        .send({
          title: "Test Post 2",
markdown: "This is a test post 2",
coverUrl: "https://aaaaaaaaa.png",
          tags: ["tag1", "tag3"],
        });
      expect(res2.status).to.equal(201);

      const res3 = await request(app).get("/api/blog/tags/hot");
      expect(res3.status).to.equal(200);
      expect(res3.body).to.have.property("tags");
      expect(res3.body.tags).to.be.an("array");
      expect(res3.body.tags).to.have.lengthOf(3);
      expect(res3.body.tags).to.include("tag1");
      expect(res3.body.tags).to.include("tag2");
      expect(res3.body.tags).to.include("tag3");
    });
  });
});
