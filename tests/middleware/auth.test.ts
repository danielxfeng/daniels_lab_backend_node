/**
 * @file auth.test.ts
 * @description Unit tests for the authentication middleware.
 * The middleware auth, authAdmin are tested.
 * Success and failure cases 401, 403, 498 are tested.
 *
 * The tests of signing JWT and verifying JWT are covered in `jwt` tests.
 */
import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import { expect } from "chai";
import { signJwt } from "../../src/utils/jwt_tools/sign_jwt";
import { auth, authAdmin, optAuth } from "../../src/middleware/auth";
import { User } from "../../src/types/type_auth";
import errorHandler from "../../src/middleware/error_handler";

// Mocked user
const user: User = {
  id: "user_123",
  isAdmin: false,
};

const admin: User = {
  ...user,
  isAdmin: true,
};

describe("Auth Middleware", () => {
  const app = express();

  // Mocked controller: apply auth middleware
  app.get("/protected", auth, (req: Request, res: Response) => {
    res.json({ user: (req as any).user });
  });

  // Mocked controller: apply authAdmin middleware
  app.get("/admin", authAdmin, (req: Request, res: Response) => {
    res.json({ user: (req as any).user });
  });

  app.use(errorHandler);

  it("should allow access with valid user token", async () => {
    const token = signJwt({ user, type: "access" }, "15m");

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.user).to.include({ id: user.id, isAdmin: false });
  });

  it("should allow access with valid admin token", async () => {
    const token = signJwt({ user: admin, type: "access" }, "15m");

    const res = await request(app)
      .get("/admin")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.user).to.include({ id: admin.id, isAdmin: true });
  });

  it("should deny access with missing token", async () => {
    const res = await request(app).get("/protected");
    expect(res.status).to.equal(401);
  });

  it("should deny access with invalid token", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer invalid.token.here`);
    expect(res.status).to.equal(401);
  });

  it("should deny access with expired token", async () => {
    const expiredToken = signJwt({ user, type: "access" }, "1ms");
    await new Promise((r) => setTimeout(r, 2));

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).to.equal(498);
  });

  it("should deny non-admin user to admin route", async () => {
    const token = signJwt({ user, type: "access" }, "15m");

    const res = await request(app)
      .get("/admin")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(403);
  });
});

describe("optAuth Middleware", () => {
  const app = express();

  app.use(express.json());

  app.get("/optional", optAuth, (req: Request, res: Response) => {
    res.json({ user: (req as any).user ?? null });
  });

  app.use(errorHandler);

  it("should attach user to request with valid token", async () => {
    const token = signJwt({ user, type: "access" }, "15m");
    const res = await request(app)
      .get("/optional")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.user).to.include({ id: user.id, isAdmin: false });
  });

  it("should allow access without token", async () => {
    const res = await request(app).get("/optional");
    expect(res.status).to.equal(200);
    expect(res.body.user).to.be.null;
  });

  it("should allow access with valid token", async () => {
    const token = signJwt({ user, type: "access" }, "15m");
    const res = await request(app)
      .get("/optional")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.user).to.include({ id: user.id, isAdmin: false });
  });

  it("should deny access with expired token", async () => {
    const expiredToken = signJwt({ user, type: "access" }, "1ms");
    await new Promise((r) => setTimeout(r, 2));
    const res = await request(app)
      .get("/optional")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).to.equal(498);
  });

  it("should deny access with invalid token", async () => {
    const res = await request(app)
      .get("/optional")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).to.equal(401);
  });
});
