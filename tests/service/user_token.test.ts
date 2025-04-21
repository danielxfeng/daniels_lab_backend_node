import { expect } from "chai";
import { hashedToken, issueUserToken, validateRefreshToken  } from "../../src/service/auth/service_user_token";
import sinon from "sinon";
import { stubPrisma } from "../mocks/prisma_mock";
import { signJwt } from "../../src/utils/jwt_tools/sign_jwt";
import { verifyJwt } from "../../src/utils/jwt_tools/verify_jwt";

describe("tokenService", () => {
  const userId = "user-123";
  const deviceId = "device-abc";
  const user = { id: userId, isAdmin: false };

  describe("hashedToken", () => {
    it("should return the same hash for the same input", () => {
      const hash1 = hashedToken("abc123");
      const hash2 = hashedToken("abc123");
      expect(hash1).to.equal(hash2);
    });

    it("should return different hashes for different input", () => {
      expect(hashedToken("a")).to.not.equal(hashedToken("b"));
    });
  });

  describe("issueUserToken", () => {
    it("should generate and store access and refresh tokens", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.refreshToken.deleteMany.resolves();
      prismaStubs.refreshToken.create.resolves();

      const result = await issueUserToken(userId, false, deviceId, false);

      expect(result.accessToken).to.be.a("string");
      expect(result.refreshToken).to.be.a("string");

      const expectedHash = hashedToken(result.refreshToken);

      expect(prismaStubs.refreshToken.deleteMany.calledOnce).to.be.true;
      expect(prismaStubs.refreshToken.create.calledOnce).to.be.true;

      const createArgs = prismaStubs.refreshToken.create.firstCall.args[0];
      expect(createArgs.data.userId).to.equal(userId);
      expect(createArgs.data.deviceId).to.equal(deviceId);
      expect(createArgs.data.token).to.equal(expectedHash);
      expect(createArgs.data.expiresAt).to.be.instanceOf(Date);
    });
  });

  describe("validateRefreshToken", () => {
    const validToken = signJwt(user, "1d");
    const shortLivedToken = signJwt(user, "1ms");

    afterEach(() => {
      sinon.restore();
    });

    it("should return user if token is valid and matches deviceId", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.refreshToken.findUnique.resolves({
        token: hashedToken(validToken),
        deviceId,
      });

      const result = await validateRefreshToken(validToken, deviceId);
      expect(result.id).to.equal(user.id);
      expect(result.isAdmin).to.equal(user.isAdmin);
    });

    it("should throw 401 if token not found", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.refreshToken.findUnique.resolves(null);

      try {
        await validateRefreshToken(validToken, deviceId);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(401);
        expect(err.message).to.equal("Invalid token");
      }
    });

    it("should throw 401 if deviceId mismatches", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.refreshToken.findUnique.resolves({
        token: hashedToken(validToken),
        deviceId: "wrong-device",
      });

      try {
        await validateRefreshToken(validToken, deviceId);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(401);
        expect(err.message).to.equal("Invalid token");
      }
    });

    it("should throw 401 if token is expired", async () => {
      await new Promise((res) => setTimeout(res, 10)); // 等待 10ms 使 token 过期

      try {
        await validateRefreshToken(shortLivedToken, deviceId);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(401);
        expect(err.message).to.equal("Invalid token");
      }
    });
  });
});
