/**
 * @file post.test.ts
 * @description The test file for post controller.
 * For controller tests, the prisma is mocked,
 * and the where clause is checked to see if the query is correct,
 * while the response is checked to ensure the data mapping works correctly.
 */
import { expect } from "chai";
import sinon from "sinon";
import postController, { PostWithAuthorTag } from "../../src/controllers/controller_post";
import { stubPrisma } from "../mocks/prisma_mock";

describe("postController.getPostList", () => {
  it("should return posts list", async () => {
    const prismaStubs = stubPrisma();

    prismaStubs.post.findMany.resolves([
      {
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
      },
    ] as PostWithAuthorTag[]);

    prismaStubs.post.count.resolves(1);

    const req = { query: { offset: 0, limit: 10, tags: [] } } as any;
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    } as any;

    await postController.getPostList(req, res);

    expect(prismaStubs.post.findMany.calledWithMatch(sinon.match.has("where"))).to.be.true;
    const whereArg = prismaStubs.post.findMany.getCall(0).args[0].where;
    //expect(whereArg.PostTag.some.tag.name.in).to.deep.equal(["tag1"]);
    //expect(whereArg.createdAt.gte).to.exist;

    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.called).to.be.true;
    const json = res.json.firstCall.args[0];
    expect(json.total).to.equal(1);
    expect(json.posts).to.have.lengthOf(1);
  });
});
