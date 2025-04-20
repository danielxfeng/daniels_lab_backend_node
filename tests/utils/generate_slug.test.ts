import { expect } from "chai";
import { generateSlug } from "../../src/utils/generate_slug";

describe("generateSlug", () => {
  it("should generate a normal slug", () => {
    const result = generateSlug("Hello World");
    expect(result).to.equal("hello-world");
  });

  it("should strip special characters", () => {
    const result = generateSlug("Hello! @World# $%");
    // The `limax` replaces special chars with some other chars
    expect(result).to.equal("hello-world-usd");
  });

  it("should trim long slugs to 50 characters", () => {
    const longTitle =
      "This is a very long title that should be cut off after fifty characters!";
    const result = generateSlug(longTitle);
    expect(result.length).to.be.at.most(50);
  });

  it("should append id if slug is too short", () => {
    const shortTitle = "Hi";
    const result = generateSlug(shortTitle);
    expect(result).to.match(/^hi-\d{4}$/);
  });

  it("should return random slug if re is true", () => {
    const result = generateSlug("anything", true);
    expect(result).to.match(/^title-\d{4}$/);
  });
});
