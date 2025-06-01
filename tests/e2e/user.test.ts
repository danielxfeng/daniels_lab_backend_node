import request from "supertest";
import app from "../../src/app";
import { expect } from "chai";
import prisma from "../../src/db/prisma";
import { hashPassword } from "../../src/utils/crypto";

describe("User E2E Tests", () => {
  after(async () => {
    await prisma.$disconnect();
  });
  
  beforeEach(async () => {
    await prisma.user.deleteMany({});
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
  });

  describe("GET /users", () => {
    it("should return 200 and the current user profile", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(res.status).to.equal(201);

      const getRes = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${res.body.accessToken}`);
      expect(getRes.status).to.equal(200);
      expect(getRes.body).to.have.property("username").to.equal("testuser");
      expect(getRes.body).to.have.property("avatarUrl").to.equal(null);
      expect(getRes.body).to.have.property("isAdmin").to.equal(false);
      expect(getRes.body).to.have.property("id").to.be.a("string");
      expect(getRes.body).to.have.property("oauthProviders").to.be.an("array");
      expect(getRes.body).to.have.property("oauthProviders").to.be.empty;
    });

    it("should return 401 if not authenticated", async () => {
      const res = await request(app).get("/api/users");
      expect(res.status).to.equal(401);
    });

    it("should return 500 if user is deleted", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(res.status).to.equal(201);

      await prisma.user.update({
        where: { id: res.body.id },
        data: { deletedAt: new Date() },
      });

      const getRes = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${res.body.accessToken}`);
      expect(getRes.status).to.equal(500);
    });
  });

  describe("PUT /users", () => {
    it("should update the current user info", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(res.status).to.equal(201);

      const putRes = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          username: "updateduser",
        });

      expect(putRes.status).to.equal(200);
      expect(putRes.body).to.have.property("username").to.equal("updateduser");
    });

    it("should return 401 if not authenticated", async () => {
      const res = await request(app).put("/api/users");
      expect(res.status).to.equal(401);
    });

    it("should return 400 if request body is invalid", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(res.status).to.equal(201);

      const putRes = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          username: "",
        });

      expect(putRes.status).to.equal(400);
      const fields = ["username"];
      fields.forEach((field) => {
        expect(putRes.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(putRes.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
      });
    });

    it("should return 500 if user is deleted", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(res.status).to.equal(201);

      await prisma.user.update({
        where: { id: res.body.id },
        data: { deletedAt: new Date() },
      });
      const putRes = await request(app)
        .put("/api/users")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          username: "updateduser",
        });
      expect(putRes.status).to.equal(500);
    });
  });

  describe("GET /users/all", () => {
    it("should return 200 and a list of all users", async () => {
      const users = [
        {
          username: "testuser1",
          password: "PASSword%123",
          isAdmin: false,
          consentAt: new Date(),
        },
        {
          username: "testuser2",
          password: "PASSword%123",
          isAdmin: true,
          consentAt: new Date(),
        },
        {
          username: "adminuser",
          password: "PASSword%123",
          isAdmin: true,
          consentAt: new Date(),
        },
      ];

      const batchInsert = async (users: any[]) => {
        const userPromises = users.map(async (user) =>
          prisma.user.create({
            data: {
              username: user.username,
              encryptedPwd: await hashPassword(user.password),
              isAdmin: user.isAdmin,
              consentAt: user.consentAt,
            },
          })
        );
        await Promise.all(userPromises);
      };

      await batchInsert(users);

      const loginRes = await request(app).post("/api/auth/login").send({
        username: "testuser2",
        password: "PASSword%123",
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(loginRes.status).to.equal(200);

      const token = loginRes.body.accessToken;
      expect(token).to.be.a("string");

      const res = await request(app)
        .get("/api/users/all")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body.length).to.be.greaterThanOrEqual(3);
      expect(res.body.some((u: any) => u.username === "testuser1")).to.be.true;
      expect(res.body.some((u: any) => u.username === "testuser2")).to.be.true;
      expect(res.body.some((u: any) => u.username === "adminuser")).to.be.true;
    });

    it("should return 401 if not authenticated", async () => {
      const res = await request(app).get("/api/users/all");
      expect(res.status).to.equal(401);
    });

    it("should return 403 if not an admin", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(res.status).to.equal(201);

      const getRes = await request(app)
        .get("/api/users/all")
        .set("Authorization", `Bearer ${res.body.accessToken}`);
      expect(getRes.status).to.equal(403);
    });

    it("should return 403 if user is deleted", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(res.status).to.equal(201);

      await prisma.user.update({
        where: { id: res.body.id },
        data: { deletedAt: new Date() },
      });
      const getRes = await request(app)
        .get("/api/users/all")
        .set("Authorization", `Bearer ${res.body.accessToken}`);
      expect(getRes.status).to.equal(403);
    });
  });
});
