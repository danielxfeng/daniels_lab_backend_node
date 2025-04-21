/**
 * @file comment.test.ts
 * @description The test file for comment controller.
 * For controller tests, the prisma is mocked,
 * and the where clause is checked to see if the query is correct,
 * while the response is checked to ensure the data mapping works correctly.
 */
import { expect } from "chai";
import sinon from "sinon";
import commentController, {
  CommentWithAuthor,
} from "../../src/controllers/controller_comment";
import { stubPrisma } from "../mocks/prisma_mock";

const res1: CommentWithAuthor = {
  id: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
  postId: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
  authorId: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
  content: "This is a comment",
  createdAt: new Date(),
  updatedAt: new Date(),
  author: {
    id: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
    username: "John",
    avatarUrl: "https://uuuuuuuuuuu.png",
    deletedAt: null,
  },
};

const res2: CommentWithAuthor = {
  id: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
  postId: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
  authorId: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
  content: "Deleted author comment",
  createdAt: new Date(),
  updatedAt: new Date(),
  author: {
    id: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
    username: "John",
    avatarUrl: "https://uuuuuuuuuuu.png",
    deletedAt: new Date("2020-01-01T00:00:00Z"),
  },
};

describe("commentController.getCommentList", () => {
  it("should return comments list", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.comment.findMany.resolves([res1]);
    prismaStubs.comment.count.resolves(1);

    const req = { query: { offset: 0, limit: 10, postId: "post1" } } as any;
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    } as any;

    await commentController.getComments(req as any, res as any);

    expect(res.status.calledWith(200)).to.be.true;
    const json = res.json.firstCall.args[0];
    expect(json.total).to.equal(1);
    expect(json.comments).to.have.lengthOf(1);
    expect(json.comments[0].authorName).to.equal("John");
  });

  describe("commentController.getCommentById", () => {
    const req = { params: { commentId: res1.id } } as any;
    let res: any;

    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis(),
      };
    });

    afterEach(() => sinon.restore());

    it("should return res1 with correct data", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.comment.findUnique.resolves(res1);

      await commentController.getCommentById(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const json = res.json.firstCall.args[0];
      expect(json.id).to.equal(res1.id);
      expect(json.authorName).to.equal("John");
      expect(json.authorAvatar).to.equal("https://uuuuuuuuuuu.png");
    });

    it("should return res2 with Deleted User info", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.comment.findUnique.resolves(res2);

      await commentController.getCommentById(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const json = res.json.firstCall.args[0];
      expect(json.authorName).to.equal("DeletedUser");
      expect(json.authorAvatar).to.be.null;
    });

    it("should return 404 if comment not found", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.comment.findUnique.resolves(null);

      try {
        await commentController.getCommentById(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(404);
        expect(err.message).to.equal("Comment not found");
      }
    });
  });

  describe("commentController.getCommentById", () => {
    const req = { params: { commentId: res1.id } } as any;
    let res: any;

    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis(),
      };
    });

    afterEach(() => sinon.restore());

    it("should return res1 with correct data", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.comment.findUnique.resolves(res1);

      await commentController.getCommentById(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const json = res.json.firstCall.args[0];
      expect(json.id).to.equal(res1.id);
      expect(json.authorName).to.equal("John");
      expect(json.authorAvatar).to.equal("https://uuuuuuuuuuu.png");
    });

    it("should return res2 with Deleted User info", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.comment.findUnique.resolves(res2);

      await commentController.getCommentById(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const json = res.json.firstCall.args[0];
      expect(json.authorName).to.equal("DeletedUser");
      expect(json.authorAvatar).to.be.null;
    });

    it("should return 404 if comment not found", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.comment.findUnique.resolves(null);

      try {
        await commentController.getCommentById(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(404);
        expect(err.message).to.equal("Comment not found");
      }
    });
  });

  describe("commentController.createComment", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
      req = {
        query: { postId: "0898bceb-6a62-47da-a32e-0ba02b09bb61" },
        body: { content: "This is a comment" },
        user: { id: "0898bceb-6a62-47da-a32e-0ba02b09bb61" },
      };

      res = {
        set: sinon.stub().returnsThis(),
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis(),
      };
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should create comment successfully", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.comment.create.resolves({
        id: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
      });

      await commentController.createComment(req, res);

      expect(prismaStubs.comment.create.calledOnce).to.be.true;
      expect(
        res.set.calledWith(
          "Location",
          "/comments/0898bceb-6a62-47da-a32e-0ba02b09bb61"
        )
      ).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWithMatch({ message: "Comment created" })).to.be
        .true;
    });

    it("should throw 500 if comment creation fails", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.comment.create.resolves(null);

      try {
        await commentController.createComment(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(500);
        expect(err.message).to.equal("Failed to create comment");
      }
    });

    it("should propagate prisma error if thrown", async () => {
      const prismaStubs = stubPrisma();
      const error = new Error("DB failure");
      prismaStubs.comment.create.rejects(error);

      try {
        await commentController.createComment(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.message).to.equal("DB failure");
      }

      expect(prismaStubs.comment.create.callCount).to.equal(1);
    });
  });

  describe("commentController.updateComment", () => {
    let req: any;
    let res: any;
  
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis(),
      };
  
      req = {
        params: { commentId: "0898bceb-6a62-47da-a32e-0ba02b09bb61" },
        body: { content: "Updated content" },
        user: { id: "0898bceb-6a62-47da-a32e-0ba02b09bb61" },
      };
    });
  
    afterEach(() => sinon.restore());
  
    it("should update the comment and return 200", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.comment.findUnique.resolves({
        id: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
        postId: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
        authorId: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
      });
      prismaStubs.comment.update.resolves({
        id: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
        content: "Updated content",
        author: {
          id: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
          username: "admin",
          avatarUrl: "https://some.png",
          deletedAt: null,
        },
        postId: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
        authorId: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
  
      await commentController.updateComment(req, res);
  
      expect(prismaStubs.comment.update.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
    });
  
    it("should return 404 if comment not found", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.comment.findUnique.resolves(null);
  
      try {
        await commentController.updateComment(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(404);
        expect(err.message).to.equal("Comment not found");
      }
    });
  
    it("should return 403 if user is not the author", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.comment.findUnique.resolves({
        id: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
        postId: "0898bceb-6a62-47da-a32e-0ba02b09bb61",
        authorId: "0898bceb-6a62-47da-a32e-0ba02b09bb62",
      });
  
      try {
        await commentController.updateComment(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(403);
        expect(err.message).to.equal("Forbidden");
      }
    });
  });

  describe("commentController.deleteComment", () => {
    let req: any;
    let res: any;
  
    beforeEach(() => {
      req = {
        params: { commentId: "0898bceb-6a62-47da-a32e-0ba02b09bb61" },
      };
  
      res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub().returnsThis(),
      };
    });
  
    afterEach(() => {
      sinon.restore();
    });
  
    it("should delete comment successfully", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.comment.deleteMany.resolves({ count: 1 });
  
      await commentController.deleteComment(req, res);
  
      expect(prismaStubs.comment.deleteMany.calledOnce).to.be.true;
      expect(prismaStubs.comment.deleteMany.firstCall.args[0]).to.deep.equal({
        where: { id: "0898bceb-6a62-47da-a32e-0ba02b09bb61" },
      });
  
      expect(res.status.calledWith(204)).to.be.true;
      expect(res.send.calledOnce).to.be.true;
    });
  
    it("should return 404 if comment not found", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.comment.deleteMany.resolves({ count: 0 });
  
      try {
        await commentController.deleteComment(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(404);
        expect(err.message).to.equal("Comment not found");
      }
    });
  });
});
