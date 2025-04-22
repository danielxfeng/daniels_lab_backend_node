import { expect } from "chai";
import sinon from "sinon";
import * as jwtTools from "../../src/utils/jwt_tools/sign_jwt";
import * as verifyJwtModule from "../../src/utils/jwt_tools/verify_jwt";
import {
  revokeRefreshToken,
  issueUserTokens,
  useRefreshToken,
} from "../../src/service/auth/service_user_token";
import { stubPrisma } from "../mocks/prisma_mock";
import { User } from "../../src/types/type_auth";
import { hashedToken } from "../../src/utils/crypto";

describe("service_user_token", () => {
  const user: User = { id: "0898bceb-6a62-47da-a32e-0ba02b09bb61", isAdmin: false };
  const deviceId = "browser-xyz";
  const accessToken = "access.token.value";
  const refreshToken = "refresh.token.value";

  afterEach(() => {
    sinon.restore();
  });

  describe("revokeRefreshToken", () => {
    it("should delete all expired and target tokens if deviceId is given", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.refreshToken.deleteMany.resolves({ count: 1 });

      await revokeRefreshToken(user.id, deviceId);

      expect(prismaStubs.refreshToken.deleteMany.calledOnce).to.be.true;
      const query = prismaStubs.refreshToken.deleteMany.firstCall.args[0];
      expect(query.where.OR).to.be.an("array");
      expect(query.where.OR[1]).to.include({
        deviceId: deviceId
      });
    });

    it("should delete all expired tokens, and all users token when device id is not given", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.refreshToken.deleteMany.resolves({ count: 1 });

      await revokeRefreshToken(user.id);

      expect(prismaStubs.refreshToken.deleteMany.calledOnce).to.be.true;
      const query = prismaStubs.refreshToken.deleteMany.firstCall.args[0];
      expect(query.where.OR).to.be.an("array");
      expect(query.where.OR[1]).to.include({
        userId: user.id
      });
      expect(query.where.OR[1]).to.not.include({
        deviceId: deviceId
      });
      expect(query.where.OR[0].expiresAt.lte).to.be.a("date");
    });
  });

  describe("issueUserTokens", () => {
    it("should revoke old tokens and issue new ones", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.refreshToken.deleteMany.resolves({ count: 1 });
      prismaStubs.refreshToken.create.resolves();

      sinon
        .stub(jwtTools, "signJwt")
        .onFirstCall()
        .returns(accessToken)
        .onSecondCall()
        .returns(refreshToken);

      const result = await issueUserTokens(
        user.id,
        user.isAdmin,
        deviceId,
        true
      );

      expect(result.accessToken).to.equal(accessToken);
      expect(result.refreshToken).to.equal(refreshToken);
      expect(prismaStubs.refreshToken.create.calledOnce).to.be.true;
    });
  });

  describe("useRefreshToken", () => {
    it("should revoke the refresh token and return user", async () => {
      const prismaStubs = stubPrisma();
      const tokenHash = hashedToken(refreshToken);
      prismaStubs.refreshToken.deleteMany.resolves({ count: 1 });

      sinon.stub(verifyJwtModule, "verifyJwt").returns({ valid: user });

      const result = await useRefreshToken(refreshToken, deviceId);

      expect(result).to.deep.equal(user);
      expect(prismaStubs.refreshToken.deleteMany.calledOnce).to.be.true;
      const arg = prismaStubs.refreshToken.deleteMany.firstCall.args[0];
      expect(arg.where.token).to.equal(tokenHash);
    });

    it("should throw 401 if token not found", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.refreshToken.deleteMany.resolves({ count: 0 });
      sinon.stub(verifyJwtModule, "verifyJwt").returns({ valid: user });

      try {
        await useRefreshToken(refreshToken, deviceId);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(401);
        expect(err.message).to.equal("Invalid token");
      }
    });
  });
});
