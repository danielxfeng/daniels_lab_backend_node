import { describe, it } from "mocha";
import { expect } from "chai";
import {
  generate_user_response,
  registerUser,
  verifyUser,
  linkOauthAccount,
  loginOauthUser,
} from "../../src/service/auth/service_auth";
import { AuthResponse, OauthUserInfo } from "../../src/schema/schema_auth";
import { OauthProvider } from "../../src/schema/schema_components";
import sinon from "sinon";
import { stubPrisma } from "../mocks/prisma_mock";
import * as crypto from "../../src/utils/crypto";
import { UserResponse } from "../../src/service/auth/service_auth";

describe("generate_user_response", () => {
  it("should correctly format the user and tokens into AuthResponse", () => {
    const mockUser = {
      id: "326ab936-28f6-433d-abff-15746c88c9be",
      username: "john",
      avatarUrl: null,
      isAdmin: false,
      oauthAccounts: [{ provider: "google" }, { provider: "github" }],
    };

    const mockTokens = {
      accessToken: "access-token-abcabcabcabcabcabc",
      refreshToken: "refresh-token-defdefdefdefdefdefdef",
    };

    const response: AuthResponse = generate_user_response(
      mockUser as any,
      mockTokens
    );

    expect(response).to.deep.equal({
      id: "326ab936-28f6-433d-abff-15746c88c9be",
      username: "john",
      avatarUrl: null,
      isAdmin: false,
      hasPassword: false,
      accessToken: "access-token-abcabcabcabcabcabc",
      refreshToken: "refresh-token-defdefdefdefdefdefdef",
      oauthProviders: ["google", "github"] as OauthProvider[],
    });
  });
});

describe("registerUser", () => {
  const deviceId = "dev-abc";
  const consentAt = new Date().toISOString();

  beforeEach(() => sinon.restore());

  it("should register a user normally", async () => {
    const prismaStubs = stubPrisma();
    sinon.stub(crypto, "hashPassword").resolves("hashed-pass");
    prismaStubs.user.create.resolves({
      id: "326ab936-28f6-433d-abff-15746c88c9be",
      username: "mockuser",
      encryptedPwd: null,
      avatarUrl: null,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      consentAt: new Date(),
      deletedAt: null,
      oauthAccounts: [],
    } as UserResponse);

    const result = await registerUser(
      consentAt,
      false,
      deviceId,
      "mockuser",
      "Password12$"
    );
    expect(result.username).to.equal("mockuser");
    expect(result.accessToken).to.be.a("string");
  });

  it("should register a user with oauth", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.user.create.resolves({
      id: "326ab936-28f6-433d-abff-15746c88c9be",
      username: "mockuser",
      encryptedPwd: null,
      avatarUrl: null,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      consentAt: new Date(),
      deletedAt: null,
      oauthAccounts: [{ provider: "google" }],
    } as UserResponse);

    const result = await registerUser(
      consentAt,
      true,
      deviceId,
      undefined,
      undefined,
      undefined,
      "google",
      "google-id-123"
    );
    expect(result.oauthProviders).to.include("google");
  });

  it("should throw 409 when username already exists", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.user.create.rejects({ code: "P2002" });

    try {
      await registerUser(consentAt, false, deviceId, "newuser", "Password12$");
    } catch (err: any) {
      expect(err.status).to.equal(409);
    }
  });

  it("should throw 400 for missing username or password in normal registration", async () => {
    try {
      await registerUser(consentAt, false, deviceId, undefined, undefined);
    } catch (err: any) {
      expect(err.status).to.equal(400);
    }
  });

  it("should throw 400 for missing oauthProvider or id in oauth registration", async () => {
    try {
      await registerUser(consentAt, true, deviceId);
    } catch (err: any) {
      expect(err.status).to.equal(400);
    }
  });
});

describe("verifyUser", () => {
  const userId = "326ab936-28f6-433d-abff-15746c88c9be";
  const validPassword = "Test@123";
  const hashedPassword = "$hashed$";
  const commonUserFields = {
    id: userId,
    username: "mockuser",
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    consentAt: new Date(),
    deletedAt: null,
    avatarUrl: null,
    oauthAccounts: [],
  };

  beforeEach(() => {
    stubPrisma();
    sinon.stub(crypto, "verifyPassword");
  });

  afterEach(() => sinon.restore());

  it("should return user when valid and password correct", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.user.findUnique.resolves({
      ...commonUserFields,
      encryptedPwd: hashedPassword,
    });

    sinon.stub(crypto, "verifyPassword").resolves(true);

    const result = await verifyUser(userId, validPassword, true);
    expect(result.id).to.equal(userId);
  });

  it("should throw 401 if password mismatch", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.user.findUnique.resolves({
      ...commonUserFields,
      password: hashedPassword,
    });

    sinon.stub(crypto, "verifyPassword").resolves(false);

    try {
      await verifyUser(userId, validPassword, true);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(401);
      expect(err.message).to.equal("Invalid username or password");
    }
  });

  it("should throw 401 if password is not set", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.user.findUnique.resolves({
      ...commonUserFields,
      password: null,
    });

    try {
      await verifyUser(userId, validPassword, true);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(401);
    }
  });

  it("should throw 404 if user is deleted, and checkPassword is false", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.user.findUnique.resolves({
      ...commonUserFields,
      deletedAt: new Date(),
      password: hashedPassword,
    });

    try {
      await verifyUser(userId, validPassword, false);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(404);
    }
  });

  it("should throw 401 if user not found", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.user.findUnique.resolves(null);

    try {
      await verifyUser(userId, validPassword, true);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(401);
    }
  });

  it("should return user without checking password", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.user.findUnique.resolves({
      ...commonUserFields,
      password: null,
    });

    const result = await verifyUser(userId, "", false);
    expect(result.id).to.equal(userId);
  });
});

describe("linkOauthAccount", () => {
  const userId = "326ab936-28f6-433d-abff-15746c88c9be";
  const provider = "google" as const;
  const userInfo: OauthUserInfo = {
    provider,
    id: "326ab936-28f6-433d-abff-15746c88c9be",
    avatar: "https://example.com/avatar.png",
  };

  beforeEach(() => {
    sinon.restore();
  });

  it("should throw 404 if user does not exist", async () => {
    const prismaStubs = stubPrisma();

    prismaStubs.tx.user.findUnique.resolves(null);

    try {
      await linkOauthAccount(userId, provider, userInfo);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(404);
      expect(err.message).to.include("User not found");
    }
  });

  it("should throw 404 if user is soft-deleted", async () => {
    const prismaStubs = stubPrisma();

    prismaStubs.tx.user.findUnique.resolves({
      id: userId,
      deletedAt: new Date(),
    } as any);

    try {
      await linkOauthAccount(userId, provider, userInfo);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(404);
      expect(err.message).to.include("User not found");
    }
  });

  it("should throw 409 if oauth account belongs to another user", async () => {
    const prismaStubs = stubPrisma();

    prismaStubs.tx.user.findUnique.resolves({
      id: userId,
      deletedAt: null,
    } as any);
    prismaStubs.tx.oauthAccount.findUnique.resolves({
      userId: "other-user",
    } as any);

    try {
      await linkOauthAccount(userId, provider, userInfo);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(409);
      expect(err.message).to.include("OAuth account already exists");
    }
  });
});

describe("loginOauthUser", () => {
  const provider = "google" as const;
  const userInfo: OauthUserInfo = {
    provider,
    id: "oauth-abc",
    avatar: "https://example.com/avatar.png",
  };

  beforeEach(() => sinon.restore());

  it("should return userId if oauth account and user are valid", async () => {
    const prismaStubs = stubPrisma();

    prismaStubs.oauthAccount.findUnique.resolves({
      userId: "user-123",
      user: {
        id: "user-123",
        isAdmin: false,
        deletedAt: null,
      },
    } as any);

    const userId = await loginOauthUser(provider, userInfo);
    expect(userId).to.equal("user-123");
  });

  it("should return null if oauth account not found", async () => {
    const prismaStubs = stubPrisma();

    prismaStubs.oauthAccount.findUnique.resolves(null);

    const userId = await loginOauthUser(provider, userInfo);
    expect(userId).to.be.null;
  });

  it("should return null if user is deleted", async () => {
    const prismaStubs = stubPrisma();

    prismaStubs.oauthAccount.findUnique.resolves({
      userId: "user-123",
      user: {
        id: "user-123",
        isAdmin: false,
        deletedAt: new Date(), // simulate deleted
      },
    } as any);

    const userId = await loginOauthUser(provider, userInfo);
    expect(userId).to.be.null;
  });
});
