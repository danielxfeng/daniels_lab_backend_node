/**
 * @file oauth_github.ts
 * @description This file contains a module to handle the GitHub OAuth.
 */

import { OauthUserInfoSchema, OauthUserInfo } from "../../schema/schema_auth";
import { terminateWithErr } from "../../utils/terminate_with_err";
import { OauthProviderService } from "./oauth";

const githubOauth: OauthProviderService = {
  /**
   * @summary Get GitHub OAuth URL
   */
  getOauthUrl(state: string): string {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_CALLBACK_URL;

    if (!clientId || !redirectUri)
      return terminateWithErr(500, "GitHub OAuth config not set");

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
    )
      return terminateWithErr(500, "GitHub OAuth config not set");

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
    if (!tokenResponse.ok)
      return terminateWithErr(502, "GitHub token not received");
    const { access_token: accessToken } = await tokenResponse.json();
    if (!accessToken) return terminateWithErr(502, "GitHub token not received");

    // Send a request to GitHub API to get the user profile.
    const profileRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok)
      return terminateWithErr(502, "GitHub profile not received");

    // Parse the user profile.
    const profile = await profileRes.json();
    if (!profile || !profile.id)
      return terminateWithErr(502, "GitHub profile not received");
    const parsed = OauthUserInfoSchema.safeParse({
      provider: "github",
      id: profile.id.toString(),
      avatar: profile.avatar_url || undefined,
    });
    if (!parsed.success)
      return terminateWithErr(500, "GitHub profile not received");

    return parsed.data;
  },
};

export default githubOauth;
