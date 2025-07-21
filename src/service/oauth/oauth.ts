/**
 * @file oauth.ts
 * @description This file contains the function to handle the oauth.
 */

import { OauthProvider } from "../../schema/schema_components";
import { OauthUserInfo } from "../../schema/schema_auth";
import googleOauth from "./oauth_google";
import githubOauth from "./oauth_github";
import linkedinOauth from "./oauth_linkedin";

/**
 * @summary OauthProviderService
 * @description This interface defines the methods for handling OAuth providers.
 */
interface OauthProviderService {
  /**
   * @summary To get the OAuth URL from the provider.
   * @param state the state parameter to be passed to the provider,
   * state is needed to get consentAt, deviceId, userId?, also for CSRF protection
   * @returns the OAuth URL
   * @throws Error if the client ID or callback URL is not set
   */
  getOauthUrl: (state: string) => string;
  /**
   * @summary Parse the OAuth callback
   * @param code the code from the OAuth callback
   * @returns The parsed user info
   */
  parseCallback: (code: string) => Promise<OauthUserInfo>;
}

/**
 * @summary OauthServiceMap
 */
const OauthServiceMap: Record<OauthProvider, OauthProviderService> = {
  google: googleOauth,
  github: githubOauth,
  linkedin: linkedinOauth,
};

export { OauthServiceMap, OauthProviderService };
