import request from "supertest";
import app from "../../src/app";
import { expect } from "chai";
import prisma from "../../src/db/prisma";

const pr = (res: any) => {
  console.log("Response body:", JSON.stringify(res.body, null, 2));
};

describe("Auth E2E Tests", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  after(async () => {
    await prisma.user.deleteMany();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user without the avatarUrl", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("username").to.equal("testuser");
      expect(res.body).to.have.property("avatarUrl").to.equal(null);
      expect(res.body).to.have.property("isAdmin").to.equal(false);
      expect(res.body).to.have.property("accessToken").to.be.a("string");
      expect(res.body).to.have.property("refreshToken").to.be.a("string");
      expect(res.body).to.have.property("id").to.be.a("string");
      expect(res.body).to.have.property("oauthProviders").to.be.an("array");
      expect(res.body).to.have.property("oauthProviders").to.be.empty;
    });

    it("should register a new user with the avatarUrl", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        avatarUrl: "https://example.com/avatar.jpg",
      });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("username").to.equal("testuser");
      expect(res.body)
        .to.have.property("avatarUrl")
        .to.equal("https://example.com/avatar.jpg");
      expect(res.body).to.have.property("isAdmin").to.equal(false);
      expect(res.body).to.have.property("accessToken").to.be.a("string");
      expect(res.body).to.have.property("refreshToken").to.be.a("string");
      expect(res.body).to.have.property("id").to.be.a("string");
      expect(res.body).to.have.property("oauthProviders").to.be.an("array");
      expect(res.body).to.have.property("oauthProviders").to.be.empty;
    });

    it("should return 400 for empty parameters", async () => {
      const res = await request(app).post("/api/auth/register").send({});

      console.log("Response body:", JSON.stringify(res.body, null, 2));

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("errors").to.be.an("object");
      expect(res.body.errors).to.have.property("body").to.be.an("object");

      const fields = [
        "username",
        "password",
        "confirmPassword",
        "consentAt",
        "deviceId",
      ];

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

    it("should return 400 for invalid parameters", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "t",
        password: "123",
        confirmPassword: "123",
        consentAt: "dd",
        deviceId: "jkdf",
        avatarUrl: "invalid-url",
      });

      const fields = [
        "username",
        "password",
        "avatarUrl",
        "consentAt",
        "deviceId",
      ];

      fields.forEach((field) => {
        expect(res.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(res.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
      });
    });

    it("should return 400 for invalid password confirmation", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "Passsword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("errors").to.be.an("object");
      expect(res.body.errors).to.have.property("body").to.be.an("object");
      expect(res.body.errors.body)
        .to.have.property("confirmPassword")
        .that.is.an("object");
      expect(res.body.errors.body.confirmPassword)
        .to.have.property("_errors")
        .that.is.an("array");
    });

    it("should return 409 for existing username", async () => {
      await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(res.status).to.equal(409);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login a user", async () => {
      await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const res = await request(app).post("/api/auth/login").send({
        username: "testuser",
        password: "PASSword%123",
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("username").to.equal("testuser");
      expect(res.body).to.have.property("avatarUrl").to.equal(null);
      expect(res.body).to.have.property("isAdmin").to.equal(false);
      expect(res.body).to.have.property("accessToken").to.be.a("string");
      expect(res.body).to.have.property("refreshToken").to.be.a("string");
      expect(res.body).to.have.property("id").to.be.a("string");
      expect(res.body).to.have.property("oauthProviders").to.be.an("array");
      expect(res.body).to.have.property("oauthProviders").to.be.empty;
    });

    it("should return 400 for empty parameters", async () => {
      const res = await request(app).post("/api/auth/login").send({});

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property("errors").to.be.an("object");
      expect(res.body.errors).to.have.property("body").to.be.an("object");

      const fields = ["username", "password", "deviceId"];

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

    it("should return 400 for invalid parameters", async () => {
      const res = await request(app).post("/api/auth/login").send({
        username: "t",
        password: "123",
        deviceId: "jkdf",
      });

      const fields = ["username", "password", "deviceId"];

      fields.forEach((field) => {
        expect(res.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(res.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
      });
    });

    it("should return 401 for invalid credentials", async () => {
      await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const res = await request(app).post("/api/auth/login").send({
        username: "testuser",
        password: "PASSword%1234",
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(res.status).to.equal(401);
    });

    it("should return 401 for invalid username", async () => {
      await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const res = await request(app).post("/api/auth/login").send({
        username: "invaliduser",
        password: "PASSword%123",
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(res.status).to.equal(401);
    });

    it("should return 401 for deleted user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      await prisma.user.update({
        where: { id: res.body.id },
        data: { deletedAt: new Date() },
      });
      const loginRes = await request(app).post("/api/auth/login").send({
        username: "testuser",
        password: "PASSword%123",
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(loginRes.status).to.equal(401);
    });

    it("should return 401 for a user who has not a password", async () => {
      await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      await prisma.user.update({
        where: { username: "testuser" },
        data: { password: null },
      });

      const res = await request(app).post("/api/auth/login").send({
        username: "testuser",
        password: "PASSword%123",
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(res.status).to.equal(401);
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("should change the password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const changePasswordRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          currentPassword: "PASSword%123",
          password: "PASSword%1234",
          confirmPassword: "PASSword%1234",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });

      expect(changePasswordRes.status).to.equal(200);
    });

    it("should return 401 for invalid token", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const changePasswordRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer invalidtoken`)
        .send({
          currentPassword: "PASSword%123",
          password: "PASSword%1234",
          confirmPassword: "PASSword%1234",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });

      expect(changePasswordRes.status).to.equal(401);
    });

    it("should return 401 for empty token", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const changePasswordRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer `)
        .send({
          currentPassword: "PASSword%123",
          password: "PASSword%1234",
          confirmPassword: "PASSword%1234",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });

      expect(changePasswordRes.status).to.equal(401);
    });

    it("should return 400 for empty parameters", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const changePasswordRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({});

      expect(changePasswordRes.status).to.equal(400);
      expect(changePasswordRes.body)
        .to.have.property("errors")
        .to.be.an("object");
      expect(changePasswordRes.body.errors)
        .to.have.property("body")
        .to.be.an("object");

      const fields = [
        "currentPassword",
        "password",
        "confirmPassword",
        "deviceId",
      ];

      fields.forEach((field) => {
        expect(changePasswordRes.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(changePasswordRes.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
        expect(changePasswordRes.body.errors.body[field]._errors).to.include(
          "Required"
        );
      });
    });

    it("should return 400 for invalid parameters", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const changePasswordRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          currentPassword: "t",
          password: "123",
          confirmPassword: "123",
          deviceId: "jkdf",
        });

      const fields = ["currentPassword", "password", "deviceId"];

      fields.forEach((field) => {
        expect(changePasswordRes.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(changePasswordRes.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
      });
    });

    it("should return 400 for invalid password confirmation", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const changePasswordRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          currentPassword: "PASSword%123",
          password: "PASSword%1234",
          confirmPassword: "PASSword%12345",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });

      expect(changePasswordRes.status).to.equal(400);
      expect(changePasswordRes.body)
        .to.have.property("errors")
        .to.be.an("object");
      expect(changePasswordRes.body.errors)
        .to.have.property("body")
        .to.be.an("object");
      expect(changePasswordRes.body.errors.body)
        .to.have.property("confirmPassword")
        .that.is.an("object");
      expect(changePasswordRes.body.errors.body.confirmPassword)
        .to.have.property("_errors")
        .that.is.an("array");
    });
    it("should return 401 for invalid current password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const changePasswordRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          currentPassword: "PASSword%12",
          password: "PASSword%1234",
          confirmPassword: "PASSword%1234",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });

      expect(changePasswordRes.status).to.equal(401);
    });

    it("should return 400 for unchanged password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const changePasswordRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          currentPassword: "PASSword%123",
          password: "PASSword%123",
          confirmPassword: "PASSword%123",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });

      expect(changePasswordRes.status).to.equal(400);
    });

    it("should return 401 for deleted user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      await prisma.user.update({
        where: { id: res.body.id },
        data: { deletedAt: new Date() },
      });
      const changePasswordRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          currentPassword: "PASSword%123",
          password: "PASSword%1234",
          confirmPassword: "PASSword%1234",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });
      expect(changePasswordRes.status).to.equal(401);
    });

    it("should revoke all refresh tokens for a user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const res2 = await request(app).post("/api/auth/login").send({
        username: "testuser",
        password: "PASSword%123",
        deviceId: "bdf3403ec56c4283b5291c2ad6094bde",
      });

      expect(res2.status).to.equal(200);

      const revokeRes = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          currentPassword: "PASSword%123",
          password: "PASSword%1234",
          confirmPassword: "PASSword%1234",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });

      expect(revokeRes.status).to.equal(200);

      const resRevoked = await request(app).post("/api/auth/refresh").send({
        refreshToken: res.body.refreshToken,
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(resRevoked.status).to.equal(401);

      const resRevoked2 = await request(app).post("/api/auth/refresh").send({
        refreshToken: res2.body.refreshToken,
        deviceId: "bdf3403ec56c4283b5291c2ad6094bde",
      });
      expect(resRevoked2.status).to.equal(401);
    });
  });

  describe("POST /api/auth/set-password", () => {
    it("should set the password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      await prisma.user.update({
        where: { id: res.body.id },
        data: { password: null },
      });

      const setPasswordRes = await request(app)
        .post("/api/auth/set-password")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          password: "PASSword%123",
          confirmPassword: "PASSword%123",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });

      expect(setPasswordRes.status).to.equal(200);
    });

    it("should return 401 for invalid token", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      await prisma.user.update({
        where: { id: res.body.id },
        data: { password: null },
      });

      const setPasswordRes = await request(app)
        .post("/api/auth/set-password")
        .set("Authorization", `Bearer invalidtoken`)
        .send({
          password: "PASSword%123",
          confirmPassword: "PASSword%123",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });

      expect(setPasswordRes.status).to.equal(401);
    });

    it("should return 401 for an refresh token", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      await prisma.user.update({
        where: { id: res.body.id },
        data: { password: null },
      });

      const setPasswordRes = await request(app)
        .post("/api/auth/set-password")
        .set("Authorization", `Bearer ${res.body.refreshToken}`)
        .send({
          password: "PASSword%123",
          confirmPassword: "PASSword%123",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });

      expect(setPasswordRes.status).to.equal(401);
    });

    it("should return 401 for empty token", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      await prisma.user.update({
        where: { id: res.body.id },
        data: { password: null },
      });
      const setPasswordRes = await request(app)
        .post("/api/auth/set-password")
        .set("Authorization", `Bearer `)
        .send({
          password: "PASSword%123",
          confirmPassword: "PASSword%123",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });
      expect(setPasswordRes.status).to.equal(401);
    });

    it("should return 400 for empty parameters", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      await prisma.user.update({
        where: { id: res.body.id },
        data: { password: null },
      });

      const setPasswordRes = await request(app)
        .post("/api/auth/set-password")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({});
      expect(setPasswordRes.status).to.equal(400);
      expect(setPasswordRes.body).to.have.property("errors").to.be.an("object");
      expect(setPasswordRes.body.errors)
        .to.have.property("body")
        .to.be.an("object");
      const fields = ["password", "confirmPassword", "deviceId"];
      fields.forEach((field) => {
        expect(setPasswordRes.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(setPasswordRes.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
        expect(setPasswordRes.body.errors.body[field]._errors).to.include(
          "Required"
        );
      });
    });

    it("should return 400 for invalid parameters", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      await prisma.user.update({
        where: { id: res.body.id },
        data: { password: null },
      });
      const setPasswordRes = await request(app)
        .post("/api/auth/set-password")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          password: "t",
          confirmPassword: "123",
          deviceId: "jkdf",
        });
      const fields = ["password", "deviceId"];
      fields.forEach((field) => {
        expect(setPasswordRes.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(setPasswordRes.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
      });
    });

    it("should return 400 for invalid password confirmation", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });
      await prisma.user.update({
        where: { id: res.body.id },
        data: { password: null },
      });
      const setPasswordRes = await request(app)
        .post("/api/auth/set-password")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          password: "PASSword%123",
          confirmPassword: "PASSword%1234",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });
      expect(setPasswordRes.status).to.equal(400);
    });

    it("should return 404 for non-existing user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      await prisma.user.delete({
        where: { id: res.body.id },
      });

      const setPasswordRes = await request(app)
        .post("/api/auth/set-password")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          password: "PASSword%123",
          confirmPassword: "PASSword%123",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });
      expect(setPasswordRes.status).to.equal(404);
    });

    it("should return 404 for a use who has a password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const setPasswordRes = await request(app)
        .post("/api/auth/set-password")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          password: "PASSword%123",
          confirmPassword: "PASSword%123",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });
      expect(setPasswordRes.status).to.equal(404);
    });

    it("should return 401 for deleted user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      await prisma.user.update({
        where: { id: res.body.id },
        data: { deletedAt: new Date() },
      });

      const setPasswordRes = await request(app)
        .post("/api/auth/set-password")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          password: "PASSword%123",
          confirmPassword: "PASSword%123",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });
      expect(setPasswordRes.status).to.equal(404);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should return 200 with tokens", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });
      const refreshRes = await request(app).post("/api/auth/refresh").send({
        refreshToken: res.body.refreshToken,
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(refreshRes.status).to.equal(200);
      expect(refreshRes.body).to.have.property("accessToken").to.be.a("string");
      expect(refreshRes.body)
        .to.have.property("refreshToken")
        .to.be.a("string");
    });

    it("should return 400 with empty parameters", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const refreshRes = await request(app).post("/api/auth/refresh").send({});

      expect(refreshRes.status).to.equal(400);
    });

    it("should return 400 with invalid parameters", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const refreshRes = await request(app).post("/api/auth/refresh").send({
        refreshToken: "invalidtoken",
        deviceId: "jkdf",
      });

      expect(refreshRes.status).to.equal(400);
      expect(refreshRes.body).to.have.property("errors").to.be.an("object");
      expect(refreshRes.body.errors)
        .to.have.property("body")
        .to.be.an("object");
      expect(refreshRes.body.errors.body)
        .to.have.property("refreshToken")
        .that.is.an("object");
      expect(refreshRes.body.errors.body.refreshToken)
        .to.have.property("_errors")
        .that.is.an("array");
      expect(refreshRes.body.errors.body)
        .to.have.property("deviceId")
        .that.is.an("object");
      expect(refreshRes.body.errors.body.deviceId)
        .to.have.property("_errors")
        .that.is.an("array");
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const refreshRes = await request(app)
        .post("/api/auth/refresh")
        .send({
          refreshToken: res.body.refreshToken + "invalid",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });

      expect(refreshRes.status).to.equal(401);
    });

    it("should return 401 with unmatched deviceId", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const refreshRes = await request(app).post("/api/auth/refresh").send({
        refreshToken: res.body.refreshToken,
        deviceId: "bdf3403ec56c4283b5291c2ad6094bcf",
      });

      expect(refreshRes.status).to.equal(401);
    });

    it("should return 401 with a revoked token", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      // Wait until the timestamp is updated
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const revokeRes = await request(app).post("/api/auth/login").send({
        username: "testuser",
        password: "PASSword%123",
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const refreshRes = await request(app).post("/api/auth/refresh").send({
        refreshToken: res.body.refreshToken,
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      expect(refreshRes.status).to.equal(401);
    });
  });

  describe("PUT /api/auth/join-admin", () => {
    process.env.ADMIN_REF_CODE = "9f9712b9-46db-4641-b1d5-80a9ab362ccd";
    it("should join admin", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const joinAdminRes = await request(app)
        .put("/api/auth/join-admin")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          referenceCode: "9f9712b9-46db-4641-b1d5-80a9ab362ccd",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });

      expect(joinAdminRes.status).to.equal(200);
      expect(joinAdminRes.body)
        .to.have.property("username")
        .to.equal("testuser");
      expect(joinAdminRes.body).to.have.property("avatarUrl").to.equal(null);
      expect(joinAdminRes.body).to.have.property("isAdmin").to.equal(true);
      expect(joinAdminRes.body)
        .to.have.property("accessToken")
        .to.be.a("string");
      expect(joinAdminRes.body)
        .to.have.property("refreshToken")
        .to.be.a("string");
      expect(joinAdminRes.body).to.have.property("id").to.be.a("string");
    });

    it("should return 400 for empty parameters", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const joinAdminRes = await request(app)
        .put("/api/auth/join-admin")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({});

      expect(joinAdminRes.status).to.equal(400);
      expect(joinAdminRes.body).to.have.property("errors").to.be.an("object");
      expect(joinAdminRes.body.errors)
        .to.have.property("body")
        .to.be.an("object");

      const fields = ["referenceCode", "deviceId"];

      fields.forEach((field) => {
        expect(joinAdminRes.body.errors.body)
          .to.have.property(field)
          .that.is.an("object");
        expect(joinAdminRes.body.errors.body[field])
          .to.have.property("_errors")
          .that.is.an("array");
        expect(joinAdminRes.body.errors.body[field]._errors).to.include(
          "Required"
        );
      });
    });

    it("should return 400 for invalid parameters", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const joinAdminRes = await request(app)
        .put("/api/auth/join-admin")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          referenceCode: "invalid-code",
          deviceId: "jkdf",
        });

      expect(joinAdminRes.status).to.equal(400);
      expect(joinAdminRes.body).to.have.property("errors").to.be.an("object");
      expect(joinAdminRes.body.errors)
        .to.have.property("body")
        .to.be.an("object");
    });

    it("should return 401 for invalid token", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const joinAdminRes = await request(app)
        .put("/api/auth/join-admin")
        .set("Authorization", `Bearer ${res.body.accessToken}invalid`)
        .send({
          referenceCode: "9f9712b9-46db-4641-b1d5-80a9ab362ccd",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });

      expect(joinAdminRes.status).to.equal(401);
    });

    it("should return 401 for empty token", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const joinAdminRes = await request(app)
        .put("/api/auth/join-admin")
        .set("Authorization", `Bearer `)
        .send({
          referenceCode: "9f9712b9-46db-4641-b1d5-80a9ab362ccd",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });

      expect(joinAdminRes.status).to.equal(401);
    });

    it("should return 404 for deleted user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      await prisma.user.update({
        where: { id: res.body.id },
        data: { deletedAt: new Date() },
      });
      const joinAdminRes = await request(app)
        .put("/api/auth/join-admin")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          referenceCode: "9f9712b9-46db-4641-b1d5-80a9ab362ccd",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });
      expect(joinAdminRes.status).to.equal(404);
    });

    it("should return 409 for already joined admin", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const joinAdminRes = await request(app)
        .put("/api/auth/join-admin")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          referenceCode: "9f9712b9-46db-4641-b1d5-80a9ab362ccd",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });
      expect(joinAdminRes.status).to.equal(200);

      const joinAdminRes2 = await request(app)
        .put("/api/auth/join-admin")
        .set("Authorization", `Bearer ${joinAdminRes.body.accessToken}`)
        .send({
          referenceCode: "9f9712b9-46db-4641-b1d5-80a9ab362ccd",
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });
      expect(joinAdminRes2.status).to.equal(400);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout the user, but not logout all the device", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const res2 = await request(app).post("/api/auth/login").send({
        username: "testuser",
        password: "PASSword%123",
        deviceId: "bdf3403ec56c4283b5291c2ad6094bde",
      });

      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
        });

      expect(logoutRes.status).to.equal(204);

      const refreshRes = await request(app).post("/api/auth/refresh").send({
        refreshToken: res.body.refreshToken,
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });
      expect(refreshRes.status).to.equal(401);

      const refreshRes2 = await request(app).post("/api/auth/refresh").send({
        refreshToken: res2.body.refreshToken,
        deviceId: "bdf3403ec56c4283b5291c2ad6094bde",
      });
      expect(refreshRes2.status).to.equal(200);
    });

    it("should logout all the devices", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const res2 = await request(app).post("/api/auth/login").send({
        username: "testuser",
        password: "PASSword%123",
        deviceId: "bdf3403ec56c4283b5291c2ad6094bde",
      });

      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({});

      expect(logoutRes.status).to.equal(204);

      const refreshRes = await request(app).post("/api/auth/refresh").send({
        refreshToken: res.body.refreshToken,
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });
      expect(refreshRes.status).to.equal(401);

      const refreshRes2 = await request(app).post("/api/auth/refresh").send({
        refreshToken: res2.body.refreshToken,
        deviceId: "bdf3403ec56c4283b5291c2ad6094bde",
      });
      expect(refreshRes2.status).to.equal(401);
    });

    it("should return 401 for invalid token", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${res.body.accessToken}invalid`)
        .send({});

      expect(logoutRes.status).to.equal(401);
    });

    it("should return 401 for empty token", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer `)
        .send({});

      expect(logoutRes.status).to.equal(401);
    });

    it("should return 404 for deleted user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      await prisma.user.update({
        where: { id: res.body.id },
        data: { deletedAt: new Date() },
      });
      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({});
      expect(logoutRes.status).to.equal(404);
    });

    it("should return 400 for invalid deviceId", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "PASSword%123",
        confirmPassword: "PASSword%123",
        consentAt: new Date(),
        deviceId: "bdf3403ec56c4283b5291c2ad6094bce",
      });

      const logoutRes = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${res.body.accessToken}`)
        .send({
          deviceId: "",
        });

      expect(logoutRes.status).to.equal(400);
    });
  });
});
