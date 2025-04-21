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
});
