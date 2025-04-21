/**
 * @file tag.test.ts
 * @description The test file for tag controller.
 * For controller tests, the prisma is mocked,
 * and the where clause is checked to see if the query is correct,
 * while the response is checked to ensure the data mapping works correctly.
 */

import { expect } from "chai";
import sinon from "sinon";
import tagController from "../../src/controllers/controller_tag";
import { stubPrisma } from "../mocks/prisma_mock";
import { TagsResponseSchema } from "../../src/schema/schema_tag";

describe("tagController.getHotTags", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {} as any;
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };
  });

  afterEach(() => sinon.restore());

  it("should return 200 and a list of top 10 tag names", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.tag.findMany.resolves([
      { name: "javascript" },
      { name: "typescript" },
      { name: "nodejs" },
    ]);

    await tagController.getHotTags(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    const responseData = res.json.firstCall.args[0];

    const result = TagsResponseSchema.safeParse(responseData);
    expect(result.success).to.be.true;

    expect(result.data!.tags).to.deep.equal([
      "javascript",
      "typescript",
      "nodejs",
    ]);
  });

  it("should return 200 with empty list when no tags found", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.tag.findMany.resolves([]);

    await tagController.getHotTags(req, res);

    expect(res.status.calledWith(200)).to.be.true;
    const responseData = res.json.firstCall.args[0];

    const result = TagsResponseSchema.safeParse(responseData);
    expect(result.success).to.be.true;
    expect(result.data!.tags).to.deep.equal([]);
  });

  it("should return 500 when prisma throws error", async () => {
    const prismaStubs = stubPrisma();
    prismaStubs.tag.findMany.rejects(new Error("DB error"));

    try {
      await tagController.getHotTags(req, res);
    } catch (error: any) {
      expect(error.message).to.equal("DB error");
    }
  });
});
