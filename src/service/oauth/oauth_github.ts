/**
 * @file oauth_github.ts
 * @description This file contains a module to handle the GitHub OAuth.
 */

import { OauthUserInfoSchema, OauthUserInfo } from "../../schema/schema_auth";
import { OauthProviderService } from "./oauth";

const githubOauth: OauthProviderService = {
  /**
   * @summary Get GitHub OAuth URL
   */
  getOauthUrl(state: string): string {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_CALLBACK_URL;

    if (!clientId || !redirectUri) {
      throw new Error("GitHub client ID or callback URL is not set");
    }

    const rootUrl = "https://github.com/login/oauth/authorize";
    const options = {
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    };

    const qs = new URLSearchParams(options).toString();
    return `${rootUrl}?${qs}`;
  },

  /**
   * @summary Parse the GitHub OAuth callback
   * @description The process is:
   * 1. Send a request to the URL to get the token.
   * 2. Send a request to GitHub API to get the user profile.
   * 3. Parse the user profile.
   * @param code The code from GitHub callback
   * @returns The parsed user info
   */
  async parseCallback(code: string): Promise<OauthUserInfo> {
    if (
      !process.env.GITHUB_CLIENT_ID ||
      !process.env.GITHUB_CLIENT_SECRET ||
      !process.env.GITHUB_CALLBACK_URL
    ) {
      throw new Error("GitHub OAuth config not set");
    }

    // Send a request to the URL to get the token.
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: process.env.GITHUB_CALLBACK_URL,
        }),
      }
    );
    if (!tokenResponse.ok) throw new Error("Failed to get GitHub access token");
    const { access_token: accessToken } = await tokenResponse.json();
    if (!accessToken) throw new Error("GitHub access token not received");

    // Send a request to GitHub API to get the user profile.
    const profileRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) throw new Error("GitHub user profile not received");

    // Parse the user profile.
    const profile = await profileRes.json();
    if (!profile || !profile.id)
      throw new Error("GitHub user profile not valid");
    const parsed = OauthUserInfoSchema.safeParse({
      provider: "github",
      id: profile.id.toString(),
      avatar: profile.avatar_url,
    });
    if (!parsed.success) throw new Error("Failed to parse GitHub user info");

    return parsed.data;
  },
};

export default githubOauth;
