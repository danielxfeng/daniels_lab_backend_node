import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import { expect } from "chai";
import { signJwt } from "../../src/utils/jwt_tools/sign_jwt";
import { auth, authAdmin } from "../../src/middleware/auth";
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
    const token = signJwt(user, "15m");

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.user).to.include({ id: user.id, isAdmin: false });
  });

  it("should allow access with valid admin token", async () => {
    const token = signJwt(admin, "15m");

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
    const expiredToken = signJwt(user, "1s");
    await new Promise((r) => setTimeout(r, 1200));

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).to.equal(498);
  });

  it("should deny non-admin user to admin route", async () => {
    const token = signJwt(user, "15m");

    const res = await request(app)
      .get("/admin")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(403);
  });
});
