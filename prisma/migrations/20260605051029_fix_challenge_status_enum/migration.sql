/*
  Warnings:

  - You are about to drop the column `challengeStatus` on the `UserChallenges` table. All the data in the column will be lost.
  - The `status` column on the `UserChallenges` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum: add ASSIGNED value (must be committed before it can be used as a column type/default)
ALTER TYPE "UserChallengeStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';

-- AlterTable: use TEXT to avoid "unsafe use of new enum value in same transaction" error.
-- Subsequent migrations (20260605104034, 20260605104035) convert this column to the proper enum type.
ALTER TABLE "UserChallenges" DROP COLUMN IF EXISTS "challengeStatus";
ALTER TABLE "UserChallenges" DROP COLUMN IF EXISTS "status";
ALTER TABLE "UserChallenges" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ASSIGNED';
