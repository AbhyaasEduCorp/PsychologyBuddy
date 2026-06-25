-- AlterEnum: Add ASSIGNED to UserChallengeStatus enum
ALTER TYPE "UserChallengeStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';

