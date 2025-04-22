/**
 * @file This file contains utility functions for crypto operations.
 */

import crypto from "crypto";
import bcrypt from "bcrypt";

/**
 * @summary A helper function to hash a token.
 *
 * @param token The token to be hashed.
 * @returns The hashed token.
 */
const hashedToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Generate a random ID with a prefix and length.
 * @param prefix the prefix for the ID
 * @param length the length of the random part of the ID
 * @returns the random ID
 * @example randomId("user-", 9) // "user-abc123xyz"
 */
const randomId = (prefix: string = "", length: number = 10): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = prefix;
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
};

/**
 * @summary Hash a password using bcrypt with salt.
 * @param password The plain text password
 * @returns The hashed password string
 */
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * @summary Verify a bcrypt password.
 * @param password The plain text password to verify
 * @param hashed The bcrypt hashed password
 * @returns true if match, false otherwise
 */
const verifyPassword = async (
  password: string,
  bcryptPwd: string
): Promise<boolean> => {
  return await bcrypt.compare(password, bcryptPwd);
};

export { hashedToken, randomId, hashPassword, verifyPassword };
