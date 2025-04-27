import { expect } from "chai";
import sinon from "sinon";
import * as bcrypt from "bcrypt";
import {
  hashedToken,
  randomId,
  hashPassword,
  verifyPassword,
} from "../../src/utils/crypto";

describe("crypto utils", () => {
  describe("hashedToken", () => {
    it("should return sha256 hash", () => {
      const hash = hashedToken("test-token");
      expect(hash).to.be.a("string");
      expect(hash.length).to.equal(64);
    });

    it("should return different hashes for different tokens", () => {
      const hash1 = hashedToken("token1");
      const hash2 = hashedToken("token2");
      expect(hash1).to.not.equal(hash2);
    });

    it("should return the same hash for the same token", () => {
      const hash1 = hashedToken("same-token");
      const hash2 = hashedToken("same-token");
      expect(hash1).to.equal(hash2);
    });
  });

  describe("randomId", () => {
    it("should generate id with correct length", () => {
      const id = randomId("user-", 10);
      expect(id.startsWith("user-")).to.be.true;
      expect(id.length).to.equal(15);
    });

    it("should generate random string of specified length without prefix", () => {
      const id = randomId("", 12);
      expect(id).to.be.a("string");
      expect(id.length).to.equal(12);
    });
  });

  describe("hashPassword and verifyPassword", () => {
    const password = "S3cur3P@ss";

    it("should hash and verify password correctly", async () => {
      const hash = await hashPassword(password);
      expect(hash).to.be.a("string");
      const match = await verifyPassword(password, hash);
      expect(match).to.be.true;
    });

    it("should fail to verify incorrect password", async () => {
      const hash = await hashPassword(password);
      const match = await verifyPassword("wrongPassword", hash);
      expect(match).to.be.false;
    });
    
  });
});
