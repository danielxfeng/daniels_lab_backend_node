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

const res1 = {
  id: "db47f8ad-e342-4060-8a17-c7a44176e1c3",
  title: "Test",
  markdown: "Hello",
  authorId: "db47f8ad-e342-4060-8a17-c7a44176e1c3",
  createdAt: new Date(),
  updatedAt: new Date(),
  author: {
    id: "db47f8ad-e342-4060-8a17-c7a44176e1c3",
    username: "admin",
    avatarUrl: "https://uuuuuuuuuuu.png",
    deletedAt: null,
  },
  PostTag: [],
} as PostWithAuthorTag;

const res2 = {
  id: "db47f8ad-e342-4060-8a17-c7a44176e2d4",
  title: "Test",
  markdown: "Hello",
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
    expect((new Date().getTime()) - (new Date(whereArg.createdAt.lte)).getTime()).to.be.lessThan(5000);
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

describe("postController.getPostById", () => {
  const req = { params: { postId: res1.id } } as any;
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

    await postController.getPostById(req, res);

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

    await postController.getPostById(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    const json = res.json.firstCall.args[0];
    expect(json.authorName).to.equal("DeletedUser");
    expect(json.authorAvatar).to.be.null;
  });

  it("should return 404 if post not found", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.post.findUnique.resolves(null);

    try {
      await postController.getPostById(req, res);
      throw new Error("Should not reach here");
    } catch (err: any) {
      expect(err.status).to.equal(404);
      expect(err.message).to.equal("Post not found");
    }
  });
});
