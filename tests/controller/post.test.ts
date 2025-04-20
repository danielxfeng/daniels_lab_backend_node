/**
 * @file post.test.ts
 * @description The test file for post controller.
 * For controller tests, the prisma is mocked,
 * and the where clause is checked to see if the query is correct,
 * while the response is checked to ensure the data mapping works correctly.
 */
import { expect } from "chai";
import sinon from "sinon";
import postController, {
  PostWithAuthorTag,
} from "../../src/controllers/controller_post";
import { stubPrisma } from "../mocks/prisma_mock";
import * as slugUtil from "../../src/utils/generate_slug";

const res1 = {
  id: "db47f8ad-e342-4060-8a17-c7a44176e1c3",
  title: "Test",
  markdown: "Hello",
  authorId: "db47f8ad-e342-4060-8a17-c7a44176e1c3",
  slug: "test",
  excerpt: "Hello",
  createdAt: new Date(),
  updatedAt: new Date(),
  author: {
    id: "db47f8ad-e342-4060-8a17-c7a44176e1c3",
    username: "admin",
    avatarUrl: "https://uuuuuuuuuuu.png",
    deletedAt: null,
  },
  PostTag: [],
  createAtServer: new Date(),
  updatedAtServer: new Date(),
} as PostWithAuthorTag;

const res2 = {
  id: "db47f8ad-e342-4060-8a17-c7a44176e2d4",
  title: "Test",
  markdown: "Hello",
  slug: "test",
  excerpt: "Hello",
  authorId: "db47f8ad-e342-4060-8a17-c7a44176e1c3",
  createdAt: new Date(),
  updatedAt: new Date(),
  author: {
    id: "db47f8ad-e342-4060-8a17-c7a44176e1c3",
    username: "admin",
    avatarUrl: "https://uuuuuuuuuuu.png",
    deletedAt: new Date("2020-01-01T00:00:00Z"),
  },
  PostTag: [],
  createAtServer: new Date(),
  updatedAtServer: new Date(),
} as PostWithAuthorTag;

describe("postController.getPostList", () => {
  it("should return posts list", async () => {
    const prismaStubs = stubPrisma();

    prismaStubs.post.findMany.resolves([res1, res2]);

    prismaStubs.post.count.resolves(2);

    const req = { query: { offset: 0, limit: 10, tags: [] } } as any;
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    } as any;

    await postController.getPostList(req, res);

    expect(prismaStubs.post.findMany.calledWithMatch(sinon.match.has("where")))
      .to.be.true;
    const whereArg = prismaStubs.post.findMany.getCall(0).args[0].where;
    expect(whereArg).to.deep.equal({});

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.called).to.be.true;
    const json = res.json.firstCall.args[0];
    expect(json.total).to.equal(2);
    expect(json.limit).to.equal(10);
    expect(json.offset).to.equal(0);
    expect(json.posts).to.have.lengthOf(2);
  });

  it("returns empty list when no posts exist", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.post.findMany.resolves([]);
    prismaStubs.post.count.resolves(0);

    const req = { query: { offset: 0, limit: 10, tags: [] } } as any;
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    } as any;

    await postController.getPostList(req, res);

    const whereArg = prismaStubs.post.findMany.getCall(0).args[0].where;
    expect(whereArg).to.deep.equal({});
    expect(res.json.firstCall.args[0].posts).to.have.lengthOf(0);
    expect(res.json.firstCall.args[0].total).to.equal(0);
  });

  it("filters by a single tag", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.post.findMany.resolves([]);
    prismaStubs.post.count.resolves(0);

    const req = { query: { offset: 0, limit: 10, tags: ["tech"] } } as any;
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    } as any;

    await postController.getPostList(req, res);

    const whereArg = prismaStubs.post.findMany.getCall(0).args[0].where;
    expect(whereArg.PostTag.some.tag.name.in).to.deep.equal(["tech"]);
  });

  it("filters by multiple tags", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.post.findMany.resolves([]);
    prismaStubs.post.count.resolves(0);

    const req = {
      query: { offset: 0, limit: 10, tags: ["tech", "ai"] },
    } as any;
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    } as any;

    await postController.getPostList(req, res);

    const whereArg = prismaStubs.post.findMany.getCall(0).args[0].where;
    expect(whereArg.PostTag.some.tag.name.in).to.deep.equal(["tech", "ai"]);
  });

  it("filters by from and to date", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.post.findMany.resolves([]);
    prismaStubs.post.count.resolves(0);

    const req = {
      query: {
        offset: 0,
        limit: 10,
        tags: [],
        from: "2024-01-01T00:00:00.000Z",
        to: "2024-12-31T23:59:59.000Z",
      },
    } as any;
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    } as any;

    await postController.getPostList(req, res);

    const whereArg = prismaStubs.post.findMany.getCall(0).args[0].where;
    expect(whereArg.createdAt.gte).to.equal("2024-01-01T00:00:00.000Z");
    expect(whereArg.createdAt.lte).to.equal("2024-12-31T23:59:59.000Z");
  });

  it("filters by from date only", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.post.findMany.resolves([]);
    prismaStubs.post.count.resolves(0);

    const req = {
      query: {
        offset: 0,
        limit: 10,
        tags: [],
        from: "2024-01-01T00:00:00.000Z",
      },
    } as any;
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    } as any;

    await postController.getPostList(req, res);

    const whereArg = prismaStubs.post.findMany.getCall(0).args[0].where;
    expect(whereArg.createdAt.gte).to.equal("2024-01-01T00:00:00.000Z");
    expect(
      new Date().getTime() - new Date(whereArg.createdAt.lte).getTime()
    ).to.be.lessThan(5000);
  });

  it("filters by to date only", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.post.findMany.resolves([]);
    prismaStubs.post.count.resolves(0);

    const req = {
      query: {
        offset: 0,
        limit: 10,
        tags: [],
        to: "2024-12-31T23:59:59.000Z",
      },
    } as any;
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    } as any;

    await postController.getPostList(req, res);

    const whereArg = prismaStubs.post.findMany.getCall(0).args[0].where;
    expect(whereArg.createdAt.gte).to.equal(new Date(0).toISOString());
    expect(whereArg.createdAt.lte).to.equal("2024-12-31T23:59:59.000Z");
  });
});

describe("postController.getPostBySlug", () => {
  const req = { params: { slug: res1.slug } } as any;
  let res: any;

  beforeEach(() => {
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    } as any;
  });

  afterEach(() => sinon.restore());

  it("should return res1 with correct data", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.post.findUnique.resolves(res1);

    await postController.getPostBySlug(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    const json = res.json.firstCall.args[0];
    expect(json.id).to.equal(res1.id);
    expect(json.authorName).to.equal("admin");
    expect(json.authorAvatar).to.equal("https://uuuuuuuuuuu.png");
    expect(json.tags).to.deep.equal([]);
  });

  it("should return res2 with Deleted User info", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.post.findUnique.resolves(res2);

    await postController.getPostBySlug(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    const json = res.json.firstCall.args[0];
    expect(json.authorName).to.equal("DeletedUser");
    expect(json.authorAvatar).to.be.null;
  });

  it("should return 404 if post not found", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.post.findUnique.resolves(null);

    try {
      await postController.getPostBySlug(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(404);
      expect(err.message).to.equal("Post not found");
    }
  });

  describe("postController.updatePost", () => {
    it("should update the post and return 200", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.post.updateMany.resolves({ count: 1 });
      prismaStubs.post.findUnique.resolves({
        authorId: "db47f8ad-e342-4060-8a17-c7a44176e2d4",
      });
    
      const req = {
        params: { postId: "db47f8ad-e342-4060-8a17-c7a44176e2d4" },
        body: {
          title: "Updated Title",
          markdown: "Updated Markdown",
          tags: ["tag1"],
        },
        user: { id: "db47f8ad-e342-4060-8a17-c7a44176e2d4" },
      } as any;
    
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis(),
      } as any;
    
      await postController.updatePost(req, res);
    
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWithMatch({ message: "Post updated" })).to.be.true;
    });

    it("should return 404 if post not found", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.post.updateMany.resolves({ count: 0 });
    
      const req = {
        params: { postId: "not-found" },
        body: {
          title: "Title",
          markdown: "Markdown",
          tags: ["tag1"],
        },
        user: { id: "db47f8ad-e342-4060-8a17-c7a44176e2d4" },
      } as any;
    
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis(),
      } as any;
    
      try {
        await postController.updatePost(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(404);
        expect(err.message).to.equal("Post not found");
      }
    });

    it("should return 403 if user is not the author", async () => {
      const prismaStubs = stubPrisma();
    
      prismaStubs.post.findUnique.resolves({
        authorId: "author1",
      });
    
      const req = {
        params: { postId: "post1" },
        body: {
          title: "Try to update",
          markdown: "Not allowed",
          tags: [],
        },
        user: { id: "author2" },
      } as any;
    
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis(),
      } as any;
    
      try {
        await postController.updatePost(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(403);
        expect(err.message).to.equal("Not authorized");
      }
    });
    
  });

  describe("postController.deletePost", () => {
    const req = { params: { postId: "db47f8ad-e342-4060-8a17-c7a44176e2d4" } } as any;
    let res: any;
  
    beforeEach(() => {
      res = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub().returnsThis(),
      } as any;
    });
  
    afterEach(() => {
      sinon.restore();
    });
  
    it("should delete the post and return 204", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.post.deleteMany.resolves({ count: 1 });
  
      await postController.deletePost(req, res);
  
      expect(res.status.calledWith(204)).to.be.true;
      expect(res.send.calledOnce).to.be.true;
  
      const whereArg = prismaStubs.post.deleteMany.getCall(0).args[0].where;
      expect(whereArg).to.deep.equal({ id: "db47f8ad-e342-4060-8a17-c7a44176e2d4" });
    });
  
    it("should return 404 if post not found", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.post.deleteMany.resolves({ count: 0 });
  
      try {
        await postController.deletePost(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.status).to.equal(404);
        expect(err.message).to.equal("Post not found");
      }
    });
  });

  describe("postController.createPost", () => {
    let res: any;
    let req: any;
    let prismaStub: any;
  
    beforeEach(() => {
      res = {
        setHeader: sinon.stub().returnsThis(),
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis(),
      };
  
      req = {
        body: {
          title: "My Title",
          markdown: "Some content",
          tags: ["tag1"],
        },
        user: {
          id: "user-123",
        },
      };
  
      sinon.stub(slugUtil, "generateSlug").callsFake((base: string, retry?: boolean) => {
        return base.toLowerCase().replace(/\s+/g, "-");
      });
    });
  
    afterEach(() => {
      sinon.restore();
    });
  
    it("should create post successfully", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.post.create.resolves({ id: "post-123" });
  
      await postController.createPost(req, res);
  
      expect(prismaStubs.post.create.calledOnce).to.be.true;
      expect(res.setHeader.calledWith("Location", "/posts/my-title")).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWithMatch({ message: "Post created" })).to.be.true;
    });
  
    it("should retry slug on unique constraint error and succeed", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.post.create
        .onCall(0).rejects({ code: "P2002", meta: { target: ["slug"] } })
        .onCall(1).rejects({ code: "P2002", meta: { target: ["slug"] } })
        .onCall(2).resolves({ id: "post-456" });
  
      await postController.createPost(req, res);
  
      expect(prismaStubs.post.create.callCount).to.equal(3);
    });
  
    it("should throw 500 after 3 slug conflicts", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.post.create.rejects({ code: "P2002", meta: { target: ["slug"] } });
  
      try {
        await postController.createPost(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.message).to.equal("Post not created");
      }
  
      expect(prismaStubs.post.create.callCount).to.equal(3);
    });
  
    it("should throw on non-slug-related error", async () => {
      const prismaStubs = stubPrisma();
      prismaStubs.post.create.rejects({ code: "SOME_OTHER_ERROR" });
  
      try {
        await postController.createPost(req, res);
        throw new Error("Should not reach here");
      } catch (err: any) {
        expect(err.code).to.equal("SOME_OTHER_ERROR");
      }
  
      expect(prismaStubs.post.create.callCount).to.equal(1);
    });
  });
});
