import { describe } from "mocha";
import { expect } from "chai";
import {
  TagQuerySchema,
  TagsResponseSchema,
} from "../../src/schema/schema_tag";

describe("TagQuerySchema", () => {
  it("should parse a valid tag and transform to lowercase", () => {
    const result = TagQuerySchema.parse({ tag: "React_JS", ts: 1716917355000 });
    expect(result.tag).to.equal("react_js");
  });

  it("should fail if tag is invalid (has spaces)", () => {
    expect(() => TagQuerySchema.parse({ tag: "invalid tag", ts: 1 })).to.throw();
  });

  it("should fail if tag is too long", () => {
    const longTag = "a".repeat(21);
    expect(() => TagQuerySchema.parse({ tag: longTag, ts: 1 })).to.throw();
  });

  it("should trim and transform", () => {
    const result = TagQuerySchema.parse({ tag: "  ReAct  ", ts: 1 });
    expect(result.tag).to.equal("react");
  });
});

describe("TagsResponseSchema", () => {
  it("should accept an array of valid tags", () => {
    const result = TagsResponseSchema.parse({ tags: ["React", "Node_JS"], ts: 1 });
    expect(result.tags).to.deep.equal(["react", "node_js"]);
  });

  it("should fail if one tag is invalid", () => {
    expect(() =>
      TagsResponseSchema.parse({ tags: ["React", "bad tag"], ts: 1 })
    ).to.throw();
  });
});
