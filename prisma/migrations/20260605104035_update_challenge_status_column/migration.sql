-- Update UserChallenges status column to use enum type
-- Add temporary column with enum type
ALTER TABLE "UserChallenges" ADD COLUMN IF NOT EXISTS "status_new" "UserChallengeStatus";

-- Copy and convert existing values
UPDATE "UserChallenges" 
SET "status_new" = 
  CASE 
    WHEN "status"::text = 'ASSIGNED' THEN 'ASSIGNED'::"UserChallengeStatus"
    WHEN "status"::text = 'NOT_STARTED' THEN 'NOT_STARTED'::"UserChallengeStatus"
    WHEN "status"::text = 'IN_PROGRESS' THEN 'IN_PROGRESS'::"UserChallengeStatus"
    WHEN "status"::text = 'COMPLETED' THEN 'COMPLETED'::"UserChallengeStatus"
    WHEN "status"::text = 'EXPIRED' THEN 'EXPIRED'::"UserChallengeStatus"
    ELSE 'ASSIGNED'::"UserChallengeStatus"
  END;

-- Drop old column and rename new one
ALTER TABLE "UserChallenges" DROP COLUMN "status";
ALTER TABLE "UserChallenges" RENAME COLUMN "status_new" TO "status";

-- Set default
ALTER TABLE "UserChallenges" ALTER COLUMN "status" SET DEFAULT 'ASSIGNED'::"UserChallengeStatus";
ALTER TABLE "UserChallenges" ALTER COLUMN "status" SET NOT NULL;

-- Drop the challengeStatus column as we're consolidating to just status
ALTER TABLE "UserChallenges" DROP COLUMN IF EXISTS "challengeStatus";
