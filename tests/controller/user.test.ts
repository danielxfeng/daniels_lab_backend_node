import { expect } from "chai";
import sinon from "sinon";
import userController, { TypeSelectUserWithOauth } from "../../src/controllers/controller_user";
import { UserResponse } from "../../src/schema/schema_users";
import { stubPrisma } from "../mocks/prisma_mock";

describe("userController.getCurrentUserProfile", () => {
  const req = { user: { id: "0898bceb-6a62-47da-a32e-0ba02b09bb61" } } as any;
  let res: any;

  const user1 = {
    id: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
    username: "testuser",
    avatarUrl: "https://uuuuuuuuuuuuu.png",
    isAdmin: false,
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-02T00:00:00Z"),
    consentAt: new Date("2023-01-03T00:00:00Z"),
    oauthAccounts: [
      { provider: "google" },
      { provider: "github" },
    ],
  };

  beforeEach(() => {
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
  });

  afterEach(() => sinon.restore());

  it("should return user1 with validated structure", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.user.findUnique.resolves(user1);

    await userController.getCurrentUserProfile(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    const json = res.json.firstCall.args[0] as UserResponse;

    expect(json.id).to.equal(user1.id);
    expect(json.username).to.equal(user1.username);
    expect(json.avatarUrl).to.equal(user1.avatarUrl);
    expect(json.isAdmin).to.be.false;
    expect(json.oauthProviders).to.include.members(["google", "github"]);
  });

  it("should return 500 error if user not found", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.user.findUnique.resolves(null);

    try {
      await userController.getCurrentUserProfile(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(500);
      expect(err.message).to.equal("User not found");
    }
  });

  describe("userController.updateCurrentUserInfo", () => {
    const req = {
      user: { id: "0898bceb-6a62-47da-a32e-0ba02b09bb61" },
      body: {
        username: "updateduser",
        avatarUrl: "https://updated.avatar.url",
      },
    } as any;
  
    let res: any;
  
    const updatedUser = {
      id: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
      username: "updateduser",
      avatarUrl: "https://updated.avatar.url",
      isAdmin: false,
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2023-01-02T00:00:00Z"),
      consentAt: new Date("2023-01-03T00:00:00Z"),
      oauthAccounts: [{ provider: "google" }],
    };
  
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis(),
      };
    });
  
    afterEach(() => sinon.restore());
  
    it("should update the user and return validated data", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.user.update.resolves(updatedUser);
  
      await userController.updateCurrentUserInfo(req, res);
  
      expect(res.status.calledWith(200)).to.be.true;
      const json = res.json.firstCall.args[0];
  
      expect(json.id).to.equal(updatedUser.id);
      expect(json.username).to.equal("updateduser");
      expect(json.avatarUrl).to.equal("https://updated.avatar.url");
      expect(json.oauthProviders).to.deep.equal(["google"]);
    });
  
    it("should throw error if prisma throws error", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.user.update.rejects(new Error("DB error"));
  
      try {
        await userController.updateCurrentUserInfo(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.message).to.equal("DB error");
      }
    });
  });

  describe("userController.listAllUsers", () => {
    const adminReq = { user: { id: "0898bceb-6a62-47da-a32e-0ba02b09bb61" } } as any;
    const normalReq = { user: { id: "0898bceb-6a62-47da-a32e-0ba02b09bb61" } } as any;
    let res: any;
  
    const users = [
      {
        id: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
        username: "user1",
        avatarUrl: null,
        isAdmin: false,
        createdAt: new Date("2023-01-01T00:00:00Z"),
        updatedAt: new Date("2023-01-02T00:00:00Z"),
        consentAt: new Date("2023-01-03T00:00:00Z"),
        oauthAccounts: [{ provider: "google" }],
      },
      {
        id: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
        username: "user2",
        avatarUrl: "https://example.com/u2.png",
        isAdmin: false,
        createdAt: new Date("2023-01-04T00:00:00Z"),
        updatedAt: new Date("2023-01-05T00:00:00Z"),
        consentAt: new Date("2023-01-06T00:00:00Z"),
        oauthAccounts: [{ provider: "github" }],
      },
    ];
  
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis(),
      };
    });
  
    afterEach(() => sinon.restore());
  
    it("should return 200 and all users if current user is admin", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.user.findUnique.resolves({ isAdmin: true });
      prismaStubs.user.findMany.resolves(users);
  
      await userController.listAllUsers(adminReq, res);
  
      expect(res.status.calledWith(200)).to.be.true;
      const json = res.json.firstCall.args[0];
  
      expect(json).to.be.an("array").with.length(2);
      expect(json[0]).to.include({
        id: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
        username: "user1",
      });
      expect(json[0].oauthProviders).to.include("google");
      expect(json[1].oauthProviders).to.include("github");
    });
  
    it("should return 403 if current user is not admin", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.user.findUnique.resolves({ isAdmin: false });
  
      try {
        await userController.listAllUsers(normalReq, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(403);
        expect(err.message).to.equal("Permission denied");
      }
    });
  
    it("should return 401 if user not found", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.user.findUnique.resolves(null);
  
      try {
        await userController.listAllUsers(adminReq, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(401);
        expect(err.message).to.equal("User not found");
      }
    });
  });
});
