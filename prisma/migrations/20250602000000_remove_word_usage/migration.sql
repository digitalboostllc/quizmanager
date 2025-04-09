-- Drop the relation first
ALTER TABLE "WordUsage" DROP CONSTRAINT IF EXISTS "WordUsage_userId_fkey";

-- Drop the WordUsage table
DROP TABLE IF EXISTS "WordUsage"; 