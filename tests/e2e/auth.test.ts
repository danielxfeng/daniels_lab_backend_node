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
        confirmPassword: "wrongpassword",
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
});
