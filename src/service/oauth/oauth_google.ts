/**
 * @file oauth_google.ts
 * @description This file contains a module to handle the google oauth.
 */

import { jwtVerify, createRemoteJWKSet } from "jose";
import { OauthUserInfoSchema, OauthUserInfo } from "../../schema/schema_auth";
import { OauthProviderService } from "./oauth";

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

    if (!clientId || !redirectUri) {
      throw new Error("Google client ID or callback URL is not set");
    }

    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: ["openid"].join(" "),
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
      throw new Error("GitHub OAuth config not set");

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
    if (!response.ok) throw new Error("Failed to get token from Google");

    // Parse the response
    const { id_token: idToken } = await response.json();
    if (!idToken) throw new Error("No id_token in the response");

    // Verify the token with the Google public key
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: "https://accounts.google.com",
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // Parse the payload
    const parsed = OauthUserInfoSchema.safeParse({
      provider: "google",
      id: payload.sub,
      avatar: payload.picture,
    });
    if (!parsed.success) throw new Error("Failed to parse Google user info");

    return parsed.data;
  },
};

export default googleOauth;
