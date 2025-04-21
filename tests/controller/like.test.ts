/**
 * @file like.test.ts
 * @description The test file for like controller.
 * For controller tests, the prisma is mocked,
 * and the where clause is checked to see if the query is correct,
 * while the response is checked to ensure the data mapping works correctly.
 */

import { expect } from "chai";
import sinon from "sinon";
import likeController from "../../src/controllers/controller_like";
import { stubPrisma } from "../mocks/prisma_mock";

describe("likeController.getLikeStatus", () => {
  const postId = "0898bceb-6a62-47da-a32e-0ba02b09bb61";
  const userId = "0898bceb-6a62-47da-a32e-0ba02b09bb61";
  const reqWithUser = { params: { postId }, user: { id: userId } } as any;
  const reqNoUser = { params: { postId }, user: undefined } as any;
  let res: any;

  beforeEach(() => {
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
  });

  afterEach(() => sinon.restore());

  it("should return count and liked: true when user liked the post", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.like.count.resolves(5);
    prismaStubs.like.findFirst.resolves({
      id: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
    });

    await likeController.getLikeStatus(reqWithUser, res);

    expect(res.status.calledWith(200)).to.be.true;
    const json = res.json.firstCall.args[0];
    expect(json.count).to.equal(5);
    expect(json.liked).to.be.true;
  });

  it("should return count and liked: false when user did not like the post", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.like.count.resolves(3);
    prismaStubs.like.findFirst.resolves(null);

    await likeController.getLikeStatus(reqWithUser, res);

    expect(res.status.calledWith(200)).to.be.true;
    const json = res.json.firstCall.args[0];
    expect(json.count).to.equal(3);
    expect(json.liked).to.be.false;
  });

  it("should return count and liked: false when user is not logged in", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.like.count.resolves(10);

    await likeController.getLikeStatus(reqNoUser, res);

    expect(res.status.calledWith(200)).to.be.true;
    const json = res.json.firstCall.args[0];
    expect(json.count).to.equal(10);
    expect(json.liked).to.be.false;
  });

  describe("likeController.likePost", () => {
    const postId = "post-123";
    const userId = "user-abc";
    const req = {
      query: { postId },
      user: { id: userId },
    } as any;
    let res: any;

    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub().returnsThis(),
      };
    });

    afterEach(() => sinon.restore());

    it("should return 204 when like is created successfully", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.post.findUnique.resolves({ id: postId });
      prismaStubs.like.create.resolves({ id: "like-xyz", postId, userId });

      await likeController.likePost(req, res);

      expect(res.status.calledWith(204)).to.be.true;
      expect(res.send.calledOnce).to.be.true;
    });

    it("should return 404 when postId is invalid", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.post.findUnique.resolves(null);

      try {
        await likeController.likePost(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(404);
        expect(err.message).to.equal("Post not found.");
      }
    });

    it("should throw Prisma P2002 error when like already exists", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.post.findUnique.resolves({ id: postId });
      prismaStubs.like.create.rejects({
        code: "P2002",
        message: "Unique constraint failed on the fields: (`postId`,`userId`)",
      });

      try {
        await likeController.likePost(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.code).to.equal("P2002");
        expect(err.message).to.include("Unique constraint");
      }
    });

    it("should rethrow unknown errors", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.post.findUnique.resolves({ id: postId });
      const error = new Error("Unexpected error");
      prismaStubs.like.create.rejects(error);

      try {
        await likeController.likePost(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err).to.equal(error);
      }
    });
  });

  describe("likeController.unlikePost", () => {
    const postId = "post-123";
    const userId = "user-abc";
    const req = {
      query: { postId },
      user: { id: userId },
    } as any;
    let res: any;

    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub().returnsThis(),
      };
    });

    afterEach(() => sinon.restore());

    it("should return 204 when like is successfully deleted", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.post.findUnique.resolves({ id: postId });
      prismaStubs.like.deleteMany.resolves({ count: 1 });

      await likeController.unlikePost(req, res);

      expect(res.status.calledWith(204)).to.be.true;
      expect(res.send.calledOnce).to.be.true;
    });

    it("should return 204 when like did not exist (still successful)", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.post.findUnique.resolves({ id: postId });
      prismaStubs.like.deleteMany.resolves({ count: 0 });

      await likeController.unlikePost(req, res);

      expect(res.status.calledWith(204)).to.be.true;
      expect(res.send.calledOnce).to.be.true;
    });

    it("should return 404 when post does not exist", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.post.findUnique.resolves(null);

      try {
        await likeController.unlikePost(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(404);
        expect(err.message).to.equal("Post not found.");
      }
    });
  });
});
