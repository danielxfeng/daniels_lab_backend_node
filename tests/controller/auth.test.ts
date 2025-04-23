import { expect } from "chai";
import sinon from "sinon";
import authController from "../../src/controllers/controller_auth";
import * as serviceAuth from "../../src/service/auth/service_auth";
import * as tokenService from "../../src/service/auth/service_user_token";
import { terminateWithErr } from "../../src/utils/terminate_with_err";
import * as crypto from "../../src/utils/crypto";
import { stubPrisma } from "../mocks/prisma_mock";
import * as serviceToken from "../../src/service/auth/service_user_token";

describe("authController.register", () => {
  let req: any, res: any;

  beforeEach(() => {
    sinon.restore();
    req = {
      body: {
        username: "testuser",
        password: "testpass",
        avatarUrl: "https://avatar",
        consentAt: new Date().toISOString(),
        deviceId: "device-123",
      },
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
  });

  it("should register a normal user successfully", async () => {
    const mockResponse = {
      id: "326ab936-28f6-433d-abff-15746c88c9be",
      username: "testuser",
      isAdmin: false,
      accessToken: "access-token-123-abc",
      refreshToken: "refresh-token-123-abc",
      createAt: new Date(),
      updatedAt: new Date(),
      oauthProviders: [],
      avatarUrl: "https://avatar.com/testuser",
    };

    const stub = sinon.stub(serviceAuth, "registerUser").resolves(mockResponse);

    await authController.register(req, res);

    expect(stub.calledOnce).to.be.true;
    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith(mockResponse)).to.be.true;
  });

  it("should throw 409 if user already exists", async () => {
    req.body.username = undefined;

    sinon.stub(serviceAuth, "registerUser").callsFake(() => {
      return terminateWithErr(409, "User already exists");
    });

    try {
      await authController.register(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(409);
    }
  });

  it("should throw 400 if username or password is missing", async () => {
    req.body.username = undefined;

    sinon.stub(serviceAuth, "registerUser").callsFake(() => {
      return terminateWithErr(
        400,
        "Username is required for normal registration"
      );
    });

    try {
      await authController.register(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(400);
    }
  });
});

describe("authController.login", () => {
  let req: any, res: any;

  const mockUser = {
    id: "user-123",
    username: "testuser",
    avatarUrl: "https://avatar.png",
    isAdmin: false,
    oauthAccounts: [],
  } as any;

  const mockTokens = {
    accessToken: "mock-access",
    refreshToken: "mock-refresh",
  };

  beforeEach(() => {
    sinon.restore();

    req = {
      body: {
        username: "testuser",
        password: "testpass",
        deviceId: "device-xyz",
      },
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
  });

  it("should login successfully and return tokens", async () => {
    sinon.stub(serviceAuth, "verifyUser").resolves(mockUser);
    sinon.stub(tokenService, "issueUserTokens").resolves(mockTokens);

    const mockResponse = {
      ...mockUser,
      accessToken: mockTokens.accessToken,
      refreshToken: mockTokens.refreshToken,
      oauthProviders: [],
    };
    const spy = sinon
      .stub(serviceAuth, "generate_user_response")
      .returns(mockResponse);

    await authController.login(req, res);

    expect(spy.calledOnce).to.be.true;
    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith(mockResponse)).to.be.true;
  });

  it("should throw 401 if verifyUser fails", async () => {
    sinon
      .stub(serviceAuth, "verifyUser")
      .callsFake(() => terminateWithErr(401, "Invalid username or password"));

    try {
      await authController.login(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(401);
      expect(err.message).to.include("Invalid");
    }
  });

  it("should throw 500 if token issuance fails", async () => {
    sinon.stub(serviceAuth, "verifyUser").resolves(mockUser);
    sinon
      .stub(tokenService, "issueUserTokens")
      .callsFake(() => terminateWithErr(500, "Token generation failed"));

    try {
      await authController.login(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(500);
    }
  });
});

describe("authController.changePassword", () => {
  let req: any, res: any;

  const mockUser = {
    id: "user-abc",
    username: "testuser",
    password: "hashed-old-password",
    avatarUrl: null,
    isAdmin: false,
    oauthAccounts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    consentAt: new Date(),
  };

  const mockTokens = {
    accessToken: "access-token-abc",
    refreshToken: "refresh-token-def",
  };

  beforeEach(() => {
    sinon.restore();
    req = {
      body: {
        currentPassword: "oldpass",
        password: "newpass",
        deviceId: "device-xyz",
      },
      user: { id: mockUser.id },
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
  });

  it("should change password and return new tokens", async () => {
    const prismaStubs = stubPrisma();

    sinon.stub(serviceAuth, "verifyUser").resolves(mockUser);
    sinon.stub(crypto, "hashPassword").resolves("hashed-new-password");

    prismaStubs.user.update.resolves({
      ...mockUser,
      password: "hashed-new-password",
    });

    sinon.stub(tokenService, "issueUserTokens").resolves(mockTokens);
    const response = {
      ...mockUser,
      accessToken: mockTokens.accessToken,
      refreshToken: mockTokens.refreshToken,
      oauthProviders: [],
    };
    const spy = sinon
      .stub(serviceAuth, "generate_user_response")
      .returns(response);

    await authController.changePassword(req, res);

    expect(spy.calledOnce).to.be.true;
    expect(prismaStubs.user.update.calledOnce).to.be.true;
    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith(response)).to.be.true;
  });

  it("should return 401 if current password is wrong", async () => {
    sinon
      .stub(serviceAuth, "verifyUser")
      .callsFake(() => terminateWithErr(401, "Invalid password"));

    try {
      await authController.changePassword(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(401);
    }
  });

  it("should return 500 if updating password fails", async () => {
    const prismaStubs = stubPrisma();

    sinon.stub(serviceAuth, "verifyUser").resolves(mockUser);
    sinon.stub(crypto, "hashPassword").resolves("hashed-new-password");

    prismaStubs.user.update.rejects(new Error("DB error"));

    try {
      await authController.changePassword(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.message).to.equal("DB error");
    }
  });
});

describe("authController.joinAdmin", () => {
  let req: any, res: any;

  const mockUser = {
    id: "user-abc",
    isAdmin: false,
    oauthAccounts: [],
    deletedAt: null,
  } as any;

  const mockTokens = {
    accessToken: "admin-access-token",
    refreshToken: "admin-refresh-token",
  };

  beforeEach(() => {
    sinon.restore();
    process.env.ADMIN_REF_CODE = "secret-code";

    req = {
      body: {
        referenceCode: "secret-code",
        deviceId: "device-001",
      },
      user: {
        id: mockUser.id,
      },
    };

    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
  });

  it("should promote user to admin and return new tokens", async () => {
    const prismaStubs = stubPrisma();

    sinon.stub(serviceAuth, "verifyUser").resolves(mockUser);
    prismaStubs.user.update.resolves({ ...mockUser, isAdmin: true });
    sinon.stub(tokenService, "issueUserTokens").resolves(mockTokens);

    const response = {
      ...mockUser,
      isAdmin: true,
      accessToken: mockTokens.accessToken,
      refreshToken: mockTokens.refreshToken,
      oauthProviders: [],
    };

    sinon.stub(serviceAuth, "generate_user_response").returns(response as any);

    await authController.joinAdmin(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith(response)).to.be.true;
  });

  it("should return 400 if referenceCode is invalid", async () => {
    req.body.referenceCode = "wrong-code";

    try {
      await authController.joinAdmin(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(400);
      expect(err.message).to.include("Invalid reference code");
    }
  });

  it("should return 400 if user is already an admin", async () => {
    sinon
      .stub(serviceAuth, "verifyUser")
      .resolves({ ...mockUser, isAdmin: true });

    try {
      await authController.joinAdmin(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(400);
      expect(err.message).to.include("Already an admin");
    }
  });
});

describe("authController.refresh", () => {
  let req: any, res: any;

  const mockUser = {
    id: "user-abc",
    isAdmin: false,
  };

  const mockTokens = {
    accessToken: "new-access-token",
    refreshToken: "new-refresh-token",
  };

  beforeEach(() => {
    sinon.restore();

    req = {
      body: {
        refreshToken: "old-refresh-token",
        deviceId: "device-xyz",
      },
    };

    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
  });

  it("should return new tokens when refresh token is valid", async () => {
    sinon.stub(tokenService, "useRefreshToken").resolves(mockUser);
    sinon.stub(tokenService, "issueUserTokens").resolves(mockTokens);

    await authController.refresh(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith(mockTokens)).to.be.true;
  });

  it("should return 401 if refresh token is invalid", async () => {
    sinon
      .stub(tokenService, "useRefreshToken")
      .callsFake(() => terminateWithErr(401, "Invalid refresh token"));

    try {
      await authController.refresh(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(401);
      expect(err.message).to.include("Invalid refresh token");
    }
  });

  it("should return 500 if token generation fails", async () => {
    sinon.stub(tokenService, "useRefreshToken").resolves(mockUser);
    sinon
      .stub(tokenService, "issueUserTokens")
      .callsFake(() => terminateWithErr(500, "Token generation error"));

    try {
      await authController.refresh(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(500);
      expect(err.message).to.include("Token generation error");
    }
  });
});

describe("authController.logout", () => {
  let req: any, res: any;

  beforeEach(() => {
    sinon.restore();
    req = {
      user: { id: "user-abc" },
      body: {},
    };
    res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };
  });

  it("should revoke all tokens when deviceId is not provided", async () => {
    const revokeStub = sinon
      .stub(tokenService, "revokeRefreshToken")
      .resolves();

    await authController.logout(req, res);

    expect(revokeStub.calledOnceWithExactly("user-abc", undefined)).to.be.true;
    expect(res.status.calledWith(204)).to.be.true;
    expect(res.send.calledOnce).to.be.true;
  });

  it("should revoke only current device token when deviceId is provided", async () => {
    req.body.deviceId = "device-xyz";
    const revokeStub = sinon
      .stub(tokenService, "revokeRefreshToken")
      .resolves();

    await authController.logout(req, res);

    expect(revokeStub.calledOnceWithExactly("user-abc", "device-xyz")).to.be
      .true;
    expect(res.status.calledWith(204)).to.be.true;
    expect(res.send.calledOnce).to.be.true;
  });
});

describe("authController.checkUsername", () => {
  let req: any, res: any;

  beforeEach(() => {
    sinon.restore();
    req = {
      params: {
        username: "testuser",
      },
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
  });

  it("should return exists: true if username exists", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.user.findUnique.resolves({ id: "user-id-123" });

    await authController.checkUsername(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith({ exists: true })).to.be.true;
  });

  it("should return exists: false if username does not exist", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.user.findUnique.resolves(null);

    await authController.checkUsername(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith({ exists: false })).to.be.true;
  });
});

describe("authController.deleteUser", () => {
  let req: any, res: any;
  const targetUserId = "target-user-123";
  const adminUserId = "admin-456";

  beforeEach(() => {
    sinon.restore();
    req = {
      params: { userId: targetUserId },
      user: { id: adminUserId },
    };
    res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };
  });

  it("should delete user, revoke tokens and return 204", async () => {
    const prismaStubs = stubPrisma();

    prismaStubs.user.findFirst.resolves({ isAdmin: true });
    prismaStubs.user.updateMany.resolves({ count: 1 });
    prismaStubs.oauthAccount.deleteMany.resolves({ count: 1 });
    const revokeStub = sinon.stub(serviceToken, "revokeRefreshToken").resolves();

    await authController.deleteUser(req, res);

    expect(prismaStubs.user.findFirst.calledOnce).to.be.true;
    expect(prismaStubs.user.updateMany.calledOnce).to.be.true;
    expect(prismaStubs.oauthAccount.deleteMany.calledOnce).to.be.true;
    expect(revokeStub.calledWith(targetUserId)).to.be.true;
    expect(res.status.calledWith(204)).to.be.true;
    expect(res.send.calledOnce).to.be.true;
  });

  it("should return 401 if current user not found", async () => {
    const prismaStubs = stubPrisma();

    prismaStubs.user.findFirst.resolves(null);

    try {
      await authController.deleteUser(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(401);
      expect(err.message).to.include("Invalid credentials");
    }
  });

  it("should return 403 if user is not admin", async () => {
    const prismaStubs = stubPrisma();

    prismaStubs.user.findFirst.resolves({ isAdmin: false });

    try {
      await authController.deleteUser(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(403);
      expect(err.message).to.include("Forbidden");
    }
  });

  it("should return 404 if target user not found", async () => {
    const prismaStubs = stubPrisma();

    prismaStubs.user.findFirst.resolves({ isAdmin: true });
    prismaStubs.user.updateMany.resolves({ count: 0 });

    try {
      await authController.deleteUser(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(404);
      expect(err.message).to.include("User not found");
    }
  });
});
