/**
 * @file This file contains utility functions for crypto operations.
 */

import crypto from "crypto";
import bcrypt from "bcrypt";

const hashedToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const randomId = (prefix: string = "", length: number = 10): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = prefix;
  const array = new Uint32Array(length);
  crypto.randomFillSync(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
};

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (
  password: string,
  bcryptPwd: string
): Promise<boolean> => {
  return await bcrypt.compare(password, bcryptPwd);
};

export { hashedToken, randomId, hashPassword, verifyPassword };
