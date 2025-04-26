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
});
