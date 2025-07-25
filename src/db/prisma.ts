/**
 * @summary prisma.ts
 * @description Singleton instance of PrismaClient.
 */

import { PrismaClient } from "@prisma/client";

// do this for avoid multiple instances caused by Hot Module Reloading (HMR).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * @description A singleton instance of PrismaClient.
 */
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
