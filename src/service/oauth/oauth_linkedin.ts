/**
 * @file oauth_linkedin.ts
 */

import { OauthUserInfoSchema, OauthUserInfo } from "../../schema/schema_auth";
import { terminateWithErr } from "../../utils/terminate_with_err";
import { OauthProviderService } from "./oauth";

const linkedinOauth: OauthProviderService = {
  getOauthUrl(state: string): string {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_CALLBACK_URL;

    if (!clientId || !redirectUri)
      return terminateWithErr(500, "LinkedIn OAuth config not set");

    const rootUrl = "https://www.linkedin.com/oauth/v2/authorization";
    const options = {
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope: ["openid", "profile"].join(" "),
    };

    const qs = new URLSearchParams(options).toString();
    return `${rootUrl}?${qs}`;
  },

  /**
   * @summary Parse the LinkedIn OAuth callback
   */
  async parseCallback(code: string): Promise<OauthUserInfo> {
    if (
      !process.env.LINKEDIN_CLIENT_ID ||
      !process.env.LINKEDIN_CLIENT_SECRET ||
      !process.env.LINKEDIN_CALLBACK_URL
    )
      return terminateWithErr(500, "LinkedIn OAuth config not set");

    const tokenResponse = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        }).toString(),
      }
    );
    if (!tokenResponse.ok)
      return terminateWithErr(502, "Failed to get LinkedIn access token");
    const { access_token: accessToken } = await tokenResponse.json();
    if (!accessToken)
      return terminateWithErr(502, "LinkedIn token not received");

    const profileRes = await fetch(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!profileRes.ok)
      return terminateWithErr(502, "LinkedIn profile not received");

    // Parse the user profile.
    const profile = await profileRes.json();
    const parsed = OauthUserInfoSchema.safeParse({
      provider: "linkedin",
      id: profile.sub,
      avatar: profile.picture || undefined,
    });
    if (!parsed.success)
      return terminateWithErr(500, "LinkedIn profile not received");

    return parsed.data;
  },
};

export default linkedinOauth;
