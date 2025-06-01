/**
 * @file oauth_google.ts
 * @description This file contains a module to handle the google oauth.
 */

import { jwtVerify, createRemoteJWKSet } from "jose";
import { OauthUserInfoSchema, OauthUserInfo } from "../../schema/schema_auth";
import { OauthProviderService } from "./oauth";
import { terminateWithErr } from "../../utils/terminate_with_err";

/**
 * @summary Verify the JWT token from Google
 */
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

const googleOauth: OauthProviderService = {
  /**
   * @summary Get Google OAuth URL
   */
  getOauthUrl(state: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;

    if (!clientId || !redirectUri)
      return terminateWithErr(500, "Google OAuth config not set");

    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: ["openid", "profile"].join(" "),
      state,
    };
    const qs = new URLSearchParams(options).toString();
    return `${rootUrl}?${qs}`;
  },

  /**
   * @summary Parse the Google OAuth callback
   * @description The process is:
   * 1. Assemble the URL to Google.
   * 2. Send a request to the URL to get the token.
   * 3. Verify the token with the Google public key.
   * @param code The code from the Google OAuth callback
   * @returns The parsed user info
   */
  async parseCallback(code: string): Promise<OauthUserInfo> {
    // Check the params
    if (
      !process.env.GOOGLE_CALLBACK_URL ||
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET
    )
      return terminateWithErr(500, "Google OAuth config not set");

    // Assemble the URL to Google
    const url = "https://oauth2.googleapis.com/token";
    const params = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
      grant_type: "authorization_code",
    });

    // Send a request to the URL to get the token
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!response.ok) return terminateWithErr(502, "Google token not received");

    // Parse the response
    const { id_token: idToken } = await response.json();
    if (!idToken) return terminateWithErr(502, "Google token not received");

    // Verify the token with the Google public key
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: "https://accounts.google.com",
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // Parse the payload
    const parsed = OauthUserInfoSchema.safeParse({
      provider: "google",
      id: payload.sub,
      avatar: payload.picture || undefined,
    });
    if (!parsed.success)
      return terminateWithErr(500, "Google token not received");

    return parsed.data;
  },
};

export default googleOauth;
