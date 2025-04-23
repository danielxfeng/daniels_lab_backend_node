import { expect } from "chai";
import sinon from "sinon";
import { jwtVerify } from "jose";
import { OauthServiceMap } from "../../src/service/oauth/oauth";
import { OauthProvider } from "../../src/schema/schema_components";

describe("OauthServiceMap", () => {
  const state = "test-state";

  it("should generate correct OAuth URLs for all providers", () => {
    const GOOGLE_CLIENT_ID = "test-google-id";
    const GOOGLE_CALLBACK_URL = "https://example.com/google/callback";
    const GITHUB_CLIENT_ID = "test-github-id";
    const GITHUB_CALLBACK_URL = "https://example.com/github/callback";
    const LINKEDIN_CLIENT_ID = "test-linkedin-id";
    const LINKEDIN_CALLBACK_URL = "https://example.com/linkedin/callback";

    // Mock env
    process.env.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CALLBACK_URL = GOOGLE_CALLBACK_URL;
    process.env.GITHUB_CLIENT_ID = GITHUB_CLIENT_ID;
    process.env.GITHUB_CALLBACK_URL = GITHUB_CALLBACK_URL;
    process.env.LINKEDIN_CLIENT_ID = LINKEDIN_CLIENT_ID;
    process.env.LINKEDIN_CALLBACK_URL = LINKEDIN_CALLBACK_URL;

    const expectedUrls: Record<OauthProvider, string> = {
      google: `https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=${encodeURIComponent(
        GOOGLE_CALLBACK_URL
      )}&client_id=${GOOGLE_CLIENT_ID}&access_type=offline&response_type=code&prompt=consent&scope=openid&state=${state}`,

      github: `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        GITHUB_CALLBACK_URL
      )}&state=${state}`,

      linkedin: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        LINKEDIN_CALLBACK_URL
      )}&state=${state}&scope=r_liteprofile`,
    };

    for (const provider of Object.keys(expectedUrls) as OauthProvider[]) {
      const url = OauthServiceMap[provider].getOauthUrl(state);
      expect(url).to.equal(expectedUrls[provider]);
    }
  });
});
