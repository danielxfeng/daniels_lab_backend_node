import { expect } from "chai";
import { extract_excerpt } from "../../src/utils/extract_excerpt";

describe("extract_excerpt", () => {
  it("should remove markdown and return full text if shorter than maxLength", () => {
    const md = "**Hello** _world_!";
    const result = extract_excerpt(md, 20);
    expect(result).to.equal("Hello world!");
  });

  it("should trim and append ellipsis if longer than maxLength", () => {
    const md = "# This is a long title with **markdown**";
    const result = extract_excerpt(md, 10);
    expect(result).to.equal("This is a ...");
  });

  it("should handle empty string", () => {
    const result = extract_excerpt("", 10);
    expect(result).to.equal("");
  });

  it("should handle markdown-only text", () => {
    const md = "### **_**_";
    const result = extract_excerpt(md, 10);
    expect(result).to.equal("__");
  });

  it("should not break on special characters", () => {
    const md = "`code` *italic* [link](url)";
    const result = extract_excerpt(md, 50);
    expect(result).to.equal("code italic link");
  });
});
