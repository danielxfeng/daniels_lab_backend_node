/*
  Warnings:

  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `deviceId` to the `RefreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "RefreshToken_userId_idx";

-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "deviceId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Session";

-- CreateIndex
CREATE INDEX "RefreshToken_userId_deviceId_idx" ON "RefreshToken"("userId", "deviceId");
